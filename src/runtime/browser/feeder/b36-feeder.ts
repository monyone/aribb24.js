import demuxB36 from "../../../lib/demuxer/b36";
import { ALL_FPS_VALUES } from "../../../util/timecode";
import { toBrowserTokenWithoutBitmap } from "../types";
import Feeder, { FeederOption, FeederPresentationData, getTokenizeInformation, PartialFeederOption } from "./feeder";

export default class B36Feeder implements Feeder {
  private option: FeederOption;
  private captions: FeederPresentationData[];

  public constructor(b36: Uint8Array | ArrayBufferLike, fps: ALL_FPS_VALUES, option?: PartialFeederOption) {
    b36 = b36 instanceof Uint8Array ? b36 : new Uint8Array(b36);
    this.option = FeederOption.from(option);

    const { initialTime, pages } = demuxB36(b36, fps);
    this.captions = pages.filter((page) => page.tag === 'ActualPage').flatMap((page) => {
      try {
        const pts = page.displayTiming - initialTime + this.option.offset.time;
        const duration = (page.clearTiming - initialTime + this.option.offset.time) - pts;
        const statement = page.statement;
        const management = page.management;

        const entry = management.languages.find((entry) => entry.lang === statement.lang);
        if (entry == null) { return []; }
        const specification = getTokenizeInformation(entry.iso_639_language_code, entry.TCS, this.option);
        if (specification == null) { return []; }
        const [association, tokenizer, state] = specification;
        // B36 は 文字スーパー がないので、Bitmap を使わない.
        // なので、ビットマップを除外する
        const tokenized = toBrowserTokenWithoutBitmap(tokenizer.tokenize(statement));

        return [{
          pts,
          duration,
          state,
          info: {
            association,
            language: entry.iso_639_language_code,
          },
          data: tokenized,
        } satisfies FeederPresentationData];
      } catch (e) {
        this.option.logging.logger.error('B36 caption page decoding failed', e);
        return [];
      }
    });
  }

  public content(time: number): FeederPresentationData | null {
    {
      const first = this.captions[0];
      if (!first) { return null; }
      if (time < first.pts) { return null; }
    }

    let begin = 0, end = this.captions.length;
    while (begin + 1 < end) {
      const middle = Math.floor((begin + end) / 2);
      const middle_caption = this.captions[middle];
      const middle_pts = middle_caption.pts;

      if (middle_pts <= time) {
        begin = middle;
      } else {
        end = middle;
      }
    }

    return this.captions[begin] ?? null;
  }

  public clear(): void {
    this.captions = [];
  }

  public onAttach(): void {}
  public onDetach(): void {}
  public onSeeking(): void {}
  public destroy(): void {
    this.clear();
  }
}

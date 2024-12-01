import { ARIBB24CaptionManagement, ARIBB24CaptionStatement } from "../../../lib/demuxer/b24/datagroup";
import demuxB36 from "../../../lib/demuxer/b36";
import colortable from "../../colortable";
import { toBrowserTokenWithoutBitmap } from "../types";
import Feeder, { FeederOption, FeederPresentationData, getTokenizeInformation, PartialFeederOption } from "./feeder";

export default class B36Feeder implements Feeder {
  private option: FeederOption;
  private captions: FeederPresentationData[];

  public constructor(b36: ArrayBuffer, option?: PartialFeederOption) {
    this.option = FeederOption.from(option);

    const { initialTime, pages } = demuxB36(b36);
    this.captions = pages.filter((page) => page.tag === 'ActualPage').flatMap((page) => {
      const pts = page.displayTiming - initialTime;
      const duration = page.clearTiming - initialTime;
      const statement = page.statement;
      const management = page.management;

      const entry = management.languages.find((entry) => entry.lang === statement.lang);
      if (entry == null) { return []; }
      const specification = getTokenizeInformation(entry.iso_639_language_code, entry.TCS, this.option);
      if (specification == null) { return []; }
      const [association, tokenizer, state] = specification;
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
      } satisfies FeederPresentationData]
    });
  }

  public prepare(_: number): void {}

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

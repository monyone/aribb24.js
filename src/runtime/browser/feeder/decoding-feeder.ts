import AVLTree from '../../../util/avl';

import Feeder, { FeederOption, FeederDecodingData, FeederPresentationData, getTokenizeInformation, PartialFeederOption } from './feeder';
import demuxPES from '../../../lib/demuxer/b24/independent';
import demuxDatagroup, { ARIBB24CaptionManagement } from '../../../lib/demuxer/b24/datagroup'
import { ARIBB24ClearScreenToken } from '../../../lib/tokenizer/token';
import { initialState } from '../../../lib/parser/parser';
import { ARIBB24BrowserToken, toBrowserTokenWithBitmap } from '../types';
import colortable from '../../common/colortable';

type DecodingOrderedKey = {
  dts: number;
  lang?: number;
};

const calcDecodingOrder = ({ dts }: DecodingOrderedKey): number => {
  return dts;
}

const compareNumber = (a: number, b: number) => {
  return Math.sign(a - b) as (-1 | 0 | 1);
}

const compareKey = (a: DecodingOrderedKey, b: DecodingOrderedKey) => {
  if (compareNumber(a.dts, b.dts) !== 0) {
    return compareNumber(a.dts, b.dts);
  } else {
    return compareNumber(a.lang ?? -1, b.lang ?? -1)
  }
}

const closeTokenImageBitmap = (tokens: ARIBB24BrowserToken[]) => {
  for (const token of tokens) {
    if (token.tag !== 'Bitmap') { continue; }
    token.normal_bitmap.close();
    token.flashing_bitmap?.close();
  }
};

const closeValueImageBitmap = (value: FeederPresentationData) => {
  closeTokenImageBitmap(value.data);
}

export default abstract class DecodingFeeder implements Feeder {
  private option: FeederOption;
  private previousTime: number | null = null;
  private previousManagementData: ARIBB24CaptionManagement | null = null;
  private desiredLang: number | null = null;
  private decoder: AVLTree<DecodingOrderedKey, FeederDecodingData, number> = new AVLTree<DecodingOrderedKey, FeederDecodingData, number>(compareKey, compareNumber, calcDecodingOrder);
  private decoderBuffer: FeederDecodingData[] = [];
  private decodingPromise: Promise<void>;
  private decodingNotify: (() => void) = Promise.resolve;
  private abortController: AbortController = new AbortController();
  private present: AVLTree<number, FeederPresentationData> = new AVLTree<number, FeederPresentationData>(compareNumber, compareNumber, (pts) => pts);
  private isDestroyed: boolean = false;

  public constructor(option?: PartialFeederOption) {
    this.option = FeederOption.from(option);
    this.decodingPromise = new Promise((resolve) => {
      this.decodingNotify = resolve;
    });
    this.pump();
  }

  private notify(segment: FeederDecodingData | null): void {
    if (segment != null) {
      this.decoderBuffer.push(segment);
    } else {
      this.previousManagementData = null;
      this.abortController.abort();
      this.abortController = new AbortController();
    }

    this.decodingNotify?.();
  }

  private async *generator(signal: AbortSignal) {
    while (true) {
      await this.decodingPromise;
      this.decodingPromise = new Promise<void>((resolve) => {
        this.decodingNotify = resolve;
      });
      if (signal.aborted) {
        this.decoderBuffer = [];
        return;
      }

      const received = [... this.decoderBuffer];
      this.decoderBuffer = [];

      yield* received;
    }
  }

  private async pump() {
    while (!this.isDestroyed) {
      const signal = this.abortController.signal;
      for await (const { pts, caption } of this.generator(signal)) {
        if (caption.tag === 'CaptionManagement') {
          if (signal.aborted) { break; }
          if (this.previousManagementData?.group === caption.group) { continue; }

          if (typeof(this.option.receive.language) === 'number') {
            this.desiredLang = this.option.receive.language;
          } else {
            const name = (typeof(this.option.receive.language) === 'string') ? this.option.receive.language : this.option.receive.language[0];
            const index = (typeof(this.option.receive.language) === 'string') ? 0 : this.option.receive.language[1];
            const lang = [... caption.languages].sort(({ lang: fst }, { lang: snd}) => fst - snd).filter(({ iso_639_language_code }) => iso_639_language_code === name);
            this.desiredLang = lang?.[index]?.lang ?? null;
          }
          this.previousManagementData = caption;

          const already = this.present.get(pts);
          if (already != null) { closeValueImageBitmap(already); }
          this.present.insert(pts, {
            pts,
            duration: Number.POSITIVE_INFINITY,
            state: initialState,
            info: {
              association: 'UNKNOWN',
              language: 'und',
            },
            data: [ARIBB24ClearScreenToken.from()]
          });
          continue;
        }

        // Caption
        if (signal.aborted) { break; }
        if (this.previousManagementData == null) { continue; }

        const entry = this.previousManagementData.languages.find((entry) => entry.lang === caption.lang);
        if (entry == null) { continue; }
        if (this.desiredLang !== caption.lang) { continue; }

        const specification = getTokenizeInformation(entry.iso_639_language_code, entry.TCS, this.option);
        if (specification == null) { continue; }

        const [association, tokenizer, state] = specification;
        const tokenized = await toBrowserTokenWithBitmap(tokenizer.tokenize(caption), colortable);

        let duration = Number.POSITIVE_INFINITY;
        let elapse = 0;
        for (const token of tokenized) {
          if (token.tag === 'ClearScreen') {
            if (elapse === 0) { continue; }
            duration = elapse;
          } else if (token.tag === 'TimeControlWait') {
            elapse += token.seconds;
          }
        }

        if (signal.aborted) {
          closeTokenImageBitmap(tokenized);
          break;
        }
        const already = this.present.get(pts);
        if (already != null) { closeValueImageBitmap(already); }
        this.present.insert(pts, {
          pts,
          duration,
          state,
          info: {
            association,
            language: entry.iso_639_language_code,
          },
          data: tokenized
        });
      }
    }
  }

  protected feed(data: Uint8Array, pts: number, dts: number) {
    const datagroup = demuxPES(data);
    if (datagroup == null) { return; }
    if (datagroup.tag !== this.option.receive.type) { return; }

    const caption = demuxDatagroup(datagroup.data);
    if (caption == null) { return; }

    const lang = caption.tag === 'CaptionStatement' ? (caption.lang + 1) : 0;

    pts += this.option.offset.time;
    dts += this.option.offset.time;
    this.decoder.insert({ dts, lang }, { dts, pts, caption });
  }

  private prepare(time: number): void {
    this.previousTime = this.decoder.lower({ dts: time })?.dts ?? Number.NEGATIVE_INFINITY;
  }

  public content(time: number): FeederPresentationData | null {
    if (this.previousTime == null) { this.prepare(time); }
    for (const segment of this.decoder.range(this.previousTime!, time)) {
      this.notify(segment);
      this.previousTime = segment.dts;
    }
    return this.present.floor(time) ?? null;
  }

  public clear(): void {
    this.decoder.clear();
    this.disappearance();
  }

  protected disappearance(): void {
    this.present.forEach(closeValueImageBitmap);
    this.present.clear();
    this.previousTime = null;
    this.notify(null);
  }

  public onAttach(): void {
    this.disappearance();
  }

  public onDetach(): void {
    this.disappearance();
  }

  public onSeeking(): void {
    this.disappearance();
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.disappearance();
  }
}

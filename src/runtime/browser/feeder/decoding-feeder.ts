import AVLTree from '../../../util/avl';

import Feeder, { FeederOption, FeederDecodingData, FeederPresentationData, getTokenizeInformation, PartialFeederOption } from './feeder';
import extractPES from '../../../lib/tokenizer/b24/mpegts/extract';
import extractDatagroup, { CaptionManagement } from '../../../lib/tokenizer/b24/datagroup'
import { ClearScreen } from '../../../lib/tokenizer/token';
import { initialState } from '../../../lib/parser/parser';
import { toBrowserToken } from '../types';
import colortable from '../../colortable';

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

const closeValueImageBitmap = (value: FeederPresentationData) => {
  for (const token of value.data) {
    if (token.tag !== 'Bitmap') { continue; }
    token.normal_bitmap.close();
    token.flashing_bitmap?.close();
  }
}

export default abstract class DecodingFeeder implements Feeder {
  private option: FeederOption;
  private priviousTime: number | null = null;
  private priviousManagementData: CaptionManagement | null = null;
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

      const recieved = [... this.decoderBuffer];
      this.decoderBuffer = [];

      yield* recieved;
    }
  }

  private async pump() {
    while (!this.isDestroyed) {
      for await (const { pts, caption } of this.generator(this.abortController.signal)) {
        if (caption.tag === 'CaptionManagement') {
          if (this.priviousManagementData?.group === caption.group) { continue; }

          if (typeof(this.option.recieve.language) === 'number') {
            this.desiredLang = this.option.recieve.language;
          } else {
            const name = (typeof(this.option.recieve.language) === 'string') ? this.option.recieve.language : this.option.recieve.language[0];
            const index = (typeof(this.option.recieve.language) === 'string') ? 0 : this.option.recieve.language[1];
            const lang = [... caption.languages].sort(({ lang: fst }, { lang: snd}) => fst - snd).filter(({ iso_639_language_code }) => iso_639_language_code === name);
            this.desiredLang = lang?.[index]?.lang ?? null;
          }
          this.priviousManagementData = caption;

          this.present.insert(pts, {
            pts,
            duration: Number.POSITIVE_INFINITY,
            state: initialState,
            info: {
              association: 'UNKNOWN',
              language: 'und',
            },
            data: [ClearScreen.from()]
          });
          continue;
        }

        // Caption
        if (this.priviousManagementData == null) { continue; }

        const entry = this.priviousManagementData.languages.find((entry) => entry.lang === caption.lang);
        if (entry == null) { continue; }
        if (this.desiredLang !== caption.lang) { continue; }

        const specification = getTokenizeInformation(entry.iso_639_language_code, entry.TCS, this.option);
        if (specification == null) { continue; }

        const [association, tokenizer, state] = specification;
        const tokenized = await toBrowserToken(tokenizer.tokenize(caption), colortable);

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

  protected feed(data: ArrayBuffer, pts: number, dts: number) {
    const datagroup = extractPES(data);
    if (datagroup == null) { return; }
    if (datagroup.tag !== this.option.recieve.type) { return; }

    const caption = extractDatagroup(datagroup.data);
    if (caption == null) { return ; }

    const lang = caption.tag === 'CaptionStatement' ? (caption.lang + 1) : 0;

    pts += this.option.offset.pts;
    dts += this.option.offset.dts;
    this.decoder.insert({ dts, lang }, { pts, caption });
  }

  public prepare(time: number): void {
    this.priviousTime = time;
  }

  public content(time: number): FeederPresentationData | null {
    if (this.priviousTime != null) {
      for (const segment of this.decoder.range(this.priviousTime, time)) {
        this.notify(segment);
      }
    }
    this.priviousTime = time;
    return this.present.floor(time) ?? null;
  }

  public clear(): void {
    this.decoder.clear();
    this.disappearance();
  }

  private disappearance(): void {
    this.present.forEach(closeValueImageBitmap);
    this.present.clear();
    this.priviousTime = null;
    this.priviousManagementData = null;
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

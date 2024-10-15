import AVLTree from '../../util/avl';

import Feeder, { FeederOption, FeederDecodingData, FeederPresentationData, getTokenizeInformation } from './feeder';
import extractPES from '../../tokenizer/b24/mpegts/extract';
import extractDatagroup, { CaptionManagement } from '../../tokenizer/b24/datagroup'
import { ClearScreen } from '../../tokenizer/token';
import { initialState } from '../../parser/index';
import { UnreachableError } from '../../util/error';

type DecodingOrderedKey = {
  dts: number;
  lang?: number;
};

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

export default abstract class DecodingFeeder implements Feeder {
  private option: FeederOption;
  private priviousTime: number = Number.NEGATIVE_INFINITY;
  private priviousManagementData: CaptionManagement | null = null;
  private decoder: AVLTree<DecodingOrderedKey, FeederDecodingData> = new AVLTree<DecodingOrderedKey, FeederDecodingData>(compareKey);
  private decoderBuffer: FeederDecodingData[] = [];
  private decodingPromise: Promise<void>;
  private decodingNotify: (() => void) = Promise.resolve;
  private abortController: AbortController = new AbortController();
  private present: AVLTree<number, FeederPresentationData> = new AVLTree<number, FeederPresentationData>(compareNumber);
  private isDestroyed: boolean = false;

  public constructor(option?: Partial<FeederOption>) {
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
        if (this.option.recieve.language !== caption.lang && this.option.recieve.language !== entry?.iso_639_language_code) { continue; }

        const specification = getTokenizeInformation(entry.iso_639_language_code, this.option);
        if (specification == null) { continue; }

        const [association, tokenizer, state] = specification;
        const tokenized = tokenizer.tokenize(caption);

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

    const lang = caption.tag === 'CaptionStatement' ? caption.lang : 0;
    switch (datagroup.tag) {
      case 'Caption':
        this.decoder.insert({ dts, lang }, { pts, caption });
        break;
      case 'Superimpose':
        this.decoder.insert({ dts, lang }, { pts, caption });
        break;
      default:
        const exhaustive: never = datagroup;
        throw new UnreachableError(`Undefined data identifier in STD-B24 (${exhaustive})`);
    }
  }

  public content(time: number): FeederPresentationData | null {
    for (const segment of this.decoder.range({ dts: this.priviousTime }, { dts: time })) {
      this.notify(segment);
    }
    this.priviousTime = time;

    time -= this.option.timeshift;
    return this.present.floor(time) ?? null;
  }

  public clear(): void {
    this.decoder.clear();
    this.disappearance();
  }

  private disappearance(): void {
    this.present.clear();
    this.priviousTime = Number.NEGATIVE_INFINITY;
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

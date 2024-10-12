import AVLTree from '../../util/avl';

import Feeder, { FeederOption, FeederRawData, FeederTokenizedData } from './feeder';
import extractPES from '../../tokenizer/b24/mpegts/extract';
import extractDatagroup, { CaptionManagement } from '../../tokenizer/b24/datagroup'
import JPNJIS8Tokenizer from '../../tokenizer/b24/jis8/japan/index';
import { ClearScreen } from '../../tokenizer/token';


const compare = (a: number, b: number) => {
  return Math.sign(a - b) as (-1 | 0 | 1);
}

export default class ARIBB24MPEGTSFeeder implements Feeder {
  private option: FeederOption;
  private priviousTime: number | null = null;
  private priviousManagementData: CaptionManagement | null = null;
  private decode: AVLTree<number, FeederRawData> = new AVLTree<number, FeederRawData>(compare);
  private decodeBuffer: FeederRawData[] = [];
  private decodingPromise: Promise<void>;
  private decodingNotify: (() => void) = Promise.resolve;
  private abortController: AbortController = new AbortController();
  private present: AVLTree<number, FeederTokenizedData> = new AVLTree<number, FeederTokenizedData>(compare);
  private isDestroyed: boolean = false;

  public constructor(option?: Partial<FeederOption>) {
    this.option = FeederOption.from(option);
    this.decodingPromise = new Promise((resolve) => {
      this.decodingNotify = resolve;
    });
    this.pump();
  }

  private notify(segment: FeederRawData | null): void {
    if (segment != null) {
      this.decodeBuffer.push(segment);
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
        this.decodeBuffer = [];
        return;
      }

      const recieved = [... this.decodeBuffer];
      this.decodeBuffer = [];

      yield* recieved;
    }
  }

  private async pump() {
    while (!this.isDestroyed) {
      for await (const { pts, data } of this.generator(this.abortController.signal)) {
        // TODO: FIXME: NEED* 個々のロジックは外部に出す
        const datagroup = extractPES(data);
        if (datagroup == null) { continue; }
        if (datagroup.tag === 'Superimpose') { continue; } // TODO!

        const caption = extractDatagroup(datagroup.data);
        if (caption == null) { continue; }
        if (caption.tag === 'CaptionManagement') {
          if (this.priviousManagementData?.group === caption.group) { continue; }
          this.priviousManagementData = caption;
          this.present.insert(pts, { pts, duration: Number.POSITIVE_INFINITY, data: [ClearScreen.from()] });
          continue;
        }

        // Caption
        if (this.priviousManagementData == null) { continue; }

        const entry = this.priviousManagementData.languages.find((entry) => entry.lang === caption.lang);
        if (entry == null) { continue; }

        const tokenizer = new JPNJIS8Tokenizer({ usePUA: this.option.tokenizer.usePUA });
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

        this.present.insert(pts, { pts, duration, data: tokenized });
      }
    }
  }

  public feed(data: ArrayBuffer, pts: number, dts: number, timescale: number) {
    this.decode.insert(pts / timescale, { pts: pts / timescale , data });
  }

  public content(time: number): FeederTokenizedData | null {
    if (this.priviousTime != null) {
      for (const segment of this.decode.range(this.priviousTime, time)) {
        this.notify(segment);
      }
    }
    this.priviousTime = time;

    time -= this.option.timeshift;
    return this.present.floor(time) ?? null;
  }

  private clear(): void {
    this.present.clear();
    this.priviousTime = null;
    this.priviousManagementData = null;
    this.notify(null);
  }

  public onAttach(): void {
    this.clear();
  }

  public onDetach(): void {
    this.clear();
  }

  public onSeeking(): void {
    this.clear();
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.clear();
  }
}

import { ARIBB24ParserState } from "../../../../lib/parser/parser";
import CanvasRenderer from "./canvas-renderer";

import RenderingWorker from "./canvas-renderer-worker.worker?worker&inline";
import { FromMainToWorkerEventClear, FromMainToWorkerEventImageBitmap, FromMainToWorkerEventInitialize, FromMainToWorkerEventRender, FromMainToWorkerEventResize, FromMainToWorkerEventTerminate, FromWorkerToMainEvent, FromWorkerToMainEventImageBitmap } from "./canvas-renderer-worker.event";
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { ARIBB24BrowserToken, replaceDRCS } from "../../types";
import { PartialCanvasRendererOption } from "./canvas-renderer-option";

export default class CanvasWebWorkerRenderer extends CanvasRenderer {
  private buffer: OffscreenCanvas;
  private present: OffscreenCanvas;
  private terminated: boolean = false;
  private worker: Worker;
  private waitPromise: Promise<void> | null = null;
  private waitResolve: () => void = () => {};

  public constructor(option?: PartialCanvasRendererOption) {
    super(option);
    this.present = this.canvas.transferControlToOffscreen();
    this.buffer = new OffscreenCanvas(0, 0);
    this.worker = new RenderingWorker();
    this.worker.postMessage(FromMainToWorkerEventInitialize.from(this.present, this.buffer), [this.present, this.buffer]);
  }

  public resize(width: number, height: number): void {
    this.worker.postMessage(FromMainToWorkerEventResize.from(width, height));
  }

  public destroy(): void {
    this.worker.postMessage(FromMainToWorkerEventTerminate.from());
    const callback = (event: MessageEvent<FromWorkerToMainEvent>) => {
      if (event.data.type !== 'terminated') { return; }
      this.worker.removeEventListener('message', callback);
      this.worker.terminate();
      this.terminated = true;
    };
    this.worker.addEventListener('message', callback);
  }

  public clear(): void {
    this.worker.postMessage(FromMainToWorkerEventClear.from());
  }

  public render(initialState: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionAssociationInformation): void {
    this.worker.postMessage(FromMainToWorkerEventRender.from(initialState, replaceDRCS(tokens, this.option.replace.drcs), info, this.option));
  }

  public async getPresentationImageBitmap(): Promise<ImageBitmap | null> {
    // そもそも worker が終了してたら新規に受け付けはしない
    if (this.terminated) { return null; }

    while (this.waitPromise != null) {
      await this.waitPromise;
      if (this.waitPromise == null) { break; }
    }

    // Waiter
    this.waitPromise = new Promise((resolve) => {
      this.waitResolve = () => {
        this.waitPromise = null;
        this.waitResolve = () => {};
        resolve();
      };
    });
    if (this.terminated) { // 終了してたら、何もせず順番待ちを進める
      this.waitResolve();
      return null;
    }

    // ここは getPresentationImageBitmap がシリアルになってるので、複数の呼び出しは混在しない
    this.worker.postMessage(FromMainToWorkerEventImageBitmap.from());
    const promise: Promise<ImageBitmap | null> = new Promise((resolve) => {
      const callback = (event: MessageEvent<FromWorkerToMainEvent>) => {
        switch (event.data.type) {
          case 'imagebitmap':
            this.worker.removeEventListener('message', callback);
            resolve(event.data.bitmap);
            this.waitResolve();
            break;
          case 'terminated':
            this.worker.removeEventListener('message', callback);
            resolve(null);
            this.waitResolve();
            break;
        }
      }
      this.worker.addEventListener('message', callback);
    });

    return promise;
  }
}

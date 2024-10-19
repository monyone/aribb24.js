import { ARIBB24Token } from "../../../../tokenizer/token";
import { ARIBB24ParserState } from "../../../../parser/parser";
import CanvasRenderer from "./canvas-renderer";
import { RendererOption } from "../renderer-option";
import { replaceDRCS } from "../../../../tokenizer/b24/jis8/tokenizer";

import RenderingWorker from "./canvas-renderer-worker.worker?worker&inline";
import { FromMainToWorkerEventClear, FromMainToWorkerEventInitialize, FromMainToWorkerEventRender, FromMainToWorkerEventResize, FromWorkerToMainEvent, FromWorkerToMainEventImageBitmap } from "./canvas-renderer-worker.event";
import { CaptionLanguageInformation } from "../../../../tokenizer/b24/datagroup";

export default class CanvasWebWorkerRenderer extends CanvasRenderer {
  private buffer: OffscreenCanvas;
  private present: OffscreenCanvas;
  private worker: Worker;
  private waitPromise: Promise<void> | null = null;
  private waitResolve: () => void = () => {};

  public constructor(option?: Partial<RendererOption>) {
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
    this.worker.postMessage(FromMainToWorkerEventResize.from(0, 0));
    this.worker.terminate();
  }

  public clear(): void {
    this.worker.postMessage(FromMainToWorkerEventClear.from());
  }

  public render(initialState: ARIBB24ParserState, tokens: ARIBB24Token[], info: CaptionLanguageInformation): void {
    this.worker.postMessage(FromMainToWorkerEventRender.from(initialState, replaceDRCS(tokens, this.option.replace.drcs), info, this.option));
  }

  public async getPresentationImageBitmap(): Promise<ImageBitmap | null> {
    if (this.waitPromise != null) {
      await this.waitPromise;
      this.waitPromise = null;
      this.waitResolve = () => {};
    }

    // Waiter
    this.waitPromise = new Promise((resolve) => {
      this.waitResolve = resolve;
    });

    this.worker.postMessage(FromWorkerToMainEventImageBitmap.from());
    const promise: Promise<ImageBitmap | null> = new Promise((resolve) => {
      this.worker.addEventListener('message', (event: MessageEvent<FromWorkerToMainEvent>) => {
        switch (event.data.type) {
          case 'imagebitmap': {
            resolve(event.data.bitmap);
            this.waitResolve();
            return;
          }
        }
      }, { once: true });
    });

    return promise;
  }
}

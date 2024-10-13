import { ARIBB24Token } from "../../../tokenizer/token";
import { ARIBB24ParserState } from "../../../parser/index";
import CanvasRenderer from "./canvas-renderer";
import { RendererOption } from "../renderer-option";
import { replaceDRCS } from "../../../tokenizer/b24/jis8/tokenizer";

import RenderingWorker from "./canvas-renderer-worker.worker?worker&inline";
import { FromMainToWorkerEventClear, FromMainToWorkerEventInitialize, FromMainToWorkerEventRender, FromMainToWorkerEventResize } from "./canvas-renderer-worker.event";

export default class CanvasWebWorkerRenderer extends CanvasRenderer {
  private buffer: OffscreenCanvas;
  private present: OffscreenCanvas;
  private worker: Worker;

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

  public render(state: ARIBB24ParserState, tokens: ARIBB24Token[]): void {
    this.worker.postMessage(FromMainToWorkerEventRender.from(state, replaceDRCS(tokens, this.option.replace.drcs), this.option));
  }
}

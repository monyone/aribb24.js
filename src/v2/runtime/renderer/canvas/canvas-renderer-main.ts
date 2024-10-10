import { ARIBB24Token } from "../../../tokenizer/token";
import ARIBB24CanvasRenderer from "./canvas-renderer";
import { ARIBB24RendererOption } from "../renderer-option";
import ARIBB24RendererRenderingBufferFunc from "./canvas-renderer-strategy"
import ARIBB24RendererRenderingForegroundFunc from "./canvas-renderer-double-buffer"


export default class ARIBB24CanvasMainThreadRenderer extends ARIBB24CanvasRenderer {
  private buffer: HTMLCanvasElement;

  public constructor(option?: Partial<ARIBB24RendererOption>) {
    super(option);
    this.buffer = document.createElement('canvas');
  }

  public render(tokens: ARIBB24Token[]): void {
    if (!ARIBB24RendererRenderingBufferFunc(this.buffer, tokens, this.option)) { return; }
    if (!ARIBB24RendererRenderingForegroundFunc(this.canvas, this.buffer, this.option)) { return; }
  }
}

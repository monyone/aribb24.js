import { ARIBB24Token } from "../../../tokenizer/token";
import ARIBB24CanvasRenderer from "./canvas-renderer";
import { ARIBB24RendererOption } from "../renderer-option";
import ARIBB24RendererRenderingFunc from "./canvas-renderer-strategy"


export default class ARIBB24CanvasMainThreadRenderer extends ARIBB24CanvasRenderer {
  private buffer: HTMLCanvasElement;

  public constructor(option?: Partial<ARIBB24RendererOption>) {
    super(option);
    this.buffer = document.createElement('canvas');
  }

  public render(tokens: ARIBB24Token[]): void {
    ARIBB24RendererRenderingFunc(this.canvas, this.buffer, tokens, this.option);
  }
}

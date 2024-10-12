import { ARIBB24Token } from "../../../tokenizer/token";
import CanvasRenderer from "./canvas-renderer";
import { RendererOption } from "../renderer-option";
import RendererRenderingFunc from "./canvas-renderer-strategy"


export default class CanvasMainThreadRenderer extends CanvasRenderer {
  private buffer: HTMLCanvasElement;

  public constructor(option?: Partial<RendererOption>) {
    super(option);
    this.buffer = document.createElement('canvas');
  }

  public render(tokens: ARIBB24Token[]): void {
    RendererRenderingFunc(this.canvas, this.buffer, tokens, this.option);
  }
}

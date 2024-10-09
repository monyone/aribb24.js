import { ARIBB24Parser } from "../../parser/index";
import { ARIBB24Token } from "../../tokenizer/token";
import ARIBB24CanvasRenderer from "./canvas-renderer";
import colortable from "./colortable";
import { ARIBB24RendererOption } from "./renderer-option";

export default class ARIBB24CanvasMainThreadRenderer extends ARIBB24CanvasRenderer {
  private buffer: HTMLCanvasElement;

  public constructor(option?: Partial<ARIBB24RendererOption>) {
    super(option);
    this.buffer = document.createElement('canvas');
  }

  public render(tokens: ARIBB24Token[]): void {
    {
      const context = this.buffer.getContext('2d');
      if (context == null) { return; }

      ARIBB24CanvasRenderer.renderTokens(this.buffer, context, tokens, this.option);
    }
    {
      const context = this.canvas.getContext('2d');
      if (context == null) { return; }

      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.drawImage(this.buffer, 0, 0, this.canvas.width, this.canvas.height);
    }
  }
  public clear() {
    const context = this.canvas.getContext('2d');
    if (context == null) { return; }

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

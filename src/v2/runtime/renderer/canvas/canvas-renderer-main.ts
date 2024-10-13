import { ARIBB24Token } from "../../../tokenizer/token";
import { ARIBB24ParserState } from "../../../parser/index";
import CanvasRenderer from "./canvas-renderer";
import { RendererOption } from "../renderer-option";
import render from "./canvas-renderer-strategy"
import { replaceDRCS } from "../../../tokenizer/b24/jis8/tokenizer";

export default class CanvasMainThreadRenderer extends CanvasRenderer {
  private buffer: HTMLCanvasElement;

  public constructor(option?: Partial<RendererOption>) {
    super(option);
    this.buffer = document.createElement('canvas');
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public destroy(): void {
    this.resize(0, 0);
    this.buffer.width = this.buffer.height = 0;
  }

  public clear(): void {
    {
      const context = this.buffer.getContext('2d');
      if (context == null) { return; }

      context.clearRect(0, 0, this.buffer.width, this.buffer.height);
    }
    {
      const context = this.canvas.getContext('2d');
      if (context == null) { return; }

      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  public render(initialState: ARIBB24ParserState, tokens: ARIBB24Token[]): void {
    render(this.canvas, this.buffer, initialState, replaceDRCS(tokens, this.option.replace.drcs), this.option);
  }

  public getPresentationCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

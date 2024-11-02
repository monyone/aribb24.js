import { ARIBB24ParserState } from "../../../../lib/parser/parser";
import CanvasRenderer from "./canvas-renderer";
import render from "./canvas-renderer-strategy"
import { CaptionLanguageInformation } from "../../../../lib/tokenizer/b24/datagroup";
import { ARIBB24BrowserToken, replaceDRCS } from "../../types";
import { PartialCanvasRendererOption } from "./canvas-renderer-option";

export default class CanvasMainThreadRenderer extends CanvasRenderer {
  private buffer: HTMLCanvasElement;

  public constructor(option?: PartialCanvasRendererOption) {
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

  public render(initialState: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionLanguageInformation): void {
    render(this.canvas, this.buffer, initialState, replaceDRCS(tokens, this.option.replace.drcs), info, this.option);
  }

  public getPresentationCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

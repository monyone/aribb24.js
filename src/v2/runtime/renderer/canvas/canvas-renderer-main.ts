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

  public render(state: ARIBB24ParserState, tokens: ARIBB24Token[]): void {
    render(this.canvas, this.buffer, state, replaceDRCS(tokens, this.option.replace.drcs), this.option);
  }
}

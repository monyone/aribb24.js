import { ARIBB24Parser, ARIBB24ParserState } from "../../../parser/index";
import { CaptionLanguageInformation } from "../../../tokenizer/b24/datagroup";
import { replaceDRCS } from "../../../tokenizer/b24/jis8/tokenizer";
import { ARIBB24Token } from "../../../tokenizer/token";
import Renderer from "../renderer";
import { SVGDOMRendererOption } from "./svg-dom-renderer-option";
import render from "./svg-dom-renderer-strategy";

export default class SVGDOMRenderer implements Renderer {
  protected option: SVGDOMRendererOption;
  protected svg: SVGElement;

  public constructor(option?: Partial<SVGDOMRendererOption>) {
    this.option = SVGDOMRendererOption.from(option);
    // Setup SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.position = 'absolute';
    this.svg.style.top = this.svg.style.left = '0';
    this.svg.style.pointerEvents = 'none';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
  }

  public resize(width: number, height: number): void {};
  public destroy(): void {
    this.clear;
  }
  public clear(): void {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
  }
  public hide(): void {
    this.svg.style.visibility = 'hidden';
  }
  public show(): void {
    this.svg.style.visibility = 'visible';
  }
  public render(initialState: ARIBB24ParserState, tokens: ARIBB24Token[], info: CaptionLanguageInformation): void {
    render(this.svg, initialState, replaceDRCS(tokens, this.option.replace.drcs), info, this.option);
  }

  public onAttach(element: HTMLElement): void {
    element.appendChild(this.svg);
  }

  public onDetach(): void {
    this.svg.remove();
  }

  public onContainerResize(width: number, height: number): boolean { return false; }
  public onVideoResize(width: number, height: number): boolean { return false; }

  public onSeeking(): void {
    this.clear();
  }
}

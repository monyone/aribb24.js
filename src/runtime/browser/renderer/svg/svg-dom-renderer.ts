import { ARIBB24ParserState } from "../../../../lib/parser/parser";
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { ARIBB24BrowserToken, replaceDRCS } from "../../types";
import { shouldNotAssumeUseClearScreen } from "../quirk";
import Renderer from "../renderer";
import { PartialSVGDOMRendererOption, SVGDOMRendererOption } from "./svg-dom-renderer-option";
import render from "./svg-dom-renderer-strategy";

export default class SVGDOMRenderer implements Renderer {
  protected option: SVGDOMRendererOption;
  protected svg: SVGSVGElement;

  public constructor(option?: PartialSVGDOMRendererOption) {
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
    this.clear();
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
  public render(initialState: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionAssociationInformation): void {
    if (shouldNotAssumeUseClearScreen(info)) { this.clear(); }

    this.svg.style.visibility = 'hidden';
    render(this.svg, initialState, replaceDRCS(tokens, this.option.replace.drcs), info, this.option);
    this.svg.style.visibility = 'visible';
  }

  public onAttach(element: HTMLElement): void {
    element.appendChild(this.svg);
  }

  public onDetach(): void {
    this.svg.remove();
  }

  public onContainerResize(width: number, height: number): boolean { return false; }
  public onVideoResize(width: number, height: number): boolean { return false; }

  public onPlay(): void {
    if (!this.option.animation.pause) { return; }
    this.svg.unpauseAnimations();
  }
  public onPause(): void {
    if (!this.option.animation.pause) { return; }
    this.svg.pauseAnimations();
  }

  public onSeeking(): void {
    this.clear();
  }

  public getPresentationSVGElement(): SVGSVGElement {
    return this.svg;
  }
}

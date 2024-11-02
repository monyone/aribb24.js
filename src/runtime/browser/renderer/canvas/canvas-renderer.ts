import { ARIBB24ParserState } from "../../../../lib/parser/parser";
import { CaptionLanguageInformation } from "../../../../lib/demuxer/b24/datagroup";
import { ARIBB24BrowserToken } from "../../types";
import Renderer from "../renderer";
import { CanvasRendererOption, PartialCanvasRendererOption } from "./canvas-renderer-option";

export default abstract class CanvasRenderer implements Renderer {
  protected option: CanvasRendererOption;
  protected canvas: HTMLCanvasElement;

  public constructor(option?: PartialCanvasRendererOption) {
    this.option = CanvasRendererOption.from(option);
    // Setup Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  public abstract resize(width: number, height: number): void;
  public abstract destroy(): void;
  public abstract clear(): void;
  public hide(): void {
    this.canvas.style.visibility = 'hidden';
  }
  public show(): void {
    this.canvas.style.visibility = 'visible';
  }
  public abstract render(initialState: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionLanguageInformation): void;

  public onAttach(element: HTMLElement): void {
    element.appendChild(this.canvas);
  }

  public onDetach(): void {
    this.canvas.remove();
  }

  public onContainerResize(width: number, height: number): boolean {
    if (this.option.resize.target !== 'container') { return false; }

    this.clear();
    this.resize(width, height);
    return true;
  }

  public onVideoResize(width: number, height: number): boolean {
    if (this.option.resize.target !== 'video') { return false; }

    this.clear();
    this.resize(width, height);
    return true;
  }

  public onPlay(): void {}
  public onPause(): void {}

  public onSeeking(): void {
    this.clear();
  }
}

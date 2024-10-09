import { ARIBB24Token, Character } from "../../../tokenizer/token";
import ARIBB24Renderer from "../renderer";
import { ARIBB24CanvasRendererOption } from "./canvas-renderer-option";
import { ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24Parser } from "../../../parser/index";
import colortable from "../colortable";

export default abstract class ARIBB24CanvasRenderer implements ARIBB24Renderer {
  protected option: ARIBB24CanvasRendererOption;
  protected canvas: HTMLCanvasElement;

  public constructor(option?: Partial<ARIBB24CanvasRendererOption>) {
    this.option = ARIBB24CanvasRendererOption.from(option);
    // Setup Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.objectFit = 'contain';

    this.canvas.width = 1920;
    this.canvas.height = 1080;
  }

  public resize(width: number, height: number): void {
    if (this.canvas == null) { return; }

    this.canvas.width = width;
    this.canvas.height = height;
  }

  public destroy(): void {
    this.resize(0, 0);
  }

  public clear(): void {
    const context = this.canvas.getContext('2d');
    if (context == null) { return; }

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public abstract render(tokens: ARIBB24Token[]): void;

  public onAttach(element: HTMLElement): void {
    element.appendChild(this.canvas);
  }

  public onDetach(): void {
    this.canvas.remove();
  }

  public onContainerResize(element: HTMLElement): void {
    this.clear();
  }

  public onVideoResize(video: HTMLVideoElement): void {
    // noop
  }

  public onSeeking(): void {
    this.clear();
  }
}

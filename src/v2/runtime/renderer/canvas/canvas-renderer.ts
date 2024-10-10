import { ARIBB24Token } from "../../../tokenizer/token";
import ARIBB24Renderer from "../renderer";
import { ARIBB24CanvasRendererOption } from "./canvas-renderer-option";

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

  public onSeeking(): void {
    this.clear();
  }
}

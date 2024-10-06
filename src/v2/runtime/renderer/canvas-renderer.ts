import { ARIBB24Parser } from "../../parser/index";
import { ARIBB24Token } from "../../tokenizer/token";

import ARIBB24Renderer from "./renderer";
import { ARIBB24RenderOption } from "./renderer-option";

export default abstract class ARIBB24CanvasRenderer implements ARIBB24Renderer {
  protected option: ARIBB24RenderOption;
  protected canvas: HTMLCanvasElement;

  public constructor(option?: Partial<ARIBB24RenderOption>) {
    this.option = ARIBB24RenderOption.from(option);
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

  public abstract render(tokens: ARIBB24Token[]): void;
  public abstract clear(): void;

  public onattach(element: HTMLElement): void {
    element.appendChild(this.canvas);
  }

  public ondetach(element: HTMLElement): void {
    element.removeChild(this.canvas);
  }

  public onresize(tokens: ARIBB24Token[]): void {
    this.clear();
    this.render(tokens);
  }

  public onseeking(): void {
    this.clear();
  }
}

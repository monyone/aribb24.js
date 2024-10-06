import { ARIBB24Token } from "../../tokenizer/token";

export default interface ARIBB24Renderer {
  render(tokens: ARIBB24Token[]): void;
  clear(): void;
  destroy(): void;

  onattach(element: HTMLElement): void;
  ondetach(element: HTMLElement): void;
  onresize(tokens: ARIBB24Token[]): void;
  onseeking(): void;
}

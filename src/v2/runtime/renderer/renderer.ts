import { ARIBB24Token } from "../../tokenizer/token";

export default interface ARIBB24Renderer {
  render(tokens: ARIBB24Token[]): void;
  clear(): void;
  destroy(): void;

  onAttach(element: HTMLElement): void;
  onDetach(element: HTMLElement): void;
  onResize(tokens: ARIBB24Token[]): void;
  onSeeking(): void;
}

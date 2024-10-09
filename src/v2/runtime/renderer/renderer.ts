import { ARIBB24Token } from "../../tokenizer/token";

export default interface ARIBB24Renderer {
  render(tokens: ARIBB24Token[]): void;
  clear(): void;
  destroy(): void;

  onAttach(element: HTMLElement): void;
  onDetach(): void;
  onContainerResize(width: number, height: number): boolean;
  onVideoResize(width: number, height: number): boolean;
  onSeeking(): void;
}

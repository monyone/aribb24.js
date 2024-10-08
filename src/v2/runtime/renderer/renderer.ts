import { ARIBB24Token } from "../../tokenizer/token";

export default interface ARIBB24Renderer {
  render(tokens: ARIBB24Token[]): void;
  clear(): void;
  destroy(): void;

  onAttach(element: HTMLElement): void;
  onDetach(element: HTMLElement): void;
  onContainerResize(element: HTMLElement): void;
  onVideoResize(video: HTMLVideoElement): void;
  onSeeking(): void;
}

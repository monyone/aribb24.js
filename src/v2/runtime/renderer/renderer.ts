import { ARIBB24ParserState } from "../../parser/index";
import { ARIBB24Token } from "../../tokenizer/token";

export default interface Renderer {
  render(state: ARIBB24ParserState, tokens: ARIBB24Token[]): void;
  clear(): void;
  destroy(): void;

  onAttach(element: HTMLElement): void;
  onDetach(): void;
  onContainerResize(width: number, height: number): boolean;
  onVideoResize(width: number, height: number): boolean;
  onSeeking(): void;
}

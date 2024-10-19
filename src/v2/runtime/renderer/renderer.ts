import { ARIBB24ParserState } from "../../parser/parser";
import { CaptionLanguageInformation } from "../../tokenizer/b24/datagroup";
import { ARIBB24Token } from "../../tokenizer/token";

export default interface Renderer {
  render(initialState: ARIBB24ParserState, tokens: ARIBB24Token[], info: CaptionLanguageInformation): void;
  clear(): void;
  hide(): void;
  show(): void;
  destroy(): void;

  onAttach(element: HTMLElement): void;
  onDetach(): void;
  onContainerResize(width: number, height: number): boolean;
  onVideoResize(width: number, height: number): boolean;
  onPlay(): void;
  onPause(): void;
  onSeeking(): void;
}

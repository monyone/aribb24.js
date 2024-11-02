import { ARIBB24ParserState } from "../../../lib/parser/parser";
import { CaptionLanguageInformation } from "../../../lib/demuxer/b24/datagroup";
import { ARIBB24BrowserToken } from "../types";

export default interface Renderer {
  render(initialState: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionLanguageInformation): void;
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

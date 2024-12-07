import { ARIBB24ParserState, ARIBB24_CHARACTER_SIZE, initialState } from "../parser";

const sbtvd: Readonly<ARIBB24ParserState> = {
  ... initialState,
  size: ARIBB24_CHARACTER_SIZE.Middle,
} as const;

export default sbtvd;


import { ARIBB24ParserState, CHARACTER_SIZE, initialState } from "../parser";

const sbtvd: Readonly<ARIBB24ParserState> = {
  ... initialState,
  size: CHARACTER_SIZE.Middle,
} as const;

export default sbtvd;


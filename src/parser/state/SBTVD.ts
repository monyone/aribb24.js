import { ARIBB24ParserState, CHARACTER_SIZE, initialState } from "../parser";

const sbtvd: Readonly<ARIBB24ParserState> = {
  ... initialState,
  // association
  size: CHARACTER_SIZE.Middle,
}

export default sbtvd;


import { ARIBB24DRCSToken } from "../../../token";
import ascii from "../ascii";
import ARIBB24JIS8Tokenizer from "../tokenizer";
import latinExtension from "./latin-extension";
import specialCharacters from "./special-characters";

const BRAZIL_NORMAL_DICTS = {
  ASCII: { type: 'Character', code: 0x4a, bytes: 1, dict: ascii },
  LATIN_EXTENSION: { type: 'Character', code: 0x4b, bytes: 1, dict: latinExtension },
  SPECIAL_CHARACTERS: { type: 'Character', code: 0x4c, bytes: 1, dict: specialCharacters },
} as const;

// DRCS
const BRAZIL_DRCS_DICT = {} as const;

export default class ARIBB24BrazilianJIS8Tokenizer extends ARIBB24JIS8Tokenizer {
  public constructor() {
    super(0, 2,
      [BRAZIL_NORMAL_DICTS.ASCII, BRAZIL_NORMAL_DICTS.ASCII, BRAZIL_NORMAL_DICTS.LATIN_EXTENSION, BRAZIL_NORMAL_DICTS.SPECIAL_CHARACTERS],
      BRAZIL_NORMAL_DICTS,
      BRAZIL_DRCS_DICT,
      new Set([])
    );
  }
}

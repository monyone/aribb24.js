import { DRCS } from "../../../token";
import ascii from "../ascii";
import ARIBB24JIS8Tokenizer from "../tokenizer";
import latinExtension from "./latin-extension";
import specialCharacters from "./special-characters";

const BRAZIL_NORMAL_DICTS = {
  // Character
  ASCII: { type: 'Character', code: 0x4a, bytes: 1, dict: ascii },
  LATIN_EXTENSION: { type: 'Character', code: 0x4a, bytes: 1, dict: latinExtension },
  SPECIAL_CHARACTERS: { type: 'Character', code: 0x4a, bytes: 1, dict: specialCharacters },
} as const;

// DRCS
const BRAZIL_DRCS_DICT = {
  DRCS_0: { type: 'DRCS', code: 0x40, bytes: 2, dict: new Map<number, DRCS>() },
  DRCS_1: { type: 'DRCS', code: 0x41, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_2: { type: 'DRCS', code: 0x42, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_3: { type: 'DRCS', code: 0x43, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_4: { type: 'DRCS', code: 0x44, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_5: { type: 'DRCS', code: 0x45, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_6: { type: 'DRCS', code: 0x46, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_7: { type: 'DRCS', code: 0x47, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_8: { type: 'DRCS', code: 0x48, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_9: { type: 'DRCS', code: 0x49, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_10: { type: 'DRCS', code: 0x4a, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_11: { type: 'DRCS', code: 0x4b, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_12: { type: 'DRCS', code: 0x4c, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_13: { type: 'DRCS', code: 0x4d, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_14: { type: 'DRCS', code: 0x4e, bytes: 1, dict: new Map<number, DRCS>() },
  DRCS_15: { type: 'DRCS', code: 0x4f, bytes: 1, dict: new Map<number, DRCS>() },
  MACRO: { type: 'MACRO', code: 0x70, bytes: 1, dict: new Map<number, ArrayBuffer>([]) },
} as const;

export default class ARIBBrazilianJIS8Tokenizer extends ARIBB24JIS8Tokenizer {
  public constructor() {
    super(0, 2,
      [BRAZIL_NORMAL_DICTS.ASCII, BRAZIL_NORMAL_DICTS.ASCII, BRAZIL_NORMAL_DICTS.LATIN_EXTENSION, BRAZIL_NORMAL_DICTS.SPECIAL_CHARACTERS],
      BRAZIL_NORMAL_DICTS,
      BRAZIL_DRCS_DICT
    );
  }
}

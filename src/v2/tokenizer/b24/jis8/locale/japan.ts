import kanji from "../../../../../v1/constants/mapping/kanji";
import ascii from "../ascii";
import JIS8Tokenizer from "../jis8";
import hiragana from "./hiragana";
import katakana from "./katakana";
import symbol_pua from "./symbol-pua";
import symbol_unicode from "./symbol-unicode";


const JPN_NORMAL_DICTS = {
  // Character
  KANJI: { type: 'Character', code: 0x42, bytes: 2, dict: new Map<number, string>() }, // Dummy
  ASCII: { type: 'Character', code: 0x4a, bytes: 1, dict: ascii },
  HIRAGANA: { type: 'Character', code: 0x30, bytes: 1, dict: hiragana },
  KATANAKA: { type: 'Character', code: 0x31, bytes: 1, dict: katakana },
  MOSAIC_A: { type: 'Character', code: 0x32, bytes: 1, dict: new Map<number, string>() },
  MOSAIC_B: { type: 'Character', code: 0x33, bytes: 1, dict: new Map<number, string>() },
  MOSAIC_C: { type: 'Character', code: 0x34, bytes: 1, dict: new Map<number, string>() },
  MOSAIC_D: { type: 'Character', code: 0x35, bytes: 1, dict: new Map<number, string>() },
  P_ASCII: { type: 'Character', code: 0x36, bytes: 1, dict: new Map<number, string>() },
  P_HIRAGANA: { type: 'Character', code: 0x37, bytes: 1, dict: new Map<number, string>() },
  P_KATANAKA: { type: 'Character', code: 0x38, bytes: 1, dict: new Map<number, string>() },
  JIS_X_0201_KATAKANA: { type: 'Character', code: 0x49, bytes: 1, dict: new Map<number, string>() },
  JIS_X_0213_2004_KANJI_1: { type: 'Character', code: 0x39, bytes: 2, dict: new Map<number, string>() },
  JIS_X_0213_2004_KANJI_2: { type: 'Character', code: 0x3a, bytes: 2, dict: new Map<number, string>() },
  ADDITIONAL_SYMBOLS: { type: 'Character', code: 0x3b, bytes: 2, dict: new Map<number, string>() } // Dummy
} as const;

// DRCS
const JPN_DRCS_DICTS = {
  DRCS_0: { type: 'DRCS', code: 0x40, bytes: 2, dict: new Map<number, Uint8Array>() },
  DRCS_1: { type: 'DRCS', code: 0x41, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_2: { type: 'DRCS', code: 0x42, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_3: { type: 'DRCS', code: 0x43, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_4: { type: 'DRCS', code: 0x44, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_5: { type: 'DRCS', code: 0x45, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_6: { type: 'DRCS', code: 0x46, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_7: { type: 'DRCS', code: 0x47, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_8: { type: 'DRCS', code: 0x48, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_9: { type: 'DRCS', code: 0x49, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_10: { type: 'DRCS', code: 0x4a, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_11: { type: 'DRCS', code: 0x4b, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_12: { type: 'DRCS', code: 0x4c, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_13: { type: 'DRCS', code: 0x4d, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_14: { type: 'DRCS', code: 0x4e, bytes: 1, dict: new Map<number, Uint8Array>() },
  DRCS_15: { type: 'DRCS', code: 0x4f, bytes: 1, dict: new Map<number, Uint8Array>() },
  MACRO: { type: 'DRCS', code: 0x70, bytes: 1, dict: new Map<number, Uint8Array>() },
} as const;

export type JPNJIS8TokenizerOption = {
  usePUA: boolean
};

export default class JPNJIS8Tokenizer extends JIS8Tokenizer {
  static NORMAL_DICT_USE_PUA = { ... JPN_NORMAL_DICTS };
  static NORMAL_DICT_USE_UNICODE = { ... JPN_NORMAL_DICTS };
  static {
    const kanji_use_pua = new Map<number, string>();
    const kanji_use_unicode = new Map<number, string>();

    const decoder = new TextDecoder('euc-jp', { fatal: true });
    for (let ch1 = 0x21; ch1 < 0x75; ch1++) {
      for (let ch2 = 0x21; ch2 < 0x7f; ch2++) {
        try {
          const code = (ch1 << 8) | ch2;
          const decoded = decoder.decode((Uint8Array.from([ch1 | 0x80, ch2 | 0x80])))
          kanji_use_pua.set(code, decoded);
          kanji_use_unicode.set(code, decoded);
        } catch (e) {}
      }
    }

    for (let ch1 = 0x21; ch1 < 0x75; ch1++) {
      for (let ch2 = 0x21; ch2 < 0x7f; ch2++) {
        const code = (ch1 << 8) | ch2;
        if (!symbol_pua.has(code)) { continue; }
        kanji_use_pua.set(code, symbol_pua.get(code)!);
      }
    }

    for (let ch1 = 0x21; ch1 < 0x75; ch1++) {
      for (let ch2 = 0x21; ch2 < 0x7f; ch2++) {
        const code = (ch1 << 8) | ch2;
        if (!symbol_unicode.has(code)) { continue; }
        kanji_use_unicode.set(code, symbol_unicode.get(code)!);
      }
    }

    this.NORMAL_DICT_USE_PUA = {
      ... JPN_NORMAL_DICTS,
      KANJI: {
        ... JPN_NORMAL_DICTS.KANJI, dict: kanji_use_pua
      },
      ADDITIONAL_SYMBOLS:{
        ... JPN_NORMAL_DICTS.ADDITIONAL_SYMBOLS,
        dict: kanji_use_pua
      }
    };
    this.NORMAL_DICT_USE_UNICODE = {
      ... JPN_NORMAL_DICTS,
      KANJI: {
        ... JPN_NORMAL_DICTS.KANJI, dict: kanji_use_unicode
      },
      ADDITIONAL_SYMBOLS: {
        ... JPN_NORMAL_DICTS.ADDITIONAL_SYMBOLS,
        dict: kanji_use_unicode
      }
    };
  }

  public constructor(option?: JPNJIS8TokenizerOption) {
    super(0, 2,
      [JPN_NORMAL_DICTS.KANJI, JPN_NORMAL_DICTS.ASCII, JPN_NORMAL_DICTS.HIRAGANA, JPN_DRCS_DICTS.MACRO],
      option?.usePUA ? JPNJIS8Tokenizer.NORMAL_DICT_USE_PUA : JPNJIS8Tokenizer.NORMAL_DICT_USE_UNICODE,
      JPN_DRCS_DICTS
    );
  }
}

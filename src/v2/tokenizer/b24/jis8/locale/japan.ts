import ascii from "../ascii";
import JIS8Tokenizer from "../jis8";
import hiragana from "./hiragana";
import katakana from "./katakana";
import symbol_pua from "./symbol-pua";
import symbol_unicode from "./symbol-unicode";

const MACRO = new Map([
  [0x60, (Uint8Array.from([0x1b, 0x24, 0x42, 0x1b, 0x29, 0x4a, 0x1b, 0x2a, 0x30, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // 漢字系, 英数, ひらがな, マクロ, LS0, LS2R
  [0x61, (Uint8Array.from([0x1b, 0x24, 0x42, 0x1b, 0x29, 0x31, 0x1b, 0x2a, 0x30, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // 漢字系, カタカナ, ひらがな
  [0x62, (Uint8Array.from([0x1b, 0x24, 0x42, 0x1b, 0x29, 0x20, 0x41, 0x1b, 0x2a, 0x30, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // 漢字系, DRCS-1, ひらがな
  [0x63, (Uint8Array.from([0x1b, 0x28, 0x32, 0x1b, 0x29, 0x34, 0x1b, 0x2a, 0x35, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // モザイクA, モザイクC, モザイクD
  [0x64, (Uint8Array.from([0x1b, 0x28, 0x32, 0x1b, 0x29, 0x33, 0x1b, 0x2a, 0x35, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // モザイクA, モザイクB, モザイクD,
  [0x65, (Uint8Array.from([0x1b, 0x28, 0x32, 0x1b, 0x29, 0x20, 0x41, 0x1b, 0x2a, 0x35, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // モザイクA, DRCS-1, モザイクD,
  [0x66, (Uint8Array.from([0x1b, 0x28, 0x20, 0x41, 0x1b, 0x29, 0x20, 0x42, 0x1b, 0x2a, 0x20, 0x43, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // DRCS-1, DRCS-2, DRCS-3,
  [0x67, (Uint8Array.from([0x1b, 0x28, 0x20, 0x44, 0x1b, 0x29, 0x20, 0x45, 0x1b, 0x2a, 0x20, 0x46, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // DRCS-4, DRCS-5, DRCS-6,
  [0x68, (Uint8Array.from([0x1b, 0x28, 0x20, 0x47, 0x1b, 0x29, 0x20, 0x48, 0x1b, 0x2a, 0x20, 0x49, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // DRCS-7, DRCS-8, DRCS-9,
  [0x69, (Uint8Array.from([0x1b, 0x28, 0x20, 0x4a, 0x1b, 0x29, 0x20, 0x4b, 0x1b, 0x2a, 0x20, 0x4b, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // DRCS-10, DRCS-11, DRCS-12,
  [0x6a, (Uint8Array.from([0x1b, 0x28, 0x20, 0x4d, 0x1b, 0x29, 0x20, 0x4e, 0x1b, 0x2a, 0x20, 0x4f, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // DRCS-13, DRCS-14, DRCS-15,
  [0x6b, (Uint8Array.from([0x1b, 0x24, 0x42, 0x1b, 0x29, 0x20, 0x42, 0x1b, 0x2a, 0x30, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // 漢字系, DRCS-2, ひらがな
  [0x6c, (Uint8Array.from([0x1b, 0x24, 0x42, 0x1b, 0x29, 0x20, 0x43, 0x1b, 0x2a, 0x30, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // 漢字系, DRCS-3, ひらがな
  [0x6d, (Uint8Array.from([0x1b, 0x24, 0x42, 0x1b, 0x29, 0x20, 0x44, 0x1b, 0x2a, 0x30, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // 漢字系, DRCS-4, ひらがな
  [0x6e, (Uint8Array.from([0x1b, 0x28, 0x31, 0x1b, 0x29, 0x30, 0x1b, 0x2a, 0x4a, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // カタカナ, ひらがな, 英数,
  [0x6f, (Uint8Array.from([0x1b, 0x28, 0x4a, 0x1b, 0x29, 0x32, 0x1b, 0x2a, 0x20, 0x41, 0x1b, 0x2b, 0x20, 0x70, 0x0f, 0x1b, 0x7d])).buffer], // 英数, モザイクA, DRCS-1
])

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
  DRCS_0: { type: 'DRCS', code: 0x40, bytes: 2, dict: new Map<number, ArrayBuffer>() },
  DRCS_1: { type: 'DRCS', code: 0x41, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_2: { type: 'DRCS', code: 0x42, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_3: { type: 'DRCS', code: 0x43, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_4: { type: 'DRCS', code: 0x44, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_5: { type: 'DRCS', code: 0x45, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_6: { type: 'DRCS', code: 0x46, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_7: { type: 'DRCS', code: 0x47, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_8: { type: 'DRCS', code: 0x48, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_9: { type: 'DRCS', code: 0x49, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_10: { type: 'DRCS', code: 0x4a, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_11: { type: 'DRCS', code: 0x4b, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_12: { type: 'DRCS', code: 0x4c, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_13: { type: 'DRCS', code: 0x4d, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_14: { type: 'DRCS', code: 0x4e, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  DRCS_15: { type: 'DRCS', code: 0x4f, bytes: 1, dict: new Map<number, ArrayBuffer>() },
  MACRO: { type: 'MACRO', code: 0x70, bytes: 1, dict: MACRO },
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
          const decoded = decoder.decode((Uint8Array.from([ch1 | 0x80, ch2 | 0x80])));
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
    const USE_NORMAL_DICT = option?.usePUA ? JPNJIS8Tokenizer.NORMAL_DICT_USE_PUA : JPNJIS8Tokenizer.NORMAL_DICT_USE_UNICODE;
    super(0, 2,
      [USE_NORMAL_DICT.KANJI, USE_NORMAL_DICT.ASCII, USE_NORMAL_DICT.HIRAGANA, JPN_DRCS_DICTS.MACRO],
      USE_NORMAL_DICT,
      JPN_DRCS_DICTS
    );
  }
}

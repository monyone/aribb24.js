import { CHARACTER_SIZE } from "../../parser";
import { CaptionLanguageInformation } from "../../tokenizer/b24/datagroup";

import symbol_pua from "../../tokenizer/b24/jis8/ARIB/symbol-pua";
import symbol_unicode from "../../tokenizer/b24/jis8/ARIB/symbol-unicode";

const arib_symbols = new Set<string>([]);
for (let ch1 = 0x7a; ch1 < 0x7f; ch1++) {
  for (let ch2 = 0x21; ch2 < 0x7f; ch2++) {
    const code = (ch1 << 8) | ch2;
    if (!symbol_pua.has(code)) { continue; }

    const character = symbol_pua.get(code)!;
    switch (character) {
      case '年':
      case '月':
      case '日':
      case '円':
        break;
      default:
        arib_symbols.add(character);
        break;
    }
  }
}
for (let ch1 = 0x7a; ch1 < 0x7f; ch1++) {
  for (let ch2 = 0x21; ch2 < 0x7f; ch2++) {
    const code = (ch1 << 8) | ch2;
    if (!symbol_unicode.has(code)) { continue; }

    const character = symbol_unicode.get(code)!;
    switch (character) {
      case '年':
      case '月':
      case '日':
      case '円':
        break;
      default:
        arib_symbols.add(character);
        break;
    }
  }
}

export const shouldHalfWidth = (size: (typeof CHARACTER_SIZE)[keyof typeof CHARACTER_SIZE], info: CaptionLanguageInformation): boolean => {
  if (info.association === 'SBTVD') {
    return size === CHARACTER_SIZE.Small || size === CHARACTER_SIZE.Middle;
  }

  return size === CHARACTER_SIZE.Middle;
}

export const shouldUseARIBFont = (character: string): boolean => {
  if (!arib_symbols.has(character)) { return false; }
  return true;
}

export const shouldIgnoreSmallAsRuby = (size: (typeof CHARACTER_SIZE)[keyof typeof CHARACTER_SIZE], info: CaptionLanguageInformation): boolean => {
  // ARIB Caption in Japanese
  if (info.association !== 'ARIB') { return false; }
  if (info.language !== 'jpn') { return false; }
  return size === CHARACTER_SIZE.Small;
}

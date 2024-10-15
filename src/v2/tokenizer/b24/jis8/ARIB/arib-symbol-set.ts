import symbol_pua from "./symbol-pua";
import symbol_unicode from "./symbol-unicode";

const arib_symbols = new Set<string>([]);

for (let ch1 = 0x7a; ch1 < 0x7f; ch1++) {
  for (let ch2 = 0x21; ch2 < 0x7f; ch2++) {
    const code = (ch1 << 8) | ch2;
    if (!symbol_pua.has(code)) { continue; }
    arib_symbols.add(symbol_pua.get(code)!);
  }
}

for (let ch1 = 0x7a; ch1 < 0x7f; ch1++) {
  for (let ch2 = 0x21; ch2 < 0x7f; ch2++) {
    const code = (ch1 << 8) | ch2;
    if (!symbol_unicode.has(code)) { continue; }
    arib_symbols.add(symbol_unicode.get(code)!);
  }
}

export default arib_symbols;

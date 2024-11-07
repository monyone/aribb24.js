import pua from "../../../../tokenizer/b24/jis8/ARIB/symbol-pua";
import unicode from "../../../../tokenizer/b24/jis8/ARIB/symbol-unicode";

export default new Map([
  ... Array.from(pua.entries()).map(([k, v]) => [v, [(k & 0xFF00) >> 8, (k & 0x00FF) >> 0]]) as [string, [number, number]][],
  ... Array.from(unicode.entries()).map(([k, v]) => [v, [(k & 0xFF00) >> 8, (k & 0x00FF) >> 0]]) as [string, [number, number]][],
]);

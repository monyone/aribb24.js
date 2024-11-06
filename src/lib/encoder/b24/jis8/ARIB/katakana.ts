import katakana from "../../../../tokenizer/b24/jis8/ARIB/katakana";
import halfwidth from "../halfwidth";

export default new Map([
  ... Array.from(katakana.entries()).map(([k, v]) => [v, [k]]) as [string, [number]][],
  ... Array.from(katakana.entries()).filter(([k, v]) => halfwidth.has(v)).map(([k, v]) => [halfwidth.get(v)!, [k]]) as [string, [number]][],
]);

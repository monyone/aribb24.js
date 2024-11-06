import hiragana from "../../../../tokenizer/b24/jis8/ARIB/hiragana";
import halfwidth from "../halfwidth";

export default new Map([
  ... Array.from(hiragana.entries()).map(([k, v]) => [v, [k]]) as [string, [number]][],
  ... Array.from(hiragana.entries()).filter(([k, v]) => halfwidth.has(v)).map(([k, v]) => [halfwidth.get(v)!, [k]]) as [string, [number]][],
])

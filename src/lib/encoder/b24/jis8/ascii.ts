import ascii from "../../../tokenizer/b24/jis8/ascii";
import halfwidth from "./halfwidth"

export default new Map([
  ... Array.from(ascii.entries()).map(([k, v]) => [v, [k]]) as [string, [number]][],
  ... Array.from(ascii.entries()).filter(([_, v]) => halfwidth.has(v)).map(([k, v]) => [halfwidth.get(v)!, [k]]) as [string, [number]][],
]);

import special_characters from "../../../../tokenizer/b24/jis8/SBTVD/special-characters";

export default new Map(Array.from(special_characters.entries()).map(([k, v]) => [v, [k]]));

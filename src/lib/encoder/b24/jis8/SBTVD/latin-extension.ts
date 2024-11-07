import latin_extension from "../../../../tokenizer/b24/jis8/SBTVD/latin-extension";

export default new Map(Array.from(latin_extension.entries()).map(([k, v]) => [v, [k]]));

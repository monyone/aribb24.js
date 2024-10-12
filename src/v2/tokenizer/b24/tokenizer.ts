import { ARIBB24Token } from "../token";
import { CaptionData } from "./datagroup";

export default interface ARIBB24Tokenizer {
  tokenize(data: CaptionData): ARIBB24Token[];
  tokenizeStatement(arraybuffer: ArrayBuffer): ARIBB24Token[];
  tokenizeDRCS(bytes: 1 | 2, arraybuffer: ArrayBuffer): void;
}

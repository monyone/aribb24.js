import { UnreachableError } from "../../util/error";
import md5 from "../../util/md5";
import { ARIBB24Token, Bitmap, Character } from "../token";
import { CaptionData } from "./datagroup";

export default abstract class ARIBB24Tokenizer {
  public tokenize(data: CaptionData): ARIBB24Token[] {
    const result: ARIBB24Token[] = [];
    for (const unit of data.units) {
      switch (unit.tag) {
        case 'Statement':
          result.push(... this.tokenizeStatement(unit.data));
          break;
        case 'DRCS':
          this.processDRCS(unit.bytes, unit.data);
          break;
        case 'Bitmap':
          result.push(... this.tokenizeBitmap(unit.data));
          break;
        default:
          const exhaustive: never = unit;
          throw new UnreachableError(`Undefined DataUnit in STD-B24 ARIB Caption (${exhaustive})`);
      }
    }

    return result;
  }

  abstract tokenizeStatement(arraybuffer: ArrayBuffer): ARIBB24Token[];
  abstract processDRCS(bytes: 1 | 2, arraybuffer: ArrayBuffer): void;

  public tokenizeBitmap(arraybuffer: ArrayBuffer): ARIBB24Token[] {
    const uint8 = new Uint8Array(arraybuffer);
    let begin = 0;

    const x_position = (((uint8[begin] << 8) | uint8[begin + 1]) << 16) >> 16;
    begin += 2;
    const y_position = (((uint8[begin] << 8) | uint8[begin + 1]) << 16) >> 16;
    begin += 2;
    const number_of_flc_colors = uint8[begin];
    begin += 1;
    const flcColors = Array.from(uint8.subarray(begin, begin + number_of_flc_colors));
    begin += number_of_flc_colors;
    const pngHeaderSize = 8 /* PNG signature */ + 4 /* size */ + 4 /* 'IHDR' */ + 13 /* IHDR */ + 4 /* CRC32 */;
    if (begin + pngHeaderSize > uint8.byteLength) { return []; }

    return [Bitmap.from(x_position, y_position, flcColors, arraybuffer.slice(begin)) ];
  }
}

export const replaceDRCS = (tokens: ARIBB24Token[], replace: Map<string, string>): ARIBB24Token[] => {
  return tokens.map((token) => {
    if (token.tag !== 'DRCS') { return token; }
    const hash = md5(token.binary);

    if (replace.has(hash.toLowerCase()) || replace.has(hash.toUpperCase())) {
      return Character.from(replace.get(hash)!, false);
    } else {
      return token;
    }
  });
}

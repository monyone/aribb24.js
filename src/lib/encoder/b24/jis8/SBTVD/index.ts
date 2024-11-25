import { ARIBB24Token, ARIBB24BitmapToken, ARIBB24CharacterToken, ARIBB24DRCSToken, ARIBB24MosaicToken } from "../../../../tokenizer/token";
import ARIBB24Encoder from "../../encoder";
import md5 from "../../../../../util/md5";
import concat from "../../../../../util/concat";
import { NotImplementedError, NotUsedDueToStandardError, UnreachableError } from "../../../../../util/error";
import { ARIBB24DataUnit, ARIBB24DRCSDataUnit, ARIBB24StatementDataUnit } from "../../../../demuxer/b24/datagroup";
import { CONTROL_CODES } from "../../../../tokenizer/b24/tokenizer";
import { ESC_CODES } from "../../../../tokenizer/b24/jis8/tokenizer";
import ascii from "../ascii";
import latin_extension from "./latin-extension";
import special_characters from "./special-characters";


export default class ARIBB24BrazilianJIS8Encoder extends ARIBB24Encoder {
  static KANJI = new Map<string, [number, number]>();
  static ASCII = structuredClone(ascii);
  static LATIN_EXTENSION = structuredClone(latin_extension);
  static SPECIAL_CHARACTERS = structuredClone(special_characters);

  private drcs_md5_to_code = new Map<string, [number, number]>();
  private current_drcs_code: [number, number] = [0x21, 0x21];
  private drcs_units: ARIBB24DRCSDataUnit[] = [];

  public encode(tokens: ARIBB24Token[]): ARIBB24DataUnit[] {
    const statement_binaries = concat(Uint8Array.from([CONTROL_CODES.ESC, ESC_CODES.LS1R]).buffer, ... tokens.map(this.encodeTokenHandler));
    return [
      ... this.drcs_units,
      ARIBB24StatementDataUnit.from(statement_binaries),
    ];
  }

  public encodeCharacter({ character }: ARIBB24CharacterToken): ArrayBuffer {
    if (ARIBB24BrazilianJIS8Encoder.ASCII.has(character)) {
      return Uint8Array.from(ARIBB24BrazilianJIS8Encoder.ASCII.get(character)!).buffer;
    } else if (ARIBB24BrazilianJIS8Encoder.LATIN_EXTENSION.has(character)) {
      return Uint8Array.from([CONTROL_CODES.SS2, ... ARIBB24BrazilianJIS8Encoder.LATIN_EXTENSION.get(character)!]).buffer;
    } else if (ARIBB24BrazilianJIS8Encoder.SPECIAL_CHARACTERS.has(character)) {
      return Uint8Array.from([CONTROL_CODES.SS3, ... ARIBB24BrazilianJIS8Encoder.SPECIAL_CHARACTERS.get(character)!]).buffer;
    } else {
      throw new NotUsedDueToStandardError(`Unsupported Character in JIS8 Encoder`);
    }
  }

  public encodeDRCS(drcs: ARIBB24DRCSToken): ArrayBuffer {
    const hash = md5(drcs.binary);

    if (!this.drcs_md5_to_code.has(hash)) {
      if (this.current_drcs_code[0] === 0x7F && this.current_drcs_code[1] === 0x7F) {
        // too many DRCS replace 〓
        return Uint8Array.from(ARIBB24BrazilianJIS8Encoder.KANJI.get('〓')!).buffer;
      }

      const header = Uint8Array.from([
        1, // Number Of Code
        this.current_drcs_code[0], // Character Code
        this.current_drcs_code[1], // Character Code
        1, // Number Of Font
        0, // mode
        (2 ** drcs.depth) - 2, // color - 2
        drcs.width, // width,
        drcs.width, // height
      ]).buffer;

      this.drcs_units.push(ARIBB24DRCSDataUnit.from(concat(header, drcs.binary), 2));
      this.drcs_md5_to_code.set(hash, structuredClone(this.current_drcs_code));
      this.current_drcs_code[1]++;
      if (this.current_drcs_code[1] > 0x7F) {
        this.current_drcs_code[0]++;
        this.current_drcs_code[1] = 0;
      }
    }

    return Uint8Array.from([CONTROL_CODES.ESC, 0x24, 0x29, 0x20, 0x40, CONTROL_CODES.LS1, ... this.drcs_md5_to_code.get(hash)!, CONTROL_CODES.LS0]);
  }

  public encodeBitmap(bitmap: ARIBB24BitmapToken): ArrayBuffer {
    throw new NotImplementedError('Bitmap is Not Implemented');
  }

  public encodeMosaic(mozaic: ARIBB24MosaicToken): ArrayBuffer {
    throw new NotImplementedError('Mozaic Character is Not Implemented');
  }
}

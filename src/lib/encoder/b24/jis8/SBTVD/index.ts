import { ARIBB24Token, ARIBB24BitmapToken, ARIBB24CharacterToken, ARIBB24DRCSToken, ARIBB24MosaicToken } from "../../../../tokenizer/token";
import ARIBB24Encoder from "../../encoder";
import md5 from "../../../../../util/md5";
import concat from "../../../../../util/concat";
import { NotImplementedError, NotUsedDueToOperationGuidelineError, NotUsedDueToStandardError, UnreachableError } from "../../../../../util/error";
import { ARIBB24DataUnit, ARIBB24DRCSDataUnit, ARIBB24StatementDataUnit } from "../../../../demuxer/b24/datagroup";
import { CONTROL_CODES } from "../../../../tokenizer/b24/tokenizer";
import { ESC_CODES } from "../../../../tokenizer/b24/jis8/tokenizer";
import ascii from "../ascii";
import latin_extension from "./latin-extension";
import special_characters from "./special-characters";


export default class ARIBB24BrazilianJIS8Encoder extends ARIBB24Encoder {
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
    throw new NotImplementedError('DRCS is Not Implemented');
  }

  public encodeBitmap(bitmap: ARIBB24BitmapToken): ArrayBuffer {
    throw new NotImplementedError('Bitmap is Not Implemented');
  }

  public encodeMosaic(mozaic: ARIBB24MosaicToken): ArrayBuffer {
    throw new NotImplementedError('Mozaic Character is Not Implemented');
  }
}

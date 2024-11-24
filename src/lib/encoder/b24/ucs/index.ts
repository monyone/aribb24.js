import { ARIBB24Token, Bitmap, Character, DRCS, Mosaic } from "../../../tokenizer/token";
import ARIBB24Encoder from "../encoder";
import md5 from "../../../../util/md5";
import concat from "../../../../util/concat";
import { NotImplementedError } from "../../../../util/error";
import { ARIBB24DataUnit, ARIBB24DRCSDataUnit, ARIBB24StatementDataUnit } from "../../../demuxer/b24/datagroup";

export default class ARIBB24UTF8Encoder extends ARIBB24Encoder {
  private current_drcs_code = 0xEC00;
  private drcs_units: ARIBB24DRCSDataUnit[] = [];
  private drcs_md5_to_code = new Map<string, number>();

  private encoder = new TextEncoder();

  public encodeCharacter({ character }: Character): ArrayBuffer {
    return this.encoder.encode(character).buffer;
  }

  public encode(tokens: ARIBB24Token[]): ARIBB24DataUnit[] {
    const statement_binaries = concat(... tokens.map(this.encodeTokenHandler));
    return [
      ... this.drcs_units,
      ARIBB24StatementDataUnit.from(statement_binaries),
    ];
  }

  public encodeControl(control: Exclude<ARIBB24Token, Character | DRCS | Bitmap | Mosaic>): ArrayBuffer {
    switch (control.tag) {
      // C0
      case 'Null':
      case 'Bell':
      case 'ActivePositionBackward':
      case 'ActivePositionForward':
      case 'ActivePositionDown':
      case 'ActivePositionUp':
      case 'ClearScreen':
      case 'ActivePositionReturn':
      case 'ParameterizedActivePositionForward':
      case 'Cancel':
      case 'ActivePositionSet':
      case 'RecordSeparator':
      case 'UnitSeparator':
      case 'Space':
      case 'Delete':
        return super.encodeControl(control);
      // C1
      default:
        return concat(Uint8Array.from([0xC2]).buffer, super.encodeControl(control));
    }
  }

  public encodeDRCS(drcs: DRCS): ArrayBuffer {
    const hash = md5(drcs.binary);

    if (!this.drcs_md5_to_code.has(hash)) {
      if (this.current_drcs_code > 0xF8FF) {
        // too many DRCS replace 〓
        return this.encoder.encode('〓');
      }

      const header = Uint8Array.from([
        1, // Number Of Code
        (this.current_drcs_code & 0xFF00) >> 8, // Character Code
        (this.current_drcs_code & 0x00FF) >> 0, // Character Code
        1, // Number Of Font
        0, // mode
        (2 ** drcs.depth) - 2, // color - 2
        drcs.width, // width,
        drcs.width, // height
      ]).buffer;

      this.drcs_units.push(ARIBB24DRCSDataUnit.from(concat(header, drcs.binary), 2));
      this.drcs_md5_to_code.set(hash, this.current_drcs_code);
      this.current_drcs_code++;
    }

    const code = this.drcs_md5_to_code.get(hash)!;
    if (drcs.combining === '') {
      return this.encoder.encode(String.fromCodePoint(code)).buffer;
    } else {
      return concat(this.encoder.encode(String.fromCodePoint(code)).buffer, this.encodeCharacter(Character.from(drcs.combining)));
    }
  }

  public encodeBitmap(bitmap: Bitmap): ArrayBuffer {
    throw new NotImplementedError('Bitmap is Not Implemented');
  }

  public encodeMosaic(mozaic: Mosaic): ArrayBuffer {
    throw new NotImplementedError('Mozaic Character is Not Implemented');
  }
}

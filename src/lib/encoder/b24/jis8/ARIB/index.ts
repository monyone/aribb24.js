import { ARIBB24Token, Bitmap, Character, DRCS, Mosaic } from "../../../../tokenizer/token";
import ARIBB24Encoder from "../../encoder";
import md5 from "../../../../../util/md5";
import concat from "../../../../../util/concat";
import { NotImplementedError, NotUsedDueToStandardError, UnreachableError } from "../../../../../util/error";
import { DataUnit, DRCSDataUnit, StatementDataUnit } from "../../../../demuxer/b24/datagroup";
import { CONTROL_CODES } from "../../../../tokenizer/b24/tokenizer";
import { ESC_CODES } from "../../../../tokenizer/b24/jis8/tokenizer";
import hiragana from "./hiragana";
import ascii from "../ascii";
import katakana from "./katakana";

export default class ARIBB24JapaneseJIS8Encoder extends ARIBB24Encoder {
  static KANJI = new Map<string, [number, number]>();
  static ASCII = structuredClone(ascii);
  static HIRAGANA = structuredClone(hiragana);
  static KATAKANA = structuredClone(katakana);

  static {
    const decoder = new TextDecoder('euc-jp', { fatal: true });
    for (let ch1 = 0x21; ch1 < 0x75; ch1++) {
      for (let ch2 = 0x21; ch2 < 0x7f; ch2++) {
        try {
          const decoded = decoder.decode((Uint8Array.from([ch1 | 0x80, ch2 | 0x80])));
          ARIBB24JapaneseJIS8Encoder.KANJI.set(decoded, [ch1, ch2]);
        } catch (e) {}
      }
    }
  }

  private mode: 'MACRO0' | 'MACRO1' = 'MACRO0';

  private drcs_md5_to_code = new Map<string, [number, number]>();
  private current_drcs_code: [number, number] = [0x21, 0x21];
  private drcs_units: DRCSDataUnit[] = [];

  public encode(tokens: ARIBB24Token[]): DataUnit[] {
    const statement_binaries = concat(Uint8Array.from([CONTROL_CODES.ESC, ESC_CODES.LS1R]).buffer, ... tokens.map(this.encodeTokenHandler));
    return [
      ... this.drcs_units,
      StatementDataUnit.from(statement_binaries),
    ];
  }

  public encodeCharacter({ character }: Character): ArrayBuffer {
    if (ARIBB24JapaneseJIS8Encoder.ASCII.has(character)) {
      switch (this.mode) {
        case 'MACRO0':
          return Uint8Array.from([CONTROL_CODES.ESC, ESC_CODES.LS1R, ... ARIBB24JapaneseJIS8Encoder.ASCII.get(character)!.map((elem) => elem | 0x80)]).buffer;
        case 'MACRO1':
          this.mode = 'MACRO0';
          return Uint8Array.from([CONTROL_CODES.SS3, 0x60 /* MACRO-0 */, CONTROL_CODES.ESC, ESC_CODES.LS1R, ... ARIBB24JapaneseJIS8Encoder.ASCII.get(character)!.map((elem) => elem | 0x80)]).buffer;
        default:
          const exhaustive: never = this.mode;
          throw new UnreachableError(`Undefined mode in encoder (${exhaustive})`);
      }
    } else if (ARIBB24JapaneseJIS8Encoder.HIRAGANA.has(character)) {
      return Uint8Array.from([CONTROL_CODES.SS2, ... ARIBB24JapaneseJIS8Encoder.HIRAGANA.get(character)!]).buffer;
    } else if (ARIBB24JapaneseJIS8Encoder.KATAKANA.has(character)) {
      switch (this.mode) {
        case 'MACRO0':
          this.mode = 'MACRO1';
          return Uint8Array.from([CONTROL_CODES.SS3, 0x61 /* MACRO1 */, CONTROL_CODES.ESC, ESC_CODES.LS1R, ... ARIBB24JapaneseJIS8Encoder.KATAKANA.get(character)!.map((elem) => elem | 0x80)]).buffer;
        case 'MACRO1':
          return Uint8Array.from([CONTROL_CODES.ESC, ESC_CODES.LS1R, ... ARIBB24JapaneseJIS8Encoder.KATAKANA.get(character)!.map((elem) => elem | 0x80)]).buffer;
        default:
          const exhaustive: never = this.mode;
          throw new UnreachableError(`Undefined mode in encoder (${exhaustive})`);
      }
    } else if (ARIBB24JapaneseJIS8Encoder.KANJI.has(character)) {
      return Uint8Array.from(ARIBB24JapaneseJIS8Encoder.KANJI.get(character)!).buffer;
    } else {
      throw new NotUsedDueToStandardError(`Unsupported Character in JIS8 Encoder`);
    }
  }

  public encodeDRCS(drcs: DRCS): ArrayBuffer {
    const hash = md5(drcs.binary);

    if (!this.drcs_md5_to_code.has(hash)) {
      if (this.current_drcs_code[0] === 0x7F && this.current_drcs_code[1] === 0x7F) {
        // too many DRCS replace 〓
        return Uint8Array.from(ARIBB24JapaneseJIS8Encoder.KANJI.get('〓')!).buffer;
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

      this.drcs_units.push(DRCSDataUnit.from(concat(header, drcs.binary), 2));
      this.drcs_md5_to_code.set(hash, structuredClone(this.current_drcs_code));
      this.current_drcs_code[1]++;
      if (this.current_drcs_code[1] > 0x7F) {
        this.current_drcs_code[0]++;
        this.current_drcs_code[1] = 0;
      }
    }

    this.mode = 'MACRO0';
    return Uint8Array.from([CONTROL_CODES.ESC, 0x24, 0x29, 0x20, 0x40, ... this.drcs_md5_to_code.get(hash)!.map((elem) => elem | 0x80), CONTROL_CODES.SS3, 0x60]);
  }

  public encodeBitmap(bitmap: Bitmap): ArrayBuffer {
    throw new NotImplementedError('Bitmap is Not Implemented');
  }

  public encodeMosaic(mozaic: Mosaic): ArrayBuffer {
    throw new NotImplementedError('Mozaic Character is Not Implemented');
  }
}

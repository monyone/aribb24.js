import { UnreachableError } from "../../util/error";
import md5 from "../../util/md5";
import { ARIBB24Token, Bitmap, Character } from "../token";
import { CaptionData } from "./datagroup";

export const CONTROL_CODES = {
  NUL: 0x00,
  BEL: 0x07,
  APB: 0x08,
  APF: 0x09,
  APD: 0x0a,
  APU: 0x0b,
  CS:  0x0c,
  APR: 0x0d,
  LS1: 0x0e,
  LS0: 0x0f,
  PAPF: 0x16,
  CAN: 0x18,
  SS2: 0x19,
  ESC: 0x1b,
  APS: 0x1c,
  SS3: 0x1d,
  RS: 0x1e,
  US: 0x1f,
  SP: 0x20,
  DEL: 0x7f,
  BKF: 0x80,
  RDF: 0x81,
  GRF: 0x82,
  YLF: 0x83,
  BLF: 0x84,
  MGF: 0x85,
  CNF: 0x86,
  WHF: 0x87,
  SSZ: 0x88,
  MSZ: 0x89,
  NSZ: 0x8a,
  SZX: 0x8b,
  COL: 0x90,
  FLC: 0x91,
  CDC: 0x92,
  POL: 0x93,
  WMM: 0x94,
  MACRO: 0x95,
  HLC: 0x97,
  RPC: 0x98,
  SPL: 0x99,
  STL: 0x9a,
  CSI: 0x9b,
  TIME: 0x9d,
} as const;

export const CSI_CODE = {
  GSM: 0x42,
  SWF: 0x53,
  CCC: 0x54,
  SDF: 0x56,
  SSM: 0x57,
  SHS: 0x58,
  SVS: 0x59,
  PLD: 0x5b,
  PLU: 0x5c,
  GAA: 0x5d,
  SRC: 0x5e,
  SDP: 0x5f,
  ACPS: 0x61,
  TCC: 0x62,
  ORN: 0x63,
  MDF: 0x64,
  CFS: 0x65,
  XCS: 0x66,
  SCR: 0x67,
  PRA: 0x68,
  ACS: 0x69,
  UED: 0x6a,
  RCS: 0x6e,
  SCS: 0x6f,
} as const;

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

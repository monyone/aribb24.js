import { ByteStream } from "../../../../util/bytestream";

import type { ARIBB24Token } from '../../token';
import { DRCS, Character } from "../../token";
import ARIBB24Tokenizer, { CONTROL_CODES, CSI_CODE, processC0, processC1 } from "../tokenizer";
import { UnreachableError } from "../../../../util/error";

export const ESC_CODES = {
  LS2: 0x6e,
  LS3: 0x6f,
  LS1R: 0x7e,
  LS2R: 0x7d,
  LS3R: 0x7c,
} as const;

export const DictEntryType = {
  Character: 'Character',
  DRCS: 'DRCS',
  MACRO: 'MACRO',
} as const;
export type CharacterDictEntry = {
  type: (typeof DictEntryType.Character),
  code: number;
  bytes: number;
  dict: Map<number, string>
};
export type DRCSDictEntry = {
  type: (typeof DictEntryType.DRCS),
  code: number;
  bytes: number;
  dict: Map<number, DRCS>
};
export type MacroDictEntry = {
  type: (typeof DictEntryType.MACRO),
  code: number;
  bytes: number;
  dict: Map<number, ArrayBuffer>
};

export type DictEntry = CharacterDictEntry | DRCSDictEntry | MacroDictEntry;

export default abstract class ARIBB24JIS8Tokenizer extends ARIBB24Tokenizer {
  private GL: 0 | 1 | 2 | 3;
  private GR: 0 | 1 | 2 | 3;
  private GB: [DictEntry, DictEntry, DictEntry, DictEntry];
  private character_dicts: Record<string, CharacterDictEntry>;
  private drcs_dicts: Record<string, DRCSDictEntry | MacroDictEntry>;
  private non_spacing: Set<string>;

  public constructor(GL: 0 | 1 | 2 | 3, GR: 0 | 1 | 2 | 3, GB: [DictEntry, DictEntry, DictEntry, DictEntry], character_dicts: Record<string, CharacterDictEntry>, drcs_dicts: Record<string, DRCSDictEntry | MacroDictEntry>, non_spacing: Set<string>) {
    super();
    this.GL = GL;
    this.GR = GR;
    this.GB = GB;
    this.character_dicts = character_dicts;
    this.drcs_dicts = structuredClone(drcs_dicts);
    this.non_spacing = non_spacing;
  }

  public tokenizeStatement(arraybuffer: ArrayBuffer): ARIBB24Token[] {
    const stream = new ByteStream(arraybuffer);
    const result: ARIBB24Token[] = [];

    while (!stream.isEmpty()) {
      if (0x20 < stream.peekU8() && stream.peekU8() < 0x7F) {
        let code = 0;
        for (let i = 0; i < this.GB[this.GL].bytes; i++) {
          code <<= 8;
          code |= (stream.readU8() & 0x7F);
        }

        const { type, dict } = this.GB[this.GL];

        switch (type) {
          case 'Character':
            if (dict.has(code)) {
              const ch = dict.get(code)!;
              const non_spacing = this.non_spacing.has(ch);
              result.push(Character.from(ch, non_spacing));
            }
            break;
          case 'DRCS':
            if (dict.has(code)) {
              const { width, height, depth, binary } = dict.get(code)!;
              result.push(DRCS.from(width, height, depth, binary));
            }
            break;
          case 'MACRO':
            if (dict.has(code)) { result.push(... this.tokenizeStatement(dict.get(code)!)); }
            break;
          default:
            const exhaustive: never = type;
            throw new UnreachableError(`Undefined Dict Type in STD-B24 ARIB Caption (${exhaustive})`);
        }

        continue;
      } else if (0xA0 < stream.peekU8() && stream.peekU8() < 0xFF) {
        let code = 0;
        for (let i = 0; i < this.GB[this.GR].bytes; i++) {
          code <<= 8;
          code |= (stream.readU8() & 0x7F);
        }

        const { type, dict } = this.GB[this.GR];
        switch (type) {
          case 'Character':
            if (dict.has(code)) {
              const ch = dict.get(code)!;
              const non_spacing = this.non_spacing.has(ch);
              result.push(Character.from(ch, non_spacing));
            }
            break;
          case 'DRCS':
            if (dict.has(code)) {
              const { width, height, depth, binary } = dict.get(code)!;
              result.push(DRCS.from(width, height, depth, binary));
            }
            break;
          case 'MACRO':
            if (dict.has(code)) { result.push(... this.tokenizeStatement(dict.get(code)!)); }
            break;
          default:
            const exhaustive: never = type;
            throw new UnreachableError(`Undefined Dict Type in STD-B24 ARIB Caption (${exhaustive})`);
        }

        continue;
      }

      const control = stream.peekU8() as (typeof CONTROL_CODES)[keyof typeof CONTROL_CODES];
      switch (control) {
        case CONTROL_CODES.LS1: {
          stream.readU8();
          this.GL = 1;
          break;
        }
        case CONTROL_CODES.LS0: {
          stream.readU8();
          this.GL = 0;
          break;
        }
        case CONTROL_CODES.SS2: {
          stream.readU8();
          let code = 0;
          for (let i = 0; i < this.GB[2].bytes; i++) {
            code <<= 8;
            code |= (stream.readU8() & 0x7F);
          }

          const { type, dict } = this.GB[2];

          switch (type) {
            case 'Character':
              if (dict.has(code)) {
                const ch = dict.get(code)!;
                const non_spacing = this.non_spacing.has(ch);
                result.push(Character.from(ch, non_spacing));
              }
              break;
            case 'DRCS':
              if (dict.has(code)) {
                const { width, height, depth, binary } = dict.get(code)!;
                result.push(DRCS.from(width, height, depth, binary));
              }
              break;
            case 'MACRO':
              if (dict.has(code)) { result.push(... this.tokenizeStatement(dict.get(code)!)); }
              break;
            default:
              const exhaustive: never = type;
              throw new UnreachableError(`Undefined Dict Type in STD-B24 ARIB Caption (${exhaustive})`);
          }

          break;
        }
        case CONTROL_CODES.ESC: {
          stream.readU8();
          const P1 = stream.readU8();
          switch (P1) {
            case ESC_CODES.LS2:
              this.GL = 2;
              break;
            case ESC_CODES.LS3:
              this.GL = 3;
              break;
            case ESC_CODES.LS1R:
              this.GR = 1;
              break;
            case ESC_CODES.LS2R:
              this.GR = 2;
              break;
            case ESC_CODES.LS3R:
              this.GR = 3;
              break;
            case 0x24: {
              const P2 = stream.readU8();
              if (0x28 <= P2 && P2 <= 0x2B) {
                const P3 = stream.readU8();
                if (P3 === 0x20) {
                  const P4 = stream.readU8();
                  this.GB[P2 - 0x28] = Object.values(this.drcs_dicts).find(({ code }) => code === P4)!;
                } else {
                  this.GB[P2 - 0x28] = Object.values(this.character_dicts).find(({ code }) => code === P3)!;
                }
              } else {
                this.GB[0] = Object.values(this.character_dicts).find(({ code }) => code === P2)!;
              }
              break;
            }
            default: {
              if (0x28 <= P1 && P1 <= 0x2B) {
                const P2 = stream.readU8();
                if (P2 === 0x20) {
                  const P3 = stream.readU8();
                  this.GB[P1 - 0x28] = Object.values(this.drcs_dicts).find(({ code }) => code === P3)!;
                } else {
                  this.GB[P1 - 0x28] = Object.values(this.character_dicts).find(({ code }) => code === P2)!;
                }
              } else {
                throw new Error(`Undefined ESC Code in STD-B24 ARIB Caption (0x${P1.toString(16)})`);
              }
              break;
            }
          }
          break;
        }
        case CONTROL_CODES.SS3: {
          stream.readU8();
          let code = 0;
          for (let i = 0; i < this.GB[3].bytes; i++) {
            code <<= 8;
            code |= (stream.readU8() & 0x7F);
          }

          const { type, dict } = this.GB[3];

          switch (type) {
            case 'Character':
              if (dict.has(code)) {
                const ch = dict.get(code)!;
                const non_spacing = this.non_spacing.has(ch);
                result.push(Character.from(ch, non_spacing));
              }
              break;
            case 'DRCS':
              if (dict.has(code)) {
                const { width, height, depth, binary } = dict.get(code)!;
                result.push(DRCS.from(width, height, depth, binary));
              }
              break;
            case 'MACRO':
              if (dict.has(code)) { result.push(... this.tokenizeStatement(dict.get(code)!)); }
              break;
            default:
              const exhaustive: never = type;
              throw new UnreachableError(`Undefined Dict Type in STD-B24 ARIB Caption (${exhaustive})`);
          }

          break;
        }
        default: {
          if ((0x00 <= control && control <= 0x20) || control === CONTROL_CODES.DEL) {
            result.push(processC0(stream));
          } else if (0x80 <= control && control <= 0x9F) {
            result.push(processC1(stream));
          } else {
            throw new UnreachableError(`Undefined Conrtol Code in STD-B24 ARIB Caption`);
          }
        }
      }
    }

    return result;
  }

  public processDRCS(bytes: 1 | 2, arraybuffer: ArrayBuffer): void {
    const uint8 = new Uint8Array(arraybuffer);
    let begin = 0, end = uint8.byteLength;
    const NumberOfCode = uint8[begin + 0];
    begin += 1
    while (begin < end){
      const CharacterCode = (uint8[begin + 0] << 8) | uint8[begin + 1];
      const NumberOfFont = uint8[begin + 2];
      begin += 3

      for (let font = 0; font < NumberOfFont; font++) {
        const fontId = (uint8[begin + 0] & 0xF0) >> 4
        const mode = (uint8[begin + 0] & 0x0F)

        if (mode === 0 || mode === 1) { // FIXME: Other Mode Not Supported
          const depth = uint8[begin + 1] + 2;
          const width = uint8[begin + 2];
          const height = uint8[begin + 3];
          const bits = [0, 1, 6, 2, 7, 5, 4, 3][(depth * 0b00011101) >> 5]; // De Brujin Sequence in 8 bit
          const length = Math.floor(width * height * bits / 8);
          const binary = uint8.slice(begin + 4, begin + 4 + length).buffer;

          if (bytes === 1) {
            const index = (CharacterCode & 0xFF00) >> 8;
            const ch = (CharacterCode & 0x00FF) & 0x7F;

            const entry = Object.values(this.drcs_dicts).find((value) => value.code === index);
            if (entry == null || entry.type !== 'DRCS') { continue };

            entry.dict.set(ch, DRCS.from(width, height, bits, binary));
          } else {
            const index = 0x40;
            const ch = CharacterCode & 0x7F7F;

            const entry = Object.values(this.drcs_dicts).find((value) => value.code === index);
            if (entry == null || entry.type !== 'DRCS') { continue };

            entry.dict.set(ch, DRCS.from(width, height, bits, binary));
          }

          begin += 4 + length
        } else {
          return;
        }
      }
    }
  }
}

import { ByteStream } from "../../../util/bytestream";
import { CaptionData, CaptionManagement } from "../datagroup";

import type { ARIBB24Token } from '../../token';
import { ActiveCoordinatePositionSet, ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, BlackForeground, BlueForeground, BuiltinSoundReplay, Cancel, Character, CharacterCompositionDotDesignation, CharacterSizeControl, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, CyanForeground, Delete, DRCS, FlashingControl, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, OrnamentControl, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SingleConcealmentMode, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, YellowForeground } from "../../token";
import ARIBB24Tokenizer from "../tokenizer";
import md5 from "../../../util/md5";

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

export const ESC_CODES = {
  LS2: 0x6e,
  LS3: 0x6f,
  LS1R: 0x7e,
  LS2R: 0x7d,
  LS3R: 0x7c,
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

export const replaceDRCS = (tokens: ARIBB24Token[], replace: Map<string, string>): ARIBB24Token[] => {
  return tokens.map((token) => {
    if (token.tag !== 'DRCS') { return token; }
    const hash = md5(token.binary);

    if (replace.has(hash)) {
      return Character.from(replace.get(hash)!);
    } else {
      return token;
    }
  });
}

export default abstract class ARIBB24JIS8Tokenizer implements ARIBB24Tokenizer {
  private GL: 0 | 1 | 2 | 3;
  private GR: 0 | 1 | 2 | 3;
  private GB: [DictEntry, DictEntry, DictEntry, DictEntry];
  private character_dicts: Record<string, CharacterDictEntry>;
  private drcs_dicts: Record<string, DRCSDictEntry | MacroDictEntry>;

  public constructor(GL: 0 | 1 | 2 | 3, GR: 0 | 1 | 2 | 3, GB: [DictEntry, DictEntry, DictEntry, DictEntry], character_dicts: Record<string, CharacterDictEntry>, drcs_dicts: Record<string, DRCSDictEntry | MacroDictEntry>) {
    this.GL = GL;
    this.GR = GR;
    this.GB = GB;
    this.character_dicts = character_dicts;
    this.drcs_dicts = structuredClone(drcs_dicts);
  }

  public tokenize(data: CaptionData): ARIBB24Token[] {
    const result: ARIBB24Token[] = [];
    for (const unit of data.units) {
      switch (unit.tag) {
        case 'Statement':
          result.push(... this.tokenizeStatement(unit.data));
          break;
        case 'DRCS':
          this.tokenizeDRCS(unit.bytes, unit.data);
          break;
      }
    }

    return result;
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
            if (dict.has(code)) { result.push(Character.from(dict.get(code)!)); }
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
            throw new Error(`Undefined Dict Type in STD-B24 ARIB Caption (${exhaustive})`);
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
            if (dict.has(code)) { result.push(Character.from(dict.get(code)!)); }
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
            throw new Error(`Undefined Dict Type in STD-B24 ARIB Caption (${exhaustive})`);
        }

        continue;
      }

      const control = stream.readU8() as (typeof CONTROL_CODES)[keyof typeof CONTROL_CODES];
      switch (control) {
        case CONTROL_CODES.NUL: {
          result.push(Null.from());
          break;
        }
        case CONTROL_CODES.BEL: {
          result.push(Bell.from());
          break;
        }
        case CONTROL_CODES.APB: {
          result.push(ActivePositionBackward.from());
          break;
        }
        case CONTROL_CODES.APF: {
          result.push(ActivePositionForward.from());
          break;
        }
        case CONTROL_CODES.APD: {
          result.push(ActivePositionDown.from());
          break;
        }
        case CONTROL_CODES.APU: {
          result.push(ActivePositionUp.from());
          break;
        }
        case CONTROL_CODES.CS: {
          result.push(ClearScreen.from());
          break;
        }
        case CONTROL_CODES.APR: {
          result.push(ActivePositionReturn.from());
          break;
        }
        case CONTROL_CODES.LS1: {
          this.GL = 1;
          break;
        }
        case CONTROL_CODES.LS0: {
          this.GL = 0;
          break;
        }
        case CONTROL_CODES.PAPF: {
          const x = stream.readU8() & 0x3F;
          result.push(ParameterizedActivePositionForward.from(x));
          break;
        }
        case CONTROL_CODES.CAN: {
          result.push(Cancel.from());
          break;
        }
        case CONTROL_CODES.SS2: {
          let code = 0;
          for (let i = 0; i < this.GB[2].bytes; i++) {
            code <<= 8;
            code |= (stream.readU8() & 0x7F);
          }

          const { type, dict } = this.GB[2];

          switch (type) {
            case 'Character':
              if (dict.has(code)) { result.push(Character.from(dict.get(code)!)); }
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
              throw new Error(`Undefined Dict Type in STD-B24 ARIB Caption (${exhaustive})`);
          }

          break;
        }
        case CONTROL_CODES.ESC: {
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
        case CONTROL_CODES.APS: {
          const y = stream.readU8() & 0x3F;
          const x = stream.readU8() & 0x3F;
          result.push(ActivePositionSet.from(x, y));
          break;
        }
        case CONTROL_CODES.SS3: {
          let code = 0;
          for (let i = 0; i < this.GB[3].bytes; i++) {
            code <<= 8;
            code |= (stream.readU8() & 0x7F);
          }

          const { type, dict } = this.GB[3];

          switch (type) {
            case 'Character':
              if (dict.has(code)) { result.push(Character.from(dict.get(code)!)); }
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
              throw new Error(`Undefined Dict Type in STD-B24 ARIB Caption (${exhaustive})`);
          }

          break;
        }
        case CONTROL_CODES.RS: {
          result.push(RecordSeparator.from());
          break;
        }
        case CONTROL_CODES.US: {
          result.push(UnitSeparator.from());
          break;
        }
        case CONTROL_CODES.SP: {
          result.push(Space.from());
          break;
        }
        case CONTROL_CODES.DEL: {
          result.push(Delete.from());
          break;
        }
        case CONTROL_CODES.BKF: {
          result.push(BlackForeground.from());
          break;
        }
        case CONTROL_CODES.RDF: {
          result.push(RedForeground.from());
          break;
        }
        case CONTROL_CODES.GRF: {
          result.push(GreenForeground.from());
          break;
        }
        case CONTROL_CODES.YLF: {
          result.push(YellowForeground.from());
          break;
        }
        case CONTROL_CODES.BLF: {
          result.push(BlueForeground.from());
          break;
        }
        case CONTROL_CODES.MGF: {
          result.push(MagentaForeground.from());
          break;
        }
        case CONTROL_CODES.CNF: {
          result.push(CyanForeground.from());
          break;
        }
        case CONTROL_CODES.WHF: {
          result.push(WhiteForeground.from());
          break;
        }
        case CONTROL_CODES.SSZ: {
          result.push(SmallSize.from());
          break;
        }
        case CONTROL_CODES.MSZ: {
          result.push(MiddleSize.from());
          break;
        }
        case CONTROL_CODES.NSZ: {
          result.push(NormalSize.from());
          break;
        }
        case CONTROL_CODES.SZX: {
          const P1 = stream.readU8();
          switch (P1) {
            case 0x60: // Tiny
            case 0x41: // Double Height
            case 0x44: // Double Width
            case 0x45: // Double Height And Width
            case 0x6B: // Special 1
            case 0x64: // Special 2
              result.push(CharacterSizeControl.from(P1));
              break;
          }
          break;
        }
        case CONTROL_CODES.COL: {
          const P1 = stream.readU8();
          const color = P1 & 0x0F
          switch (P1 & 0x70) {
            case 0x20:
              result.push(PalletControl.from(stream.readU8() & 0x0F));
              break;
            case 0x40:
              result.push(ColorControlForeground.from(color));
              break;
            case 0x50:
              result.push(ColorControlBackground.from(color));
              break;
            case 0x60:
              result.push(ColorControlHalfForeground.from(color));
              break;
            case 0x70:
              result.push(ColorControlHalfBackground.from(color));
              break;
          }
          break;
        }
        case CONTROL_CODES.FLC: {
          const P1 = stream.readU8();
          switch (P1) {
            case 0x40: // NORMAL
            case 0x47: // INVERTED
            case 0x4F: // STOP
              result.push(FlashingControl.from(P1));
              break;
          }
          break;
        }
        case CONTROL_CODES.CDC: {
          const P1 = stream.readU8();
          if (P1 === 0x20) {
            const P2 = stream.readU8();
            switch (P2) {
              case 0x40: // Simple
              case 0x41: // 1st
              case 0x42: // 2nd
              case 0x43: // 3rd
              case 0x44: // 4th
              case 0x45: // 5th
              case 0x46: // 6th
              case 0x47: // 7th
              case 0x48: // 8th
              case 0x49: // 9th
              case 0x4a: // 10th
              case 0x4f: // Stop
                result.push(ReplacingConcealmentMode.from(P2));
                break
            }
          } else if (P1 === 0x40 || P1 === 0x4F) {
            result.push(SingleConcealmentMode.from(P1));
          }
          break;
        }
        case CONTROL_CODES.POL: {
          const P1 = stream.readU8();
          switch (P1) {
            case 0x40:
              result.push(PatternPolarityControl.from(P1));
              break;
            case 0x41:
              result.push(PatternPolarityControl.from(P1));
              break;
            case 0x42:
              result.push(PatternPolarityControl.from(P1));
              break;
          }
          break;
        }
        case CONTROL_CODES.WMM: {
          const P1 = stream.readU8();
          switch (P1) {
            case 0x40: // both
            case 0x44: // foreground
            case 0x45: // background
              result.push(WritingModeModification.from(P1));
              break;
          }
          break;
        }
        case CONTROL_CODES.MACRO: {
          // TODO:
          throw new Error('Not Implemeted!');
        }
        case CONTROL_CODES.HLC: {
          const P1 = stream.readU8() & 0x0F;
          result.push(HilightingCharacterBlock.from(P1));
          break;
        }
        case CONTROL_CODES.RPC: {
          const P1 = stream.readU8() & 0x3F;
          result.push(RepeatCharacter.from(P1));
          break;
        }
        case CONTROL_CODES.SPL: {
          result.push(StopLining.from());
          break;
        }
        case CONTROL_CODES.STL: {
          result.push(StartLining.from());
          break;
        }
        case CONTROL_CODES.CSI: {
          const values: number[] = [0];
          let F = 0;
          while (!stream.isEmpty()) {
            const x = stream.readU8();
            if (x === 0x20 || x == 0x3b) {
              values.push(0);
              continue;
            } else if ((x & 0x40) !== 0) {
              F = x;
              break;
            }

            values[values.length - 1] *= 10;
            values[values.length - 1] += (x & 0x0F);
          }

          switch (F) {
            case CSI_CODE.GSM:
              // TODO:
              break;
            case CSI_CODE.SWF:
              result.push(SetWritingFormat.from(values[0]));
              break;
            case CSI_CODE.CCC:
              // TODO:
              break;
            case CSI_CODE.SDF:
              result.push(SetDisplayFormat.from(values[0], values[1]));
              break;
            case CSI_CODE.SSM:
              result.push(CharacterCompositionDotDesignation.from(values[0], values[1]));
              break;
            case CSI_CODE.SHS:
              result.push(SetHorizontalSpacing.from(values[0]));
              break;
            case CSI_CODE.SVS:
              result.push(SetVerticalSpacing.from(values[0]));
              break;
            case CSI_CODE.PLD:
              // TODO:
              break;
            case CSI_CODE.PLU:
              // TODO:
              break;
            case CSI_CODE.GAA:
              // TODO:
              break;
            case CSI_CODE.SRC:
              // TODO:
              break;
            case CSI_CODE.SDP:
              result.push(SetDisplayPosition.from(values[0], values[1]));
              break;
            case CSI_CODE.ACPS:
              result.push(ActiveCoordinatePositionSet.from(values[0], values[1]));
              break;
            case CSI_CODE.TCC:
              // TODO:
              break;
            case CSI_CODE.ORN:
              switch (values[0]) {
                case 0x00:
                case 0x01:
                case 0x02:
                case 0x03:
                  result.push(OrnamentControl.from(values[0], values[1]));
                  break;
              }
              break;
            case CSI_CODE.MDF:
              // TODO:
              break;
            case CSI_CODE.CFS:
              // TODO:
              break;
            case CSI_CODE.XCS:
              // TODO:
              break;
            case CSI_CODE.SCR:
              // TODO:
              break;
            case CSI_CODE.PRA:
              result.push(BuiltinSoundReplay.from(values[0]));
              break;
            case CSI_CODE.ACS:
              // TODO:
              break;
            case CSI_CODE.UED:
              // TODO:
              break;
            case CSI_CODE.RCS:
              // TODO:
              break;
            case CSI_CODE.SCS:
              // TODO:
              break;
            default:
              throw new Error(`Undefined CSI Code in STD-B24 ARIB Caption (0x${F.toString(16)})`);
          }
          break;
        }
        case CONTROL_CODES.TIME: {
          const P1 = stream.readU8();
          switch (P1) {
            case 0x20: {
              const time = (stream.readU8() & 0x3F) / 10
              result.push(TimeControlWait.from(time));
              break;
            }
            case 0x28: {
              const P2 = stream.readU8();
              switch (P2) {
                case 0x40: // FREE
                case 0x41: // REAL
                case 0x42: // OFFSET
                case 0x43: // UNIQUE
                  result.push(TimeControlMode.from(P2));
                  break;
              }
              break;
            }
            case 0x29: {
              // FIXME: I can't understand this operation....
              throw new Error('Not Implemeted!');
            }
          }
          break;
        }
        default: {
          const exhaustive: never = control;
          throw new Error(`Undefined Conrtol Code in STD-B24 ARIB Caption (0x${(exhaustive as number).toString(16)})`);
        }
      }
    }

    return result;
  }

  public tokenizeDRCS(bytes: 1 | 2, arraybuffer: ArrayBuffer): void {
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
          }else{
            const index = 0x40;
            const ch = CharacterCode & 0x7F7F;

            const entry = Object.values(this.drcs_dicts).find((value) => value.code === index);
            if (entry == null || entry.type !== 'DRCS') { continue };

            entry.dict.set(ch, DRCS.from(width, height, bits, binary));
          }

          begin += 4 + length
        }
      }
    }
  }
}

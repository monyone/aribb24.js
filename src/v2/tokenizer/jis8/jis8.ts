import { ByteStream } from "../../util/bytestream";

import type { AribToken } from '../token';
import { ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, BlackForeground, BlueForeground, Cancel, CharacterSizeControl, ClearScreen, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, CyanForeground, Delete, FlashingControl, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, SingleConcealmentMode, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlWait, UnitSeparator, WritingModeModification, YellowForeground } from "../token";

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

export type CharacterDict = {
  type: 'Character',
  code: number;
  bytes: number;
  dict: Map<number, string>
};
export type DRCSDict = {
  type: 'DRCS',
  code: number;
  bytes: number;
  dict: Map<number, Uint8Array>
};

export type Dict = CharacterDict | DRCSDict;

export default abstract class JIS8Tokenizer {
  private GL: 0 | 1 | 2 | 3;
  private GR: 0 | 1 | 2 | 3;
  private GB: [Dict, Dict, Dict, Dict];
  private character_dicts: Record<string, CharacterDict>;
  private drcs_dicts: Record<string, DRCSDict>;

  public constructor(GL: 0 | 1 | 2 | 3, GR: 0 | 1 | 2 | 3, GB: [Dict, Dict, Dict, Dict], character_dicts: Record<string, CharacterDict>, drcs_dicts: Record<string, DRCSDict>) {
    this.GL = GL;
    this.GR = GR;
    this.GB = GB;
    this.character_dicts = character_dicts;
    this.drcs_dicts = Object.assign({}, ... Object.entries(drcs_dicts).map(([key, value]) => [key, { ... value, dict: new Map<number, Uint8Array>() }]))
  }

  public tokenize(datagroup: ArrayBuffer) {
    const stream = new ByteStream(datagroup);
    const result: AribToken[] = [];

    try {
      while (!stream.isEmpty()) {
        if (0x20 < stream.peekU8() && stream.peekU8() < 0x7F) {
          // GL
          continue;
        } else if (0xA0 < stream.peekU8() && stream.peekU8() < 0xFF) {
          // GR
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
            this.GL = 0
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
            // TODO:
            break;
          }
          case CONTROL_CODES.ESC: {
            // TODO:
            break;
          }
          case CONTROL_CODES.APS: {
            const y = stream.readU8() & 0x3F;
            const x = stream.readU8() & 0x3F;
            result.push(ActivePositionSet.from(x, y));
          }
          case CONTROL_CODES.SS3: {
            // TODO:
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
            result.push(MagentaForeground.from());
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
                result.push(PalletControl.from(color));
                break;
              case 0x40:
                result.push(ColorControlForeground.from(color));
                break;
              case 0x50:
                result.push(ColorControlHalfBackground.from(color));
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
            // TODO: いつかやる
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
            // TODO:
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
                // TODO: 意味わからんわ
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
    } catch (e) {
      console.error(e);
      return [];
    }

    return result;
  }
}

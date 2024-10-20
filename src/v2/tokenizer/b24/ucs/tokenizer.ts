import { ByteStream } from "../../../util/bytestream";

import type { ARIBB24Token } from '../../token';
import { ActiveCoordinatePositionSet, ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, Bitmap, BlackForeground, BlueForeground, BuiltinSoundReplay, Cancel, Character, CharacterCompositionDotDesignation, CharacterSizeControl, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, CyanForeground, Delete, DRCS, FlashingControl, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, OrnamentControl, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SingleConcealmentMode, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, YellowForeground } from "../../token";
import ARIBB24Tokenizer, { CONTROL_CODES, CSI_CODE } from "../tokenizer";
import { NotImplementedError, UnreachableError } from "../../../util/error";

type CONTROL_START =
  typeof CONTROL_CODES.NUL |
  typeof CONTROL_CODES.BEL |
  typeof CONTROL_CODES.APB |
  typeof CONTROL_CODES.APF |
  typeof CONTROL_CODES.APD |
  typeof CONTROL_CODES.APU |
  typeof CONTROL_CODES.CS |
  typeof CONTROL_CODES.APR |
  typeof CONTROL_CODES.LS1 |
  typeof CONTROL_CODES.LS0 |
  typeof CONTROL_CODES.PAPF |
  typeof CONTROL_CODES.CAN |
  typeof CONTROL_CODES.SS2 |
  typeof CONTROL_CODES.ESC |
  typeof CONTROL_CODES.APS |
  typeof CONTROL_CODES.SS3 |
  typeof CONTROL_CODES.RS |
  typeof CONTROL_CODES.US |
  typeof CONTROL_CODES.SP |
  typeof CONTROL_CODES.DEL |
  0xC2;

type CONTROL_C2 =
  typeof CONTROL_CODES.BKF |
  typeof CONTROL_CODES.RDF |
  typeof CONTROL_CODES.GRF |
  typeof CONTROL_CODES.YLF |
  typeof CONTROL_CODES.BLF |
  typeof CONTROL_CODES.MGF |
  typeof CONTROL_CODES.CNF |
  typeof CONTROL_CODES.WHF |
  typeof CONTROL_CODES.SSZ |
  typeof CONTROL_CODES.MSZ |
  typeof CONTROL_CODES.NSZ |
  typeof CONTROL_CODES.SZX |
  typeof CONTROL_CODES.COL |
  typeof CONTROL_CODES.FLC |
  typeof CONTROL_CODES.CDC |
  typeof CONTROL_CODES.POL |
  typeof CONTROL_CODES.WMM |
  typeof CONTROL_CODES.MACRO |
  typeof CONTROL_CODES.HLC |
  typeof CONTROL_CODES.RPC |
  typeof CONTROL_CODES.SPL |
  typeof CONTROL_CODES.STL |
  typeof CONTROL_CODES.CSI |
  typeof CONTROL_CODES.TIME;

const is_control_start = new Set([
  CONTROL_CODES.NUL,
  CONTROL_CODES.BEL,
  CONTROL_CODES.APB,
  CONTROL_CODES.APF,
  CONTROL_CODES.APD,
  CONTROL_CODES.APU,
  CONTROL_CODES.CS,
  CONTROL_CODES.APR,
  CONTROL_CODES.LS1,
  CONTROL_CODES.LS0,
  CONTROL_CODES.PAPF,
  CONTROL_CODES.CAN,
  CONTROL_CODES.SS2,
  CONTROL_CODES.ESC,
  CONTROL_CODES.APS,
  CONTROL_CODES.SS3,
  CONTROL_CODES.RS,
  CONTROL_CODES.US,
  CONTROL_CODES.SP,
  CONTROL_CODES.DEL,
  0xC2
]);

export default abstract class ARIBB24UTF8Tokenizer extends ARIBB24Tokenizer {
  private segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  private decoder = new TextDecoder('utf-8', { fatal: true });

  public tokenizeStatement(arraybuffer: ArrayBuffer): ARIBB24Token[] {
    const stream = new ByteStream(arraybuffer);
    const result: ARIBB24Token[] = [];

    while (!stream.isEmpty()) {
      if (!is_control_start.has(stream.peekU8())) {
        const string: number[] = [];
        while (!stream.isEmpty() && is_control_start.has(stream.peekU8())) {
          string.push(stream.readU8());
        }
        for (const ch of Array.from(this.segmenter.segment(this.decoder.decode(Uint8Array.from(string))), ({ segment }) => segment)) {
          result.push(Character.from(ch, false));
        }

        continue;
      }

      const control = stream.readU8() as CONTROL_START;
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
          break;
        }
        case CONTROL_CODES.LS0: {
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
          break;
        }
        case CONTROL_CODES.ESC: {
          break;
        }
        case CONTROL_CODES.APS: {
          const y = stream.readU8() & 0x3F;
          const x = stream.readU8() & 0x3F;
          result.push(ActivePositionSet.from(x, y));
          break;
        }
        case CONTROL_CODES.SS3: {
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
        case 0xC2: {
          const control = stream.readU8() as CONTROL_C2;
          switch (control) {
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
              throw new NotImplementedError(`MACRO is Not Implemeted!`);
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
                  throw new NotImplementedError(`GSM is Not Implemented!`);
                case CSI_CODE.SWF:
                  result.push(SetWritingFormat.from(values[0]));
                  break;
                case CSI_CODE.CCC:
                  throw new NotImplementedError(`CCC is Not Implemented!`);
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
                  throw new NotImplementedError(`PLD is Not Implemented!`);
                case CSI_CODE.PLU:
                  throw new NotImplementedError(`PLU is Not Implemented!`);
                case CSI_CODE.GAA:
                  throw new NotImplementedError(`GAA is Not Implemented!`);
                case CSI_CODE.SRC:
                  throw new NotImplementedError(`SRC is Not Implemented!`);
                case CSI_CODE.SDP:
                  result.push(SetDisplayPosition.from(values[0], values[1]));
                  break;
                case CSI_CODE.ACPS:
                  result.push(ActiveCoordinatePositionSet.from(values[0], values[1]));
                  break;
                case CSI_CODE.TCC:
                  throw new NotImplementedError(`TCC is Not Implemented!`);
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
                  throw new NotImplementedError(`MDF is Not Implemented!`);
                case CSI_CODE.CFS:
                  throw new NotImplementedError(`CFS is Not Implemented!`);
                case CSI_CODE.XCS:
                  throw new NotImplementedError(`XCS is Not Implemented!`);
                case CSI_CODE.SCR:
                  throw new NotImplementedError(`SCR is Not Implemented!`);
                case CSI_CODE.PRA:
                  result.push(BuiltinSoundReplay.from(values[0]));
                  break;
                case CSI_CODE.ACS:
                  throw new NotImplementedError(`ACS is Not Implemented!`);
                case CSI_CODE.UED:
                  throw new NotImplementedError(`UED is Not Implemented!`);
                case CSI_CODE.RCS:
                  //throw new NotImplementedError(`RCS is Not Implemented!`);
                  break;
                case CSI_CODE.SCS:
                  throw new NotImplementedError(`SCS is Not Implemented!`);
                default:
                  throw new NotImplementedError(`Unhandled CSI Code in STD-B24 ARIB Caption (0x${F.toString(16)})`);
              }
              break;
            }
            case CONTROL_CODES.TIME: {
              const P1 = stream.readU8();
              switch (P1) {
                case 0x20: {
                  const time = (stream.readU8() & 0x3F) / 10;
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
                  throw new NotImplementedError(`TIME 0x29 is Not Implemeted!`);
                }
              }
              break;
            }
            default: {
              const exhaustive: never = control;
              throw new UnreachableError(`Undefined Conrtol Code in STD-B24 ARIB Caption (0x${(exhaustive as number).toString(16)})`);
            }
          }

          break;
        }
        default: {
          const exhaustive: never = control;
          throw new UnreachableError(`Undefined Conrtol Code in STD-B24 ARIB Caption (0x${(exhaustive as number).toString(16)})`);
        }
      }
    }

    return result;
  }

  public processDRCS(bytes: 1 | 2, arraybuffer: ArrayBuffer): void {}
}

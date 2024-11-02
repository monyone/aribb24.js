import { ByteStream } from "../../../util/bytestream";
import { NotImplementedError, NotUsedDueToStandardError, UnreachableError } from "../../../util/error";
import md5 from "../../../util/md5";
import { ActiveCoordinatePositionSet, ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, ARIBB24Token, Bell, Bitmap, BlackForeground, BlueForeground, BuiltinSoundReplay, Cancel, Character, CharacterCompositionDotDesignation, CharacterSizeControl, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, ConcealmentMode, ConcealmentModeType, CyanForeground, Delete, DRCS, FlashingControl, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, OrnamentControlHemming, OrnamentControlHollow, OrnamentControlNone, OrnamentControlShade, OrnamentControlType, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, RasterColourCommand, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SingleConcealmentMode, SingleConcealmentModeType, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, YellowForeground } from "../token";
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

export const processC0 = (stream: ByteStream): ARIBB24Token => {
  switch (stream.readU8()) {
    case CONTROL_CODES.NUL: return Null.from();
    case CONTROL_CODES.BEL: return Bell.from();
    case CONTROL_CODES.APB: return ActivePositionBackward.from();
    case CONTROL_CODES.APF: return ActivePositionForward.from();
    case CONTROL_CODES.APD: return ActivePositionDown.from();
    case CONTROL_CODES.APU: return ActivePositionUp.from();
    case CONTROL_CODES.CS: return ClearScreen.from();
    case CONTROL_CODES.APR: return ActivePositionReturn.from();
    case CONTROL_CODES.PAPF: return ParameterizedActivePositionForward.from(stream.readU8() & 0x3F);
    case CONTROL_CODES.CAN: return Cancel.from();
    case CONTROL_CODES.APS: {
      const y = stream.readU8() & 0x3F;
      const x = stream.readU8() & 0x3F;
      return ActivePositionSet.from(x, y);
    }
    case CONTROL_CODES.RS: return RecordSeparator.from();
    case CONTROL_CODES.US: return UnitSeparator.from();
    case CONTROL_CODES.SP: return Space.from();
    case CONTROL_CODES.DEL: return Delete.from();
    default: throw new UnreachableError('Undefined C0');
  }
}

export const processC1 = (stream: ByteStream): ARIBB24Token => {
  switch(stream.readU8()) {
    case CONTROL_CODES.BKF: return BlackForeground.from();
    case CONTROL_CODES.RDF: return RedForeground.from();
    case CONTROL_CODES.GRF: return GreenForeground.from();
    case CONTROL_CODES.YLF: return YellowForeground.from();
    case CONTROL_CODES.BLF: return BlueForeground.from();
    case CONTROL_CODES.MGF: return MagentaForeground.from();
    case CONTROL_CODES.CNF: return CyanForeground.from();
    case CONTROL_CODES.WHF: return WhiteForeground.from();
    case CONTROL_CODES.SSZ: return SmallSize.from();
    case CONTROL_CODES.MSZ: return MiddleSize.from();
    case CONTROL_CODES.NSZ: return NormalSize.from();
    case CONTROL_CODES.SZX: {
      const P1 = stream.readU8();
      switch (P1) {
        case 0x60: // Tiny
        case 0x41: // Double Height
        case 0x44: // Double Width
        case 0x45: // Double Height And Width
        case 0x6B: // Special 1
        case 0x64: // Special 2
          return CharacterSizeControl.from(P1);
      }

      throw new UnreachableError('Undefined SZX');
    }
    case CONTROL_CODES.COL: {
      const P1 = stream.readU8();
      const color = P1 & 0x0F;
      switch (P1 & 0x70) {
        case 0x20: return PalletControl.from(stream.readU8() & 0x0F);
        case 0x40: return ColorControlForeground.from(color);
        case 0x50: return ColorControlBackground.from(color);
        case 0x60: return ColorControlHalfForeground.from(color);
        case 0x70: return ColorControlHalfBackground.from(color);
      }

      throw new UnreachableError('Undefined COL');
    }
    case CONTROL_CODES.FLC: {
      const P1 = stream.readU8();
      switch (P1) {
        case 0x40: // NORMAL
        case 0x47: // INVERTED
        case 0x4F: // STOP
          return FlashingControl.from(P1);
      }

      throw new UnreachableError('Undefined FLC');
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
            return ReplacingConcealmentMode.from(P2);
        }
      } else if (P1 === SingleConcealmentModeType.START) {
        return SingleConcealmentMode.from(P1);
      } else if (P1 === ConcealmentModeType.STOP) {
        return ConcealmentMode.from(P1);
      }

      throw new UnreachableError('Undefined CDC');
    }
    case CONTROL_CODES.POL: {
      const P1 = stream.readU8();
      switch (P1) {
        case 0x40:
        case 0x41:
        case 0x42:
          return PatternPolarityControl.from(P1);
      }

      throw new UnreachableError('Undefined POL');
    }
    case CONTROL_CODES.WMM: {
      const P1 = stream.readU8();
      switch (P1) {
        case 0x40: // both
        case 0x44: // foreground
        case 0x45: // background
          return WritingModeModification.from(P1);
      }

      throw new UnreachableError('Undefined WMM');
    }
    case CONTROL_CODES.MACRO: {
      throw new NotImplementedError(`MACRO is Not Implemeted!`);
    }
    case CONTROL_CODES.HLC: {
      const P1 = stream.readU8() & 0x0F;
      return HilightingCharacterBlock.from(P1);
    }
    case CONTROL_CODES.RPC: {
      const P1 = stream.readU8() & 0x3F;
      return RepeatCharacter.from(P1);
    }
    case CONTROL_CODES.SPL: {
      return StopLining.from();
    }
    case CONTROL_CODES.STL: {
      return StartLining.from();
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
          return SetWritingFormat.from(values[0]);
        case CSI_CODE.CCC:
          throw new NotImplementedError(`CCC is Not Implemented!`);
        case CSI_CODE.SDF:
          return SetDisplayFormat.from(values[0], values[1]);
        case CSI_CODE.SSM:
          return CharacterCompositionDotDesignation.from(values[0], values[1]);
        case CSI_CODE.SHS:
          return SetHorizontalSpacing.from(values[0]);
        case CSI_CODE.SVS:
          return SetVerticalSpacing.from(values[0]);
        case CSI_CODE.PLD:
          throw new NotImplementedError(`PLD is Not Implemented!`);
        case CSI_CODE.PLU:
          throw new NotImplementedError(`PLU is Not Implemented!`);
        case CSI_CODE.GAA:
          throw new NotImplementedError(`GAA is Not Implemented!`);
        case CSI_CODE.SRC:
          throw new NotImplementedError(`SRC is Not Implemented!`);
        case CSI_CODE.SDP:
          return SetDisplayPosition.from(values[0], values[1]);
        case CSI_CODE.ACPS:
          return ActiveCoordinatePositionSet.from(values[0], values[1]);
        case CSI_CODE.TCC:
          throw new NotImplementedError(`TCC is Not Implemented!`);
        case CSI_CODE.ORN:
          switch (values[0]) {
            case OrnamentControlType.NONE:
              return OrnamentControlNone.from();
            case OrnamentControlType.HEMMING:
              return OrnamentControlHemming.from(values[1]);
            case OrnamentControlType.SHADE:
              return OrnamentControlShade.from(values[1]);
            case OrnamentControlType.HOLLOW:
              return OrnamentControlHollow.from();
          }

          throw new UnreachableError('Undefined ORN');
        case CSI_CODE.MDF:
          throw new NotImplementedError(`MDF is Not Implemented!`);
        case CSI_CODE.CFS:
          throw new NotImplementedError(`CFS is Not Implemented!`);
        case CSI_CODE.XCS:
          throw new NotImplementedError(`XCS is Not Implemented!`);
        case CSI_CODE.SCR:
          throw new NotImplementedError(`SCR is Not Implemented!`);
        case CSI_CODE.PRA:
          return BuiltinSoundReplay.from(values[0]);
        case CSI_CODE.ACS:
          throw new NotImplementedError(`ACS is Not Implemented!`);
        case CSI_CODE.UED:
          throw new NotImplementedError(`UED is Not Implemented!`);
        case CSI_CODE.RCS:
          return RasterColourCommand.from(values[0]);
        case CSI_CODE.SCS:
          throw new NotImplementedError(`SCS is Not Implemented!`);
        default:
          throw new UnreachableError(`Unhandled CSI Code in STD-B24 ARIB Caption (0x${F.toString(16)})`);
      }
    }
    case CONTROL_CODES.TIME: {
      const P1 = stream.readU8();
      switch (P1) {
        case 0x20: {
          const time = (stream.readU8() & 0x3F) / 10;
          return TimeControlWait.from(time);
        }
        case 0x28: {
          const P2 = stream.readU8();
          switch (P2) {
            case 0x40: // FREE
            case 0x41: // REAL
            case 0x42: // OFFSET
            case 0x43: // UNIQUE
              return TimeControlMode.from(P2);
          }

          throw new UnreachableError('Undefined TIME');
        }
        case 0x29: {
          // FIXME: I can't understand this operation....
          throw new NotUsedDueToStandardError(`TIME 0x29 (Specify Time) is Not Used by Specification`);
        }
        default:
          throw new UnreachableError('Undefined TIME');
      }
    }

    default:
      throw new UnreachableError('Undefined C1/CSI');
  }
}

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
      return Character.from(replace.get(hash)! + token.combining);
    } else {
      return token;
    }
  });
}

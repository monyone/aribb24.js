import { ByteStream } from "../../util/bytestream";

import type { AribToken } from '../token';
import { ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, BlackForeground, BlueForeground, Cancel, ClearScreen, CyanForeground, Delete, GreenForeground, MagentaForeground, MiddleSize, NormalSize, Null, ParameterizedActivePositionForward, RedForeground, SmallSize, Space, YellowForeground } from "../token";


const CONTROL_CODES = {
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

export default (binary: ArrayBuffer) => {
  const stream = new ByteStream(binary);
  const result: AribToken[] = [];

  let GL = 0, GR = 2;

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
          result.push(Null.new());
          break;
        }
        case CONTROL_CODES.BEL: {
          result.push(Bell.new());
          break;
        }
        case CONTROL_CODES.APB: {
          result.push(ActivePositionBackward.new());
          break;
        }
        case CONTROL_CODES.APF: {
          result.push(ActivePositionForward.new());
          break;
        }
        case CONTROL_CODES.APD: {
          result.push(ActivePositionDown.new());
          break;
        }
        case CONTROL_CODES.APU: {
          result.push(ActivePositionUp.new());
          break;
        }
        case CONTROL_CODES.CS: {
          result.push(ClearScreen.new());
          break;
        }
        case CONTROL_CODES.APR: {
          result.push(ActivePositionReturn.new());
          break;
        }
        case CONTROL_CODES.LS1: {
          GL = 1;
          break;
        }
        case CONTROL_CODES.LS0: {
          GL = 0;
          break;
        }
        case CONTROL_CODES.PAPF: {
          const x = stream.readU8() & 0x3F;
          result.push(ParameterizedActivePositionForward.new(x));
          break;
        }
        case CONTROL_CODES.CAN: {
          result.push(Cancel.new());
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
          result.push(ActivePositionSet.new(x, y));
        }
        case CONTROL_CODES.SS3: {
          // TODO:
          break;
        }
        case CONTROL_CODES.RS: {
          // ignore
          break;
        }
        case CONTROL_CODES.US: {
          // ignore
          break;
        }
        case CONTROL_CODES.SP: {
          result.push(Space.new());
          break;
        }
        case CONTROL_CODES.DEL: {
          result.push(Delete.new());
          break;
        }
        case CONTROL_CODES.BKF: {
          result.push(BlackForeground.new());
          break;
        }
        case CONTROL_CODES.RDF: {
          result.push(RedForeground.new());
          break;
        }
        case CONTROL_CODES.GRF: {
          result.push(GreenForeground.new());
          break;
        }
        case CONTROL_CODES.YLF: {
          result.push(YellowForeground.new());
          break;
        }
        case CONTROL_CODES.BLF: {
          result.push(BlueForeground.new());
          break;
        }
        case CONTROL_CODES.MGF: {
          result.push(MagentaForeground.new());
          break;
        }
        case CONTROL_CODES.CNF: {
          result.push(CyanForeground.new());
          break;
        }
        case CONTROL_CODES.WHF: {
          result.push(MagentaForeground.new());
          break;
        }
        case CONTROL_CODES.SSZ: {
          result.push(SmallSize.new());
          break;
        }
        case CONTROL_CODES.MSZ: {
          result.push(MiddleSize.new());
          break;
        }
        case CONTROL_CODES.NSZ: {
          result.push(NormalSize.new());
          break;
        }
        case CONTROL_CODES.SZX: {
          // TODO:
          break;
        }
        case CONTROL_CODES.COL: {
          // TODO:
          break;
        }
        case CONTROL_CODES.FLC: {
          // TODO:
          break;
        }
        case CONTROL_CODES.CDC: {
          // TODO:
          break;
        }
        case CONTROL_CODES.POL: {
          // TODO:
          break;
        }
        case CONTROL_CODES.WMM: {
          // TODO:
          break;
        }
        case CONTROL_CODES.MACRO: {
          // TODO:
          break;
        }
        case CONTROL_CODES.HLC: {
          // TDOO:
          break;
        }
        case CONTROL_CODES.RPC: {
          // TODO:
          break;
        }
        case CONTROL_CODES.SPL: {
          // TODO:
          break;
        }
        case CONTROL_CODES.STL: {
          // TODO:
          break;
        }
        case CONTROL_CODES.CSI: {
          // TODO:
          break;
        }
        case CONTROL_CODES.TIME: {
          // TODO:
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
};

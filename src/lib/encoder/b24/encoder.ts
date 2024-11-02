import { ARIBB24Token, Bitmap, Character, DRCS, Mosaic, RedForeground } from "../../tokenizer/token";
import { CONTROL_CODES, CSI_CODE } from "../../tokenizer/b24/tokenizer";
import { UnreachableError } from "../../../util/error";
import { DataUnit } from "../../demuxer/b24/datagroup";

const generateCSI = (F: number, ... values: number[]): ArrayBuffer => {
  const ops = [F];

  let sp: 0x20 | 0x3b = 0x20;
  for (let value of values.toReversed()) {
    ops.unshift(sp);
    do {
      ops.unshift(0x30 | (value % 10));
      value = Math.floor(value / 10);
    } while (value !== 0);

    sp = 0x3b;
  }
  ops.unshift(CONTROL_CODES.CSI);

  return Uint8Array.from(ops).buffer;
}

export default abstract class ARIBB24Encoder {
  public abstract encode(tokens: ARIBB24Token[]): DataUnit[];

  public encodeToken(token: ARIBB24Token): ArrayBuffer {
    switch (token.tag) {
      case 'Character':
        return this.encodeCharacter(token);
      case 'DRCS':
        return this.encodeDRCS(token);
      case 'Bitmap':
        return this.encodeBitmap(token);
      case 'Mosaic':
        return this.encodeMosaic(token);
      default:
        return this.encodeControl(token);
    }
  }

  public encodeControl(control: Exclude<ARIBB24Token, Character | DRCS | Bitmap | Mosaic>): ArrayBuffer {
    switch (control.tag) {
      // C0
      case 'Null':
        return Uint8Array.from([CONTROL_CODES.NUL]).buffer;
      case 'Bell':
        return Uint8Array.from([CONTROL_CODES.BEL]).buffer;
      case 'ActivePositionBackward':
        return Uint8Array.from([CONTROL_CODES.APB]).buffer;
      case 'ActivePositionForward':
        return Uint8Array.from([CONTROL_CODES.APF]).buffer;
      case 'ActivePositionDown':
        return Uint8Array.from([CONTROL_CODES.APD]).buffer;
      case 'ActivePositionUp':
        return Uint8Array.from([CONTROL_CODES.APU]).buffer;
      case 'ClearScreen':
        return Uint8Array.from([CONTROL_CODES.CS]).buffer;
      case 'ActivePositionReturn':
        return Uint8Array.from([CONTROL_CODES.APR]).buffer;
      case 'ParameterizedActivePositionForward':
        return Uint8Array.from([CONTROL_CODES.PAPF, 0x40 | control.x]).buffer;
      case 'Cancel':
        return Uint8Array.from([CONTROL_CODES.CAN]).buffer;
      case 'ActivePositionSet':
        return Uint8Array.from([CONTROL_CODES.APS, 0x40 | control.y, 0x40 | control.x]).buffer;
      case 'RecordSeparator':
        return Uint8Array.from([CONTROL_CODES.RS]).buffer;
      case 'UnitSeparator':
        return Uint8Array.from([CONTROL_CODES.US]).buffer;
      case 'Space':
        return Uint8Array.from([CONTROL_CODES.SP]).buffer;
      case 'Delete':
        return Uint8Array.from([CONTROL_CODES.DEL]).buffer;
      // C1
      case 'BlackForeground':
        return Uint8Array.from([CONTROL_CODES.BKF]).buffer;
      case 'RedForeground':
        return Uint8Array.from([CONTROL_CODES.RDF]).buffer;
      case 'GreenForeground':
        return Uint8Array.from([CONTROL_CODES.GRF]).buffer;
      case 'YellowForeground':
        return Uint8Array.from([CONTROL_CODES.YLF]).buffer;
      case 'BlueForeground':
        return Uint8Array.from([CONTROL_CODES.BLF]).buffer;
      case 'MagentaForeground':
        return Uint8Array.from([CONTROL_CODES.MGF]).buffer;
      case 'CyanForeground':
        return Uint8Array.from([CONTROL_CODES.CNF]).buffer;
      case 'WhiteForeground':
        return Uint8Array.from([CONTROL_CODES.WHF]).buffer;
      case 'SmallSize':
        return Uint8Array.from([CONTROL_CODES.SSZ]).buffer;
      case 'MiddleSize':
        return Uint8Array.from([CONTROL_CODES.MSZ]).buffer;
      case 'NormalSize':
        return Uint8Array.from([CONTROL_CODES.NSZ]).buffer;
      case 'CharacterSizeControl':
        return Uint8Array.from([CONTROL_CODES.SZX, control.type]).buffer;
      case 'ColorControlForeground':
        return Uint8Array.from([CONTROL_CODES.COL, 0x40 | control.color]).buffer;
      case 'ColorControlBackground':
        return Uint8Array.from([CONTROL_CODES.COL, 0x50 | control.color]).buffer;
      case 'ColorControlHalfForeground':
        return Uint8Array.from([CONTROL_CODES.COL, 0x60 | control.color]).buffer;
      case 'ColorControlHalfBackground':
        return Uint8Array.from([CONTROL_CODES.COL, 0x70 | control.color]).buffer;
      case 'PalletControl':
        return Uint8Array.from([CONTROL_CODES.COL, 0x20, 0x40 | control.pallet]).buffer;
      case 'FlashingControl':
        return Uint8Array.from([CONTROL_CODES.FLC, control.type]).buffer;
      case 'ConcealmentMode':
        return Uint8Array.from([CONTROL_CODES.CDC, control.type]).buffer;
      case 'SingleConcealmentMode':
        return Uint8Array.from([CONTROL_CODES.CDC, control.type]).buffer;
      case 'ReplacingConcealmentMode':
        return Uint8Array.from([CONTROL_CODES.CDC, 0x20, control.type]).buffer;
      case 'PatternPolarityControl':
        return Uint8Array.from([CONTROL_CODES.POL, control.type]).buffer;
      case 'WritingModeModification':
        return Uint8Array.from([CONTROL_CODES.WMM, control.type]).buffer;
      /* TODO: MACRO */
      case 'HilightingCharacterBlock':
        return Uint8Array.from([CONTROL_CODES.HLC, 0x40 | control.enclosure]).buffer;
      case 'RepeatCharacter':
        return Uint8Array.from([CONTROL_CODES.RPC, 0x40 | control.repeat]).buffer;
      case 'StartLining':
        return Uint8Array.from([CONTROL_CODES.STL]).buffer;
      case 'StopLining':
        return Uint8Array.from([CONTROL_CODES.SPL]).buffer;
      case 'TimeControlWait':
        return Uint8Array.from([CONTROL_CODES.TIME, 0x20, 0x40 | (control.seconds * 10)]).buffer;
      case 'TimeControlMode':
        return Uint8Array.from([CONTROL_CODES.TIME, 0x28, control.type]).buffer;
      // CSI
      case 'SetWritingFormat':
        return generateCSI(CSI_CODE.SWF, control.format);
      case 'SetDisplayFormat':
        return generateCSI(CSI_CODE.SDF, control.horizontal, control.vertical);
      case 'SetDisplayPosition':
        return generateCSI(CSI_CODE.SDP, control.horizontal, control.vertical);
      case 'CharacterCompositionDotDesignation':
        return generateCSI(CSI_CODE.SSM, control.horizontal, control.horizontal);
      case 'SetHorizontalSpacing':
        return generateCSI(CSI_CODE.SHS, control.spacing);
      case 'SetVerticalSpacing':
        return generateCSI(CSI_CODE.SVS, control.spacing);
      case 'ActiveCoordinatePositionSet':
        return generateCSI(CSI_CODE.ACPS, control.x, control.y);
      case 'RasterColourCommand':
        return generateCSI(CSI_CODE.RCS, control.color);
      case 'OrnamentControlNone':
        return generateCSI(CSI_CODE.ORN, 0);
      case 'OrnamentControlHemming':
        return generateCSI(CSI_CODE.ORN, 1, control.color);
      case 'OrnamentControlShade':
        return generateCSI(CSI_CODE.ORN, 2, control.color);
      case 'OrnamentControlHollow':
        return generateCSI(CSI_CODE.ORN, 3);
      case 'BuiltinSoundReplay':
        return generateCSI(CSI_CODE.PRA, control.sound);
      default:
        const exhaustive: never = control;
        throw new UnreachableError(`Undefined Size Type in STD-B24 ARIB Caption (${exhaustive})`);
    }

  }
  public abstract encodeCharacter(character: Character): ArrayBuffer;
  public abstract encodeDRCS(drcs: DRCS): ArrayBuffer;
  public abstract encodeBitmap(bitmap: Bitmap): ArrayBuffer;
  public abstract encodeMosaic(mozaic: Mosaic): ArrayBuffer;
}

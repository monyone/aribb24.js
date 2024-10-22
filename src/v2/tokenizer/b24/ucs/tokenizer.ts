import { ByteStream } from "../../../util/bytestream";

import type { ARIBB24Token } from '../../token';
import { ActiveCoordinatePositionSet, ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, Bitmap, BlackForeground, BlueForeground, BuiltinSoundReplay, Cancel, Character, CharacterCompositionDotDesignation, CharacterSizeControl, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, CyanForeground, Delete, DRCS, FlashingControl, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, OrnamentControl, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SingleConcealmentMode, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, YellowForeground } from "../../token";
import ARIBB24Tokenizer, { CONTROL_CODES, CSI_CODE, processC0, processC1 } from "../tokenizer";
import { NotImplementedError, NotUsedDueToStandardError, UnreachableError } from "../../../util/error";

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

const is_control_start_set = new Set<number>([
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
  CONTROL_CODES.DEL
]);

const is_control_start = (stream: ByteStream) => {
  if (stream.exists(1)) {
    const c0 = stream.peekU8();
    if (is_control_start_set.has(c0)) {
      return true;
    }
  }
  if (stream.exists(2)) {
    const c1 = stream.peekU16();
    if (0xC280 <= c1 && c1 <= 0xC29F) {
      return true;
    }
  }

  return false;
}

export default class ARIBB24UTF8Tokenizer extends ARIBB24Tokenizer {
  private segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  private decoder = new TextDecoder('utf-8', { fatal: true });

  public tokenizeStatement(arraybuffer: ArrayBuffer): ARIBB24Token[] {
    const stream = new ByteStream(arraybuffer);
    const result: ARIBB24Token[] = [];

    while (!stream.isEmpty()) {
      if (!is_control_start(stream)) {
        const string: number[] = [];
        while (!stream.isEmpty() && !is_control_start(stream)) {
          string.push(stream.readU8());
        }
        for (const ch of Array.from(this.segmenter.segment(this.decoder.decode(Uint8Array.from(string))), ({ segment }) => segment)) {
          result.push(Character.from(ch, false));
        }

        continue;
      }

      const control = stream.peekU8() as CONTROL_START;
      if (stream.exists(1) && (0x00 <= control && control <= 0x20) || control === CONTROL_CODES.DEL) {
        switch (control) {
          case CONTROL_CODES.LS0:
          case CONTROL_CODES.LS1:
          case CONTROL_CODES.SS2:
          case CONTROL_CODES.SS3:
            throw new NotUsedDueToStandardError('Single/Locking Shift is Not used in UTF-8');
          case CONTROL_CODES.ESC:
            throw new NotImplementedError('ESC in UTF-8 is Not Implemented');
        }

        result.push(processC0(stream));
      } else if (stream.exists(2) && 0xC280 <= stream.peekU16() && stream.peekU16() <= 0xC29F) {
        stream.readU8();
        result.push(processC1(stream));
      } else {
        throw new UnreachableError(`Undefined Conrtol Code in STD-B24 ARIB Caption`);
      }
    }

    return result;
  }

  public processDRCS(bytes: 1 | 2, arraybuffer: ArrayBuffer): void {}
}

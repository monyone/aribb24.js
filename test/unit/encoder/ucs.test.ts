import ARIBB24UTF8Encoder from '@/lib/encoder/b24/ucs/encoder';
import { CONTROL_CODES, CSI_CODE } from '@/lib/tokenizer/b24/tokenizer';
import { ActiveCoordinatePositionSet, ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, BlackForeground, BlueForeground, BuiltinSoundReplay, Cancel, Character, CharacterCompositionDotDesignation, CharacterSizeControl, CharacterSizeControlType, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, ConcealmentMode, ConcealmentModeType, CyanForeground, Delete, FlashingControl, FlashingControlType, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, OrnamentControlHemming, OrnamentControlHollow, OrnamentControlNone, OrnamentControlShade, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, PatternPolarityControlType, RasterColourCommand, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, ReplacingConcealmentModeType, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SingleConcealmentMode, SingleConcealmentModeType, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlModeType, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, WritingModeModificationType, YellowForeground } from '@/lib/tokenizer/token';
import { describe, test, expect } from 'vitest';

describe("ARIB STD-B24 UCS Encoder", () => {
  test('Encode UTF-8 ASCII', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Character.from('a'))).toStrictEqual(
      Uint8Array.from([0x61]).buffer
    );
  });

  test('Encode UTF-8 2-bytes', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Character.from('字'))).toStrictEqual(
      Uint8Array.from([0xE5, 0xAD, 0x97]).buffer
    );
  });

  test('Encode UTF-8 surrogate pair', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Character.from('叱'))).toStrictEqual(
      Uint8Array.from([0xE5, 0x8F, 0xB1]).buffer
    );
  });

  test('Encode UTF-8 surrogate pair', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Character.from('👨‍👩'))).toStrictEqual(
      Uint8Array.from([0xF0, 0x9F, 0x91, 0xA8, 0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA9]).buffer
    );
  });

  // TODO: DRCS

  // C0
  test('Encode Null (NUL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Null.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.NUL]).buffer
    );
  });

  test('Encode Bell (BEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Bell.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.BEL]).buffer
    );
  });

  test('Encode ActivePositionBackward (APB)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ActivePositionBackward.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APB]).buffer
    );
  });

  test('Encode ActivePositionForward (APF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ActivePositionForward.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APF]).buffer
    );
  });

  test('Encode ActivePositionDown (APD)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ActivePositionDown.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APD]).buffer
    );
  });

  test('Encode ActivePositionDown (APU)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ActivePositionUp.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APU]).buffer
    );
  });

  test('Encode ClearScreen (CS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ClearScreen.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.CS]).buffer
    );
  });

  test('Encode ActivePositionReturn (APR)s', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ActivePositionReturn.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APR]).buffer
    );
  });

  test('Encode ParameterizedActivePositionForward (PAPF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ParameterizedActivePositionForward.from(2))).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.PAPF, 0x40 | 0x02]).buffer
    );
  });

  test('Encode Cancel (CAN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Cancel.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.CAN]).buffer
    );
  });

  test('Encode ActivePositionSet (APS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ActivePositionSet.from(5, 8))).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APS, 0x40 | 0x08, 0x40 | 0x05]).buffer
    );
  });

  test('Encode ARIBB24UTF8Encoder (RS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(RecordSeparator.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.RS]).buffer
    );
  });

  test('Encode UnitSeparator (US)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(UnitSeparator.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.US]).buffer
    );
  });

  test('Encode Space (SP)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Space.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.SP]).buffer
    );
  });

  test('Encode Delete (DEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(Delete.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.DEL]).buffer
    );
  });

  // C1

  test('Encode BlackForeground (BKF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(BlackForeground.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.BKF]).buffer
    );
  });

  test('Encode RedForeground (RDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(RedForeground.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.RDF]).buffer
    );
  });

  test('Encode GreenForeground (GRF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(GreenForeground.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.GRF]).buffer
    );
  });

  test('Encode YellowForeground (YLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(YellowForeground.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.YLF]).buffer
    );
  });

  test('Encode BlueForeground (BLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(BlueForeground.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.BLF]).buffer
    );
  });

  test('Encode MagentaForeground (MGF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(MagentaForeground.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.MGF]).buffer
    );
  });

  test('Encode CyanForeground (CNF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(CyanForeground.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CNF]).buffer
    );
  });

  test('Encode WhiteForeground (WHF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(WhiteForeground.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.WHF]).buffer
    );
  });

  test('Encode ColorControlForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ColorControlForeground.from(4))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x40 | 0x04]).buffer
    );
  });

  test('Encode ColorControlBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ColorControlBackground.from(5))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x50 | 0x05]).buffer
    );
  });

  test('Encode ColorControlHalfForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ColorControlHalfForeground.from(6))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x60 | 0x06]).buffer
    );
  });

  test('Encode ColorControlHalfBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ColorControlHalfBackground.from(7))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x70 | 0x07]).buffer
    );
  });

  test('Encode PalletControl (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(PalletControl.from(8))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x20, 0x40 | 0x08]).buffer
    );
  });

  test('Encode SmallSize (SSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SmallSize.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SSZ]).buffer
    );
  });

  test('Encode MiddleSize (MSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(MiddleSize.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.MSZ]).buffer
    );
  });

  test('Encode NormalSize (NSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(NormalSize.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.NSZ]).buffer
    );
  });

  test('Encode TinySize (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(CharacterSizeControl.from(CharacterSizeControlType.TINY))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, CharacterSizeControlType.TINY]).buffer
    );
  });

  test('Encode DoubleHeight (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, CharacterSizeControlType.DOUBLE_HEIGHT]).buffer
    );
  });

  test('Encode DoubleWidth (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_WIDTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, CharacterSizeControlType.DOUBLE_WIDTH]).buffer
    );
  });

  test('Encode DoubleHeightAndWidth (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH]).buffer
    );
  });

  test('Encode Special1 (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_1))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, CharacterSizeControlType.SPECIAL_1]).buffer
    );
  });

  test('Encode Special2 (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_2))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, CharacterSizeControlType.SPECIAL_2]).buffer
    );
  });

  test('Encode FlashingControl Normal (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(FlashingControl.from(FlashingControlType.NORMAL))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.FLC, FlashingControlType.NORMAL]).buffer
    );
  });

  test('Encode FlashingControl Inverted (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(FlashingControl.from(FlashingControlType.INVERTED))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.FLC, FlashingControlType.INVERTED]).buffer
    );
  });

  test('Encode FlashingControl Stop (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(FlashingControl.from(FlashingControlType.STOP))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.FLC, FlashingControlType.STOP]).buffer
    );
  });

  test('Encode SingleConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SingleConcealmentMode.from(SingleConcealmentModeType.START))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, SingleConcealmentModeType.START]).buffer
    );
  });

  test('Encode SingleConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.START))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.START]).buffer
    );
  });

  test('Encode SingleConcealmentMode First (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FIRST))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.FIRST]).buffer
    );
  });

  test('Encode SingleConcealmentMode Second (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SECOND))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.SECOND]).buffer
    );
  });

  test('Encode SingleConcealmentMode Third (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.THIRD))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.THIRD]).buffer
    );
  });

  test('Encode SingleConcealmentMode Fourth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FOURTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.FOURTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Fifth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FIFTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.FIFTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Sixth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SIXTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.SIXTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Seventh (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SEVENTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.SEVENTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Eighth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.EIGHTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.EIGHTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode ninth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.NINTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.NINTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Tenth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ReplacingConcealmentMode.from(ReplacingConcealmentModeType.TENTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ReplacingConcealmentModeType.TENTH]).buffer
    );
  });

  test('Encode ConcealmentMode Stop (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ConcealmentMode.from(ConcealmentModeType.STOP))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, ConcealmentModeType.STOP]).buffer
    );
  });

  test('Encode PatternPolarityControl Normal (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(PatternPolarityControl.from(PatternPolarityControlType.NORMAL))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.POL, PatternPolarityControlType.NORMAL]).buffer
    );
  });

  test('Encode PatternPolarityControl Inverted1 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(PatternPolarityControl.from(PatternPolarityControlType.INVERTED_1))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.POL, PatternPolarityControlType.INVERTED_1]).buffer
    );
  });

  test('Encode PatternPolarityControl Inverted2 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(PatternPolarityControl.from(PatternPolarityControlType.INVERTED_2))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.POL, PatternPolarityControlType.INVERTED_2]).buffer
    );
  });

  test('Encode WritingModeModification Both (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(WritingModeModification.from(WritingModeModificationType.BOTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.WMM, WritingModeModificationType.BOTH]).buffer
    );
  });

  test('Encode WritingModeModification Foreground (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(WritingModeModification.from(WritingModeModificationType.FOREGROUND))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.WMM, WritingModeModificationType.FOREGROUND]).buffer
    );
  });

  test('Encode WritingModeModification Background (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(WritingModeModification.from(WritingModeModificationType.BACKGROUND))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.WMM, WritingModeModificationType.BACKGROUND]).buffer
    );
  });

  test('Encode WritingModeModification (HLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(HilightingCharacterBlock.from(0x0F))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.HLC, 0x40 | 0x0F]).buffer
    );
  });

  test('Encode RepeatCharacter (RPC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(RepeatCharacter.from(0x0E))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.RPC, 0x40 | 0x0E]).buffer
    );
  });

  test('Encode StartLining (STL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(StartLining.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.STL]).buffer
    );
  });

  test('Encode StartLining (SPL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(StopLining.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SPL]).buffer
    );
  });

  test('Encode TimeControl Wait (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(TimeControlWait.from(5.8))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x20, 0x40 | 58]).buffer
    );
  });

  test('Encode TimeControl Mode Free (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(TimeControlMode.from(TimeControlModeType.FREE))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, TimeControlModeType.FREE]).buffer
    );
  });

  test('Encode TimeControl Mode Real (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(TimeControlMode.from(TimeControlModeType.REAL))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, TimeControlModeType.REAL]).buffer
    );
  });

  test('Encode TimeControl Mode Offset (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(TimeControlMode.from(TimeControlModeType.OFFSET))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, TimeControlModeType.OFFSET]).buffer
    );
  });

  test('Encode TimeControl Mode Unique (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(TimeControlMode.from(TimeControlModeType.UNIQUE))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, TimeControlModeType.UNIQUE]).buffer
    );
  });

  // CSI

  test('Encode SetWritingFormat (SWF) 5 (1920x1080)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SetWritingFormat.from(5))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x35, 0x20, CSI_CODE.SWF]).buffer
    );
  });

  test('Encode SetWritingFormat (SWF) 7 (960x540)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SetWritingFormat.from(7))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x37, 0x20, CSI_CODE.SWF]).buffer
    );
  });

  test('Encode SetWritingFormat (SWF) 9 (720x480)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SetWritingFormat.from(9))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x39, 0x20, CSI_CODE.SWF]).buffer
    );
  });

  test('Encode SetWritingFormat (SWF) 11 (1280x720)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SetWritingFormat.from(11))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x31, 0x20, CSI_CODE.SWF]).buffer
    );
  });

  test('Encode SetDisplayFormat (SDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SetDisplayFormat.from(720, 480))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x37, 0x32, 0x30, 0x3B, 0x34, 0x38, 0x30, 0x20, CSI_CODE.SDF]).buffer
    );
  });

  test('Encode SetDisplayPosition (SDP)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SetDisplayPosition.from(190, 80))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x39, 0x30, 0x3B, 0x38, 0x30, 0x20, CSI_CODE.SDP]).buffer
    );
  });

  test('Encode CharacterCompositionDotDesignation (SSM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(CharacterCompositionDotDesignation.from(24, 24))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x34, 0x3B, 0x32, 0x34, 0x20, CSI_CODE.SSM]).buffer
    );
  });

  test('Encode SetHorizontalSpacing (SHS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SetHorizontalSpacing.from(8))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x38, 0x20, CSI_CODE.SHS]).buffer
    );
  });

  test('Encode SetVerticalSpacing (SVS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(SetVerticalSpacing.from(36))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x33, 0x36, 0x20, CSI_CODE.SVS]).buffer
    );
  });

  test('Encode ActiveCoordinatePositionSet (ACPS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ActiveCoordinatePositionSet.from(1024, 512))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x30, 0x32, 0x34, 0x3B, 0x35, 0x31, 0x32, 0x20, CSI_CODE.ACPS]).buffer
    );
  });

  test('Encode OrnamentControl None (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(OrnamentControlNone.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x30, 0x20, CSI_CODE.ORN]).buffer
    );
  });

  test('Encode OrnamentControl Hemming (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(OrnamentControlHemming.from(0))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x3B, 0x30, 0x20, CSI_CODE.ORN]).buffer
    );
  });

  test('Encode OrnamentControl Shade (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(OrnamentControlShade.from(1))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x3B, 0x31, 0x20, CSI_CODE.ORN]).buffer
    );
  });

  test('Encode OrnamentControl Hollow (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(OrnamentControlHollow.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x33, 0x20, CSI_CODE.ORN]).buffer
    );
  });

  test('Encode BuiltinSoundReplay (PRA)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(BuiltinSoundReplay.from(23))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x33, 0x20, CSI_CODE.PRA]).buffer
    );
  });

  test('Encode RasterColourCommand (RCS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(RasterColourCommand.from(67))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x36, 0x37, 0x20, CSI_CODE.RCS]).buffer
    );
  });
});

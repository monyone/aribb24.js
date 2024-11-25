import { ARIBB24ClearScreenParsedToken } from '@/index';
import ARIBB24UTF8Encoder from '@/lib/encoder/b24/ucs';
import { CONTROL_CODES, CSI_CODE } from '@/lib/tokenizer/b24/tokenizer';
import { ARIBB24ActiveCoordinatePositionSetToken, ARIBB24ActivePositionBackwardToken, ARIBB24ActivePositionDownToken, ARIBB24ActivePositionForwardToken, ARIBB24ActivePositionReturnToken, ARIBB24ActivePositionSetToken, ARIBB24ActivePositionUpToken, ARIBB24BellToken, ARIBB24BlackForegroundToken, ARIBB24BlueForegroundToken, ARIBB24BuiltinSoundReplayToken, ARIBB24CancelToken, ARIBB24CharacterCompositionDotDesignationToken, ARIBB24CharacterSizeControlToken, ARIBB24CharacterSizeControlType, ARIBB24CharacterToken, ARIBB24ClearScreenToken, ARIBB24ColorControlBackgroundToken, ARIBB24ColorControlForegroundToken, ARIBB24ColorControlHalfBackgroundToken, ARIBB24ColorControlHalfForegroundToken, ARIBB24ConcealmentModeToken, ARIBB24ConcealmentModeType, ARIBB24CyanForegroundToken, ARIBB24DeleteToken, ARIBB24FlashingControlToken, ARIBB24FlashingControlType, ARIBB24GreenForegroundToken, ARIBB24HilightingCharacterBlockToken, ARIBB24MagentaForegroundToken, ARIBB24MiddleSizeToken, ARIBB24NormalSizeToken, ARIBB24NullToken, ARIBB24OrnamentControlHemmingToken, ARIBB24OrnamentControlHollowToken, ARIBB24OrnamentControlNoneToken, ARIBB24OrnamentControlShadeToken, ARIBB24PalletControlToken, ARIBB24ParameterizedActivePositionForwardToken, ARIBB24PatternPolarityControlToken, ARIBB24PatternPolarityControlType, ARIBB24RasterColourCommandToken, ARIBB24RecordSeparatorToken, ARIBB24RedForegroundToken, ARIBB24RepeatCharacterToken, ARIBB24ReplacingConcealmentModeToken, ARIBB24ReplacingConcealmentModeType, ARIBB24SetDisplayFormatToken, ARIBB24SetDisplayPositionToken, ARIBB24SetHorizontalSpacingToken, ARIBB24SetVerticalSpacingToken, ARIBB24SetWritingFormatToken, ARIBB24SingleConcealmentModeToken, ARIBB24SingleConcealmentModeType, ARIBB24SmallSizeToken, ARIBB24SpaceToken, ARIBB24StartLiningToken, ARIBB24StopLiningToken, ARIBB24TimeControlModeToken, ARIBB24TimeControlModeType, ARIBB24TimeControlWaitToken, ARIBB24UnitSeparatorToken, ARIBB24WhiteForegroundToken, ARIBB24WritingModeModificationToken, ARIBB24WritingModeModificationType, ARIBB24YellowForegroundToken } from '@/lib/tokenizer/token';
import { describe, test, expect } from 'vitest';

describe("ARIB STD-B24 UCS Encoder", () => {
  test('Encode UTF-8 ASCII', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterToken.from('a'))).toStrictEqual(
      Uint8Array.from([0x61]).buffer
    );
  });

  test('Encode UTF-8 2-bytes', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterToken.from('字'))).toStrictEqual(
      Uint8Array.from([0xE5, 0xAD, 0x97]).buffer
    );
  });

  test('Encode UTF-8 surrogate pair', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterToken.from('𠮟'))).toStrictEqual(
      Uint8Array.from([0xF0, 0xA0, 0xAE, 0x9F]).buffer
    );
  });

  test('Encode UTF-8 surrogate pair', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterToken.from('👨‍👩'))).toStrictEqual(
      Uint8Array.from([0xF0, 0x9F, 0x91, 0xA8, 0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA9]).buffer
    );
  });

  // TODO: DRCS

  // C0
  test('Encode Null (NUL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24NullToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.NUL]).buffer
    );
  });

  test('Encode Bell (BEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24BellToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.BEL]).buffer
    );
  });

  test('Encode ActivePositionBackward (APB)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ActivePositionBackwardToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APB]).buffer
    );
  });

  test('Encode ActivePositionForward (APF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ActivePositionForwardToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APF]).buffer
    );
  });

  test('Encode ActivePositionDown (APD)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ActivePositionDownToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APD]).buffer
    );
  });

  test('Encode ActivePositionDown (APU)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ActivePositionUpToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APU]).buffer
    );
  });

  test('Encode ClearScreen (CS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ClearScreenToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.CS]).buffer
    );
  });

  test('Encode ActivePositionReturn (APR)s', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ActivePositionReturnToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APR]).buffer
    );
  });

  test('Encode ParameterizedActivePositionForward (PAPF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ParameterizedActivePositionForwardToken.from(2))).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.PAPF, 0x40 | 0x02]).buffer
    );
  });

  test('Encode Cancel (CAN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CancelToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.CAN]).buffer
    );
  });

  test('Encode ActivePositionSet (APS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ActivePositionSetToken.from(5, 8))).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.APS, 0x40 | 0x08, 0x40 | 0x05]).buffer
    );
  });

  test('Encode ARIBB24UTF8Encoder (RS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24RecordSeparatorToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.RS]).buffer
    );
  });

  test('Encode UnitSeparator (US)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24UnitSeparatorToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.US]).buffer
    );
  });

  test('Encode Space (SP)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SpaceToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.SP]).buffer
    );
  });

  test('Encode Delete (DEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24DeleteToken.from())).toStrictEqual(
      Uint8Array.from([CONTROL_CODES.DEL]).buffer
    );
  });

  // C1

  test('Encode BlackForeground (BKF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24BlackForegroundToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.BKF]).buffer
    );
  });

  test('Encode RedForeground (RDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24RedForegroundToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.RDF]).buffer
    );
  });

  test('Encode GreenForeground (GRF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24GreenForegroundToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.GRF]).buffer
    );
  });

  test('Encode YellowForeground (YLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24YellowForegroundToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.YLF]).buffer
    );
  });

  test('Encode BlueForeground (BLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24BlueForegroundToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.BLF]).buffer
    );
  });

  test('Encode MagentaForeground (MGF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24MagentaForegroundToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.MGF]).buffer
    );
  });

  test('Encode CyanForeground (CNF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CyanForegroundToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CNF]).buffer
    );
  });

  test('Encode WhiteForeground (WHF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24WhiteForegroundToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.WHF]).buffer
    );
  });

  test('Encode ColorControlForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ColorControlForegroundToken.from(4))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x40 | 0x04]).buffer
    );
  });

  test('Encode ColorControlBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ColorControlBackgroundToken.from(5))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x50 | 0x05]).buffer
    );
  });

  test('Encode ColorControlHalfForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ColorControlHalfForegroundToken.from(6))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x60 | 0x06]).buffer
    );
  });

  test('Encode ColorControlHalfBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ColorControlHalfBackgroundToken.from(7))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x70 | 0x07]).buffer
    );
  });

  test('Encode PalletControl (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24PalletControlToken.from(8))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x20, 0x40 | 0x08]).buffer
    );
  });

  test('Encode SmallSize (SSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SmallSizeToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SSZ]).buffer
    );
  });

  test('Encode MiddleSize (MSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24MiddleSizeToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.MSZ]).buffer
    );
  });

  test('Encode NormalSize (NSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24NormalSizeToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.NSZ]).buffer
    );
  });

  test('Encode TinySize (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.TINY))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.TINY]).buffer
    );
  });

  test('Encode DoubleHeight (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT]).buffer
    );
  });

  test('Encode DoubleWidth (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_WIDTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.DOUBLE_WIDTH]).buffer
    );
  });

  test('Encode DoubleHeightAndWidth (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH]).buffer
    );
  });

  test('Encode Special1 (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_1))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.SPECIAL_1]).buffer
    );
  });

  test('Encode Special2 (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_2))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.SPECIAL_2]).buffer
    );
  });

  test('Encode FlashingControl Normal (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.NORMAL))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.FLC, ARIBB24FlashingControlType.NORMAL]).buffer
    );
  });

  test('Encode FlashingControl Inverted (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.INVERTED))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.FLC, ARIBB24FlashingControlType.INVERTED]).buffer
    );
  });

  test('Encode FlashingControl Stop (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.STOP))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.FLC, ARIBB24FlashingControlType.STOP]).buffer
    );
  });

  test('Encode SingleConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SingleConcealmentModeToken.from(ARIBB24SingleConcealmentModeType.START))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, ARIBB24SingleConcealmentModeType.START]).buffer
    );
  });

  test('Encode SingleConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.START))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.START]).buffer
    );
  });

  test('Encode SingleConcealmentMode First (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FIRST))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.FIRST]).buffer
    );
  });

  test('Encode SingleConcealmentMode Second (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SECOND))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.SECOND]).buffer
    );
  });

  test('Encode SingleConcealmentMode Third (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.THIRD))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.THIRD]).buffer
    );
  });

  test('Encode SingleConcealmentMode Fourth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FOURTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.FOURTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Fifth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FIFTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.FIFTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Sixth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SIXTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.SIXTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Seventh (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SEVENTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.SEVENTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Eighth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.EIGHTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.EIGHTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode ninth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.NINTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.NINTH]).buffer
    );
  });

  test('Encode SingleConcealmentMode Tenth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.TENTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.TENTH]).buffer
    );
  });

  test('Encode ConcealmentMode Stop (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ConcealmentModeToken.from(ARIBB24ConcealmentModeType.STOP))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CDC, ARIBB24ConcealmentModeType.STOP]).buffer
    );
  });

  test('Encode PatternPolarityControl Normal (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.NORMAL))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.POL, ARIBB24PatternPolarityControlType.NORMAL]).buffer
    );
  });

  test('Encode PatternPolarityControl Inverted1 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.INVERTED_1))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.POL, ARIBB24PatternPolarityControlType.INVERTED_1]).buffer
    );
  });

  test('Encode PatternPolarityControl Inverted2 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.INVERTED_2))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.POL, ARIBB24PatternPolarityControlType.INVERTED_2]).buffer
    );
  });

  test('Encode WritingModeModification Both (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.BOTH))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.WMM, ARIBB24WritingModeModificationType.BOTH]).buffer
    );
  });

  test('Encode WritingModeModification Foreground (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.FOREGROUND))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.WMM, ARIBB24WritingModeModificationType.FOREGROUND]).buffer
    );
  });

  test('Encode WritingModeModification Background (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.BACKGROUND))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.WMM, ARIBB24WritingModeModificationType.BACKGROUND]).buffer
    );
  });

  test('Encode WritingModeModification (HLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24HilightingCharacterBlockToken.from(0x0F))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.HLC, 0x40 | 0x0F]).buffer
    );
  });

  test('Encode RepeatCharacter (RPC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24RepeatCharacterToken.from(0x0E))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.RPC, 0x40 | 0x0E]).buffer
    );
  });

  test('Encode StartLining (STL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24StartLiningToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.STL]).buffer
    );
  });

  test('Encode StartLining (SPL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24StopLiningToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.SPL]).buffer
    );
  });

  test('Encode TimeControl Wait (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24TimeControlWaitToken.from(5.8))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x20, 0x40 | 58]).buffer
    );
  });

  test('Encode TimeControl Mode Free (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.FREE))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, ARIBB24TimeControlModeType.FREE]).buffer
    );
  });

  test('Encode TimeControl Mode Real (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.REAL))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, ARIBB24TimeControlModeType.REAL]).buffer
    );
  });

  test('Encode TimeControl Mode Offset (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.OFFSET))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, ARIBB24TimeControlModeType.OFFSET]).buffer
    );
  });

  test('Encode TimeControl Mode Unique (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.UNIQUE))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, ARIBB24TimeControlModeType.UNIQUE]).buffer
    );
  });

  // CSI

  test('Encode SetWritingFormat (SWF) 5 (1920x1080)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SetWritingFormatToken.from(5))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x35, 0x20, CSI_CODE.SWF]).buffer
    );
  });

  test('Encode SetWritingFormat (SWF) 7 (960x540)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SetWritingFormatToken.from(7))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x37, 0x20, CSI_CODE.SWF]).buffer
    );
  });

  test('Encode SetWritingFormat (SWF) 9 (720x480)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SetWritingFormatToken.from(9))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x39, 0x20, CSI_CODE.SWF]).buffer
    );
  });

  test('Encode SetWritingFormat (SWF) 11 (1280x720)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SetWritingFormatToken.from(11))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x31, 0x20, CSI_CODE.SWF]).buffer
    );
  });

  test('Encode SetDisplayFormat (SDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SetDisplayFormatToken.from(720, 480))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x37, 0x32, 0x30, 0x3B, 0x34, 0x38, 0x30, 0x20, CSI_CODE.SDF]).buffer
    );
  });

  test('Encode SetDisplayPosition (SDP)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SetDisplayPositionToken.from(190, 80))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x39, 0x30, 0x3B, 0x38, 0x30, 0x20, CSI_CODE.SDP]).buffer
    );
  });

  test('Encode CharacterCompositionDotDesignation (SSM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24CharacterCompositionDotDesignationToken.from(24, 24))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x34, 0x3B, 0x32, 0x34, 0x20, CSI_CODE.SSM]).buffer
    );
  });

  test('Encode SetHorizontalSpacing (SHS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SetHorizontalSpacingToken.from(8))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x38, 0x20, CSI_CODE.SHS]).buffer
    );
  });

  test('Encode SetVerticalSpacing (SVS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24SetVerticalSpacingToken.from(36))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x33, 0x36, 0x20, CSI_CODE.SVS]).buffer
    );
  });

  test('Encode ActiveCoordinatePositionSet (ACPS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24ActiveCoordinatePositionSetToken.from(1024, 512))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x30, 0x32, 0x34, 0x3B, 0x35, 0x31, 0x32, 0x20, CSI_CODE.ACPS]).buffer
    );
  });

  test('Encode OrnamentControl None (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24OrnamentControlNoneToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x30, 0x20, CSI_CODE.ORN]).buffer
    );
  });

  test('Encode OrnamentControl Hemming (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24OrnamentControlHemmingToken.from(0))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x3B, 0x30, 0x20, CSI_CODE.ORN]).buffer
    );
  });

  test('Encode OrnamentControl Shade (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24OrnamentControlShadeToken.from(1))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x3B, 0x31, 0x20, CSI_CODE.ORN]).buffer
    );
  });

  test('Encode OrnamentControl Hollow (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24OrnamentControlHollowToken.from())).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x33, 0x20, CSI_CODE.ORN]).buffer
    );
  });

  test('Encode BuiltinSoundReplay (PRA)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24BuiltinSoundReplayToken.from(23))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x33, 0x20, CSI_CODE.PRA]).buffer
    );
  });

  test('Encode RasterColourCommand (RCS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encodeToken(ARIBB24RasterColourCommandToken.from(67))).toStrictEqual(
      Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x36, 0x37, 0x20, CSI_CODE.RCS]).buffer
    );
  });
});

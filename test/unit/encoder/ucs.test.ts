import { ARIBB24ClearScreenParsedToken } from '@/index';
import ARIBB24UTF8Encoder from '@/lib/encoder/b24/ucs';
import { CONTROL_CODES, CSI_CODE } from '@/lib/tokenizer/b24/tokenizer';
import { ARIBB24ActiveCoordinatePositionSetToken, ARIBB24ActivePositionBackwardToken, ARIBB24ActivePositionDownToken, ARIBB24ActivePositionForwardToken, ARIBB24ActivePositionReturnToken, ARIBB24ActivePositionSetToken, ARIBB24ActivePositionUpToken, ARIBB24BellToken, ARIBB24BlackForegroundToken, ARIBB24BlueForegroundToken, ARIBB24BuiltinSoundReplayToken, ARIBB24CancelToken, ARIBB24CharacterCompositionDotDesignationToken, ARIBB24CharacterSizeControlToken, ARIBB24CharacterSizeControlType, ARIBB24CharacterToken, ARIBB24ClearScreenToken, ARIBB24ColorControlBackgroundToken, ARIBB24ColorControlForegroundToken, ARIBB24ColorControlHalfBackgroundToken, ARIBB24ColorControlHalfForegroundToken, ARIBB24ConcealmentModeToken, ARIBB24ConcealmentModeType, ARIBB24CyanForegroundToken, ARIBB24DeleteToken, ARIBB24FlashingControlToken, ARIBB24FlashingControlType, ARIBB24GreenForegroundToken, ARIBB24HilightingCharacterBlockToken, ARIBB24MagentaForegroundToken, ARIBB24MiddleSizeToken, ARIBB24NormalSizeToken, ARIBB24NullToken, ARIBB24OrnamentControlHemmingToken, ARIBB24OrnamentControlHollowToken, ARIBB24OrnamentControlNoneToken, ARIBB24OrnamentControlShadeToken, ARIBB24PalletControlToken, ARIBB24ParameterizedActivePositionForwardToken, ARIBB24PatternPolarityControlToken, ARIBB24PatternPolarityControlType, ARIBB24RasterColourCommandToken, ARIBB24RecordSeparatorToken, ARIBB24RedForegroundToken, ARIBB24RepeatCharacterToken, ARIBB24ReplacingConcealmentModeToken, ARIBB24ReplacingConcealmentModeType, ARIBB24SetDisplayFormatToken, ARIBB24SetDisplayPositionToken, ARIBB24SetHorizontalSpacingToken, ARIBB24SetVerticalSpacingToken, ARIBB24SetWritingFormatToken, ARIBB24SingleConcealmentModeToken, ARIBB24SingleConcealmentModeType, ARIBB24SmallSizeToken, ARIBB24SpaceToken, ARIBB24StartLiningToken, ARIBB24StopLiningToken, ARIBB24TimeControlModeToken, ARIBB24TimeControlModeType, ARIBB24TimeControlWaitToken, ARIBB24UnitSeparatorToken, ARIBB24WhiteForegroundToken, ARIBB24WritingModeModificationToken, ARIBB24WritingModeModificationType, ARIBB24YellowForegroundToken } from '@/lib/tokenizer/token';
import { describe, test, expect } from 'vitest';

describe("ARIB STD-B24 UCS Encoder", () => {
  test('Encode UTF-8 ASCII', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterToken.from('a')])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0x61]) }]
    );
  });

  test('Encode UTF-8 2-bytes', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterToken.from('字')])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xE5, 0xAD, 0x97]) }]
    );
  });

  test('Encode UTF-8 surrogate pair', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterToken.from('𠮟')])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xF0, 0xA0, 0xAE, 0x9F]) }]
    );
  });

  test('Encode UTF-8 emoji', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterToken.from('👨‍👩')])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xF0, 0x9F, 0x91, 0xA8, 0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA9]) }]
    );
  });

  // TODO: DRCS

  // C0
  test('Encode Null (NUL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24NullToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.NUL]) }]
    );
  });

  test('Encode Bell (BEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24BellToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.BEL]) }]
    );
  });

  test('Encode ActivePositionBackward (APB)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ActivePositionBackwardToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.APB]) }]
    );
  });

  test('Encode ActivePositionForward (APF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ActivePositionForwardToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.APF]) }]
    );
  });

  test('Encode ActivePositionDown (APD)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ActivePositionDownToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.APD]) }]
    );
  });

  test('Encode ActivePositionDown (APU)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ActivePositionUpToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.APU]) }]
    );
  });

  test('Encode ClearScreen (CS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ClearScreenToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.CS]) }]
    );
  });

  test('Encode ActivePositionReturn (APR)s', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ActivePositionReturnToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.APR]) }]
    );
  });

  test('Encode ParameterizedActivePositionForward (PAPF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ParameterizedActivePositionForwardToken.from(2)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.PAPF, 0x40 | 0x02]) }]
    );
  });

  test('Encode Cancel (CAN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CancelToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.CAN]) }]
    );
  });

  test('Encode ActivePositionSet (APS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ActivePositionSetToken.from(5, 8)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.APS, 0x40 | 0x08, 0x40 | 0x05]) }]
    );
  });

  test('Encode ARIBB24UTF8Encoder (RS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24RecordSeparatorToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.RS]) }]
    );
  });

  test('Encode UnitSeparator (US)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24UnitSeparatorToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.US]) }]
    );
  });

  test('Encode Space (SP)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SpaceToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.SP]) }]
    );
  });

  test('Encode Delete (DEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24DeleteToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([CONTROL_CODES.DEL]) }]
    );
  });

  // C1

  test('Encode BlackForeground (BKF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24BlackForegroundToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.BKF]) }]
    );
  });

  test('Encode RedForeground (RDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24RedForegroundToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.RDF]) }]
    );
  });

  test('Encode GreenForeground (GRF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24GreenForegroundToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.GRF]) }]
    );
  });

  test('Encode YellowForeground (YLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24YellowForegroundToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.YLF]) }]
    );
  });

  test('Encode BlueForeground (BLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24BlueForegroundToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.BLF]) }]
    );
  });

  test('Encode MagentaForeground (MGF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24MagentaForegroundToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.MGF]) }]
    );
  });

  test('Encode CyanForeground (CNF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CyanForegroundToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CNF]) }]
    );
  });

  test('Encode WhiteForeground (WHF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24WhiteForegroundToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.WHF]) }]
    );
  });

  test('Encode ColorControlForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ColorControlForegroundToken.from(4)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x40 | 0x04]) }]
    );
  });

  test('Encode ColorControlBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ColorControlBackgroundToken.from(5)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x50 | 0x05]) }]
    );
  });

  test('Encode ColorControlHalfForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ColorControlHalfForegroundToken.from(6)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x60 | 0x06]) }]
    );
  });

  test('Encode ColorControlHalfBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ColorControlHalfBackgroundToken.from(7)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x70 | 0x07]) }]
    );
  });

  test('Encode PalletControl (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24PalletControlToken.from(8)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.COL, 0x20, 0x40 | 0x08]) }]
    );
  });

  test('Encode SmallSize (SSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SmallSizeToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.SSZ]) }]
    );
  });

  test('Encode MiddleSize (MSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24MiddleSizeToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.MSZ]) }]
    );
  });

  test('Encode NormalSize (NSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24NormalSizeToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.NSZ]) }]
    );
  });

  test('Encode TinySize (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.TINY)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.TINY]) }]
    );
  });

  test('Encode DoubleHeight (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT]) }]
    );
  });

  test('Encode DoubleWidth (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_WIDTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.DOUBLE_WIDTH]) }]
    );
  });

  test('Encode DoubleHeightAndWidth (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH]) }]
    );
  });

  test('Encode Special1 (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_1)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.SPECIAL_1]) }]
    );
  });

  test('Encode Special2 (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_2)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.SZX, ARIBB24CharacterSizeControlType.SPECIAL_2]) }]
    );
  });

  test('Encode FlashingControl Normal (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.NORMAL)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.FLC, ARIBB24FlashingControlType.NORMAL]) }]
    );
  });

  test('Encode FlashingControl Inverted (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.INVERTED)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.FLC, ARIBB24FlashingControlType.INVERTED]) }]
    );
  });

  test('Encode FlashingControl Stop (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.STOP)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.FLC, ARIBB24FlashingControlType.STOP]) }]
    );
  });

  test('Encode SingleConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SingleConcealmentModeToken.from(ARIBB24SingleConcealmentModeType.START)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, ARIBB24SingleConcealmentModeType.START]) }]
    );
  });

  test('Encode SingleConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.START)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.START]) }]
    );
  });

  test('Encode SingleConcealmentMode First (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FIRST)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.FIRST]) }]
    );
  });

  test('Encode SingleConcealmentMode Second (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SECOND)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.SECOND]) }]
    );
  });

  test('Encode SingleConcealmentMode Third (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.THIRD)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.THIRD]) }]
    );
  });

  test('Encode SingleConcealmentMode Fourth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FOURTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.FOURTH]) }]
    );
  });

  test('Encode SingleConcealmentMode Fifth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FIFTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.FIFTH]) }]
    );
  });

  test('Encode SingleConcealmentMode Sixth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SIXTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.SIXTH]) }]
    );
  });

  test('Encode SingleConcealmentMode Seventh (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SEVENTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.SEVENTH]) }]
    );
  });

  test('Encode SingleConcealmentMode Eighth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.EIGHTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.EIGHTH]) }]
    );
  });

  test('Encode SingleConcealmentMode ninth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.NINTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.NINTH]) }]
    );
  });

  test('Encode SingleConcealmentMode Tenth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.TENTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, 0x20, ARIBB24ReplacingConcealmentModeType.TENTH]) }]
    );
  });

  test('Encode ConcealmentMode Stop (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ConcealmentModeToken.from(ARIBB24ConcealmentModeType.STOP)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CDC, ARIBB24ConcealmentModeType.STOP]) }]
    );
  });

  test('Encode PatternPolarityControl Normal (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.NORMAL)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.POL, ARIBB24PatternPolarityControlType.NORMAL]) }]
    );
  });

  test('Encode PatternPolarityControl Inverted1 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.INVERTED_1)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.POL, ARIBB24PatternPolarityControlType.INVERTED_1]) }]
    );
  });

  test('Encode PatternPolarityControl Inverted2 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.INVERTED_2)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.POL, ARIBB24PatternPolarityControlType.INVERTED_2]) }]
    );
  });

  test('Encode WritingModeModification Both (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.BOTH)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.WMM, ARIBB24WritingModeModificationType.BOTH]) }]
    );
  });

  test('Encode WritingModeModification Foreground (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.FOREGROUND)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.WMM, ARIBB24WritingModeModificationType.FOREGROUND]) }]
    );
  });

  test('Encode WritingModeModification Background (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.BACKGROUND)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.WMM, ARIBB24WritingModeModificationType.BACKGROUND]) }]
    );
  });

  test('Encode WritingModeModification (HLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24HilightingCharacterBlockToken.from(0x0F)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.HLC, 0x40 | 0x0F]) }]
    );
  });

  test('Encode RepeatCharacter (RPC)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24RepeatCharacterToken.from(0x0E)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.RPC, 0x40 | 0x0E]) }]
    );
  });

  test('Encode StartLining (STL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24StartLiningToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.STL]) }]
    );
  });

  test('Encode StartLining (SPL)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24StopLiningToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.SPL]) }]
    );
  });

  test('Encode TimeControl Wait (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24TimeControlWaitToken.from(5.8)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x20, 0x40 | 58]) }]
    );
  });

  test('Encode TimeControl Mode Free (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.FREE)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, ARIBB24TimeControlModeType.FREE]) }]
    );
  });

  test('Encode TimeControl Mode Real (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.REAL)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, ARIBB24TimeControlModeType.REAL]) }]
    );
  });

  test('Encode TimeControl Mode Offset (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.OFFSET)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, ARIBB24TimeControlModeType.OFFSET]) }]
    );
  });

  test('Encode TimeControl Mode Unique (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.UNIQUE)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.TIME, 0x28, ARIBB24TimeControlModeType.UNIQUE]) }]
    );
  });

  // CSI

  test('Encode SetWritingFormat (SWF) 5 (1920x1080)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SetWritingFormatToken.from(5)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x35, 0x20, CSI_CODE.SWF]) }]
    );
  });

  test('Encode SetWritingFormat (SWF) 7 (960x540)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SetWritingFormatToken.from(7)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x37, 0x20, CSI_CODE.SWF]) }]
    );
  });

  test('Encode SetWritingFormat (SWF) 9 (720x480)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SetWritingFormatToken.from(9)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x39, 0x20, CSI_CODE.SWF]) }]
    );
  });

  test('Encode SetWritingFormat (SWF) 11 (1280x720)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SetWritingFormatToken.from(11)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x31, 0x20, CSI_CODE.SWF]) }]
    );
  });

  test('Encode SetDisplayFormat (SDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SetDisplayFormatToken.from(720, 480)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x37, 0x32, 0x30, 0x3B, 0x34, 0x38, 0x30, 0x20, CSI_CODE.SDF]) }]
    );
  });

  test('Encode SetDisplayPosition (SDP)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SetDisplayPositionToken.from(190, 80)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x39, 0x30, 0x3B, 0x38, 0x30, 0x20, CSI_CODE.SDP]) }]
    );
  });

  test('Encode CharacterCompositionDotDesignation (SSM)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24CharacterCompositionDotDesignationToken.from(24, 24)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x34, 0x3B, 0x32, 0x34, 0x20, CSI_CODE.SSM]) }]
    );
  });

  test('Encode SetHorizontalSpacing (SHS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SetHorizontalSpacingToken.from(8)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x38, 0x20, CSI_CODE.SHS]) }]
    );
  });

  test('Encode SetVerticalSpacing (SVS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24SetVerticalSpacingToken.from(36)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x33, 0x36, 0x20, CSI_CODE.SVS]) }]
    );
  });

  test('Encode ActiveCoordinatePositionSet (ACPS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24ActiveCoordinatePositionSetToken.from(1024, 512)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x30, 0x32, 0x34, 0x3B, 0x35, 0x31, 0x32, 0x20, CSI_CODE.ACPS]) }]
    );
  });

  test('Encode OrnamentControl None (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24OrnamentControlNoneToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x30, 0x20, CSI_CODE.ORN]) }]
    );
  });

  test('Encode OrnamentControl Hemming (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24OrnamentControlHemmingToken.from(0)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x31, 0x3B, 0x30, 0x20, CSI_CODE.ORN]) }]
    );
  });

  test('Encode OrnamentControl Shade (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24OrnamentControlShadeToken.from(1)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x3B, 0x31, 0x20, CSI_CODE.ORN]) }]
    );
  });

  test('Encode OrnamentControl Hollow (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24OrnamentControlHollowToken.from()])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x33, 0x20, CSI_CODE.ORN]) }]
    );
  });

  test('Encode BuiltinSoundReplay (PRA)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24BuiltinSoundReplayToken.from(23)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x32, 0x33, 0x20, CSI_CODE.PRA]) }]
    );
  });

  test('Encode RasterColourCommand (RCS)', () => {
    const encoder = new ARIBB24UTF8Encoder();

    expect(encoder.encode([ARIBB24RasterColourCommandToken.from(67)])).toStrictEqual(
      [{ tag: 'Statement', data: Uint8Array.from([0xC2, CONTROL_CODES.CSI, 0x36, 0x37, 0x20, CSI_CODE.RCS]) }]
    );
  });
});

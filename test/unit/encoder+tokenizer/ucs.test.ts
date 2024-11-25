import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/lib/tokenizer/b24/ucs/tokenizer';
import ARIBB24UTF8Encoder from '@/lib/encoder/b24/ucs';
import { ARIBB24ActiveCoordinatePositionSetToken, ARIBB24ActivePositionBackwardToken, ARIBB24ActivePositionDownToken, ARIBB24ActivePositionForwardToken, ARIBB24ActivePositionReturnToken, ARIBB24ActivePositionSetToken, ARIBB24ActivePositionUpToken, ARIBB24BellToken, ARIBB24BlackForegroundToken, ARIBB24BlueForegroundToken, ARIBB24BuiltinSoundReplayToken, ARIBB24CancelToken, ARIBB24CharacterCompositionDotDesignationToken, ARIBB24CharacterSizeControlToken, ARIBB24CharacterSizeControlType, ARIBB24CharacterToken, ARIBB24ClearScreenToken, ARIBB24ColorControlBackgroundToken, ARIBB24ColorControlForegroundToken, ARIBB24ColorControlHalfBackgroundToken, ARIBB24ColorControlHalfForegroundToken, ARIBB24ConcealmentModeToken, ARIBB24ConcealmentModeType, ARIBB24CyanForegroundToken, ARIBB24DeleteToken, ARIBB24DRCSToken, ARIBB24FlashingControlToken, ARIBB24FlashingControlType, ARIBB24GreenForegroundToken, ARIBB24HilightingCharacterBlockToken, ARIBB24MagentaForegroundToken, ARIBB24MiddleSizeToken, ARIBB24NormalSizeToken, ARIBB24NullToken, ARIBB24OrnamentControlHemmingToken, ARIBB24OrnamentControlHollowToken, ARIBB24OrnamentControlNoneToken, ARIBB24OrnamentControlShadeToken, ARIBB24PalletControlToken, ARIBB24ParameterizedActivePositionForwardToken, ARIBB24PatternPolarityControlToken, ARIBB24PatternPolarityControlType, ARIBB24RasterColourCommandToken, ARIBB24RecordSeparatorToken, ARIBB24RedForegroundToken, ARIBB24RepeatCharacterToken, ARIBB24ReplacingConcealmentModeToken, ARIBB24ReplacingConcealmentModeType, ARIBB24SetDisplayFormatToken, ARIBB24SetDisplayPositionToken, ARIBB24SetHorizontalSpacingToken, ARIBB24SetVerticalSpacingToken, ARIBB24SetWritingFormatToken, ARIBB24SingleConcealmentModeToken, ARIBB24SingleConcealmentModeType, ARIBB24SmallSizeToken, ARIBB24SpaceToken, ARIBB24StartLiningToken, ARIBB24StopLiningToken, ARIBB24TimeControlModeToken, ARIBB24TimeControlModeType, ARIBB24TimeControlWaitToken, ARIBB24UnitSeparatorToken, ARIBB24WhiteForegroundToken, ARIBB24WritingModeModificationToken, ARIBB24WritingModeModificationType, ARIBB24YellowForegroundToken } from '@/lib/tokenizer/token';

const generateCharacterTokens = (str: string) => {
  const segmenter = new Intl.Segmenter();
  return Array.from(segmenter.segment(str), ({ segment }) => segment).map((seg) => ARIBB24CharacterToken.from(seg));
}

describe("ARIB STD-B24 Encoder then Tokenizer", () => {
  test('Keep Consistenty UTF-8 ASCII', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode(generateCharacterTokens('This')))).toStrictEqual([
      ... generateCharacterTokens('This')
    ]);
  });

  test('Keep Consistenty 2-bytes string', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode(generateCharacterTokens('あ')))).toStrictEqual([
      ... generateCharacterTokens('あ')
    ]);
  });

  test('Keep Consistenty surrogate pair', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode(generateCharacterTokens('𠮟')))).toStrictEqual([
      ... generateCharacterTokens('𠮟')
    ]);
  });

  test('Keep Consistenty combining character', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode(generateCharacterTokens('👨‍👩')))).toStrictEqual([
      ... generateCharacterTokens('👨‍👩')
    ]);
  });

  test('Keep Consistenty DRCS', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24DRCSToken.from(36, 36, 2, new ArrayBuffer(324))]))).toStrictEqual([
      ARIBB24DRCSToken.from(36, 36, 2, new ArrayBuffer(324))
    ]);
  });

  test('Keep Consistenty DRCS with Combine', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24DRCSToken.from(36, 36, 2, new ArrayBuffer(324), '\u3099')]))).toStrictEqual([
      ARIBB24DRCSToken.from(36, 36, 2, new ArrayBuffer(324), '\u3099')
    ]);
  });

  test('Keep Consistenty NULL (NUL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24NullToken.from()]))).toStrictEqual([
      ARIBB24NullToken.from()
    ]);
  });

  test('Keep Consistenty Bell (BEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24BellToken.from()]))).toStrictEqual([
      ARIBB24BellToken.from()
    ]);
  });

  test('Keep Consistenty ActivePositionBackward (APB)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ActivePositionBackwardToken.from()]))).toStrictEqual([
      ARIBB24ActivePositionBackwardToken.from()
    ]);
  });

  test('Keep Consistenty ActivePositionForward (APF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ActivePositionForwardToken.from()]))).toStrictEqual([
      ARIBB24ActivePositionForwardToken.from()
    ]);
  });

  test('Keep Consistenty ActivePositionDown (APD)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ActivePositionDownToken.from()]))).toStrictEqual([
      ARIBB24ActivePositionDownToken.from()
    ]);
  });

  test('Keep Consistenty ActivePositionUp (APU)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ActivePositionUpToken.from()]))).toStrictEqual([
      ARIBB24ActivePositionUpToken.from()
    ]);
  });

  test('Keep Consistenty ClearScreen (CS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ClearScreenToken.from()]))).toStrictEqual([
      ARIBB24ClearScreenToken.from()
    ]);
  });

  test('Keep Consistenty ActivePositionReturn (APR)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ActivePositionReturnToken.from()]))).toStrictEqual([
      ARIBB24ActivePositionReturnToken.from()
    ]);
  });

  test('Keep Consistenty ParameterizedActivePositionForward (PAPF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ParameterizedActivePositionForwardToken.from(3)]))).toStrictEqual([
      ARIBB24ParameterizedActivePositionForwardToken.from(3)
    ]);
  });

  test('Keep Consistenty Cancel (CAN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CancelToken.from()]))).toStrictEqual([
      ARIBB24CancelToken.from()
    ]);
  });

  test('Keep Consistenty ActivePositionSet (APS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ActivePositionSetToken.from(21, 15)]))).toStrictEqual([
      ARIBB24ActivePositionSetToken.from(21, 15)
    ]);
  });

  test('Keep Consistenty RecordSeparator (RS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24RecordSeparatorToken.from()]))).toStrictEqual([
      ARIBB24RecordSeparatorToken.from()
    ]);
  });

  test('Keep Consistenty UnitSeparator (US)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24UnitSeparatorToken.from()]))).toStrictEqual([
      ARIBB24UnitSeparatorToken.from()
    ]);
  });

  test('Keep Consistenty Space (SP)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SpaceToken.from()]))).toStrictEqual([
      ARIBB24SpaceToken.from()
    ]);
  });

  test('Keep Consistenty Delete (DEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24DeleteToken.from()]))).toStrictEqual([
      ARIBB24DeleteToken.from()
    ]);
  });

  test('Keep Consistenty BlackForeground (BKF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24BlackForegroundToken.from()]))).toStrictEqual([
      ARIBB24BlackForegroundToken.from()
    ]);
  });

  test('Keep Consistenty RedForeground (RDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24RedForegroundToken.from()]))).toStrictEqual([
      ARIBB24RedForegroundToken.from()
    ]);
  });

  test('Keep Consistenty GreenForeground (GRF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24GreenForegroundToken.from()]))).toStrictEqual([
      ARIBB24GreenForegroundToken.from()
    ]);
  });

  test('Keep Consistenty YellowForeground (YLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24YellowForegroundToken.from()]))).toStrictEqual([
      ARIBB24YellowForegroundToken.from()
    ]);
  });

  test('Keep Consistenty BlueForeground (BLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24BlueForegroundToken.from()]))).toStrictEqual([
      ARIBB24BlueForegroundToken.from()
    ]);
  });

  test('Keep Consistenty MagentaForeground (MGF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24MagentaForegroundToken.from()]))).toStrictEqual([
      ARIBB24MagentaForegroundToken.from()
    ]);
  });

  test('Keep Consistenty CyanForeground (CNF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CyanForegroundToken.from()]))).toStrictEqual([
      ARIBB24CyanForegroundToken.from()
    ]);
  });

  test('Keep Consistenty WhiteForeground (WHF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24WhiteForegroundToken.from()]))).toStrictEqual([
      ARIBB24WhiteForegroundToken.from()
    ]);
  });

  test('Keep Consistenty ColorControlForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ColorControlForegroundToken.from(5)]))).toStrictEqual([
      ARIBB24ColorControlForegroundToken.from(5)
    ]);
  });

  test('Keep Consistenty ColorControlBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ColorControlBackgroundToken.from(6)]))).toStrictEqual([
      ARIBB24ColorControlBackgroundToken.from(6)
    ]);
  });

  test('Keep Consistenty ColorControlHalfForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ColorControlHalfForegroundToken.from(7)]))).toStrictEqual([
      ARIBB24ColorControlHalfForegroundToken.from(7)
    ]);
  });

  test('Keep Consistenty ColorControlHalfBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ColorControlHalfBackgroundToken.from(8)]))).toStrictEqual([
      ARIBB24ColorControlHalfBackgroundToken.from(8)
    ]);
  });

  test('Keep Consistenty PalletControl (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24PalletControlToken.from(1)]))).toStrictEqual([
      ARIBB24PalletControlToken.from(1)
    ]);
  });

  test('Keep Consistenty Small Size (SSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SmallSizeToken.from()]))).toStrictEqual([
      ARIBB24SmallSizeToken.from()
    ]);
  });

  test('Keep Consistenty Middle Size (MSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24MiddleSizeToken.from()]))).toStrictEqual([
      ARIBB24MiddleSizeToken.from()
    ]);
  });

  test('Keep Consistenty Normal Size (NSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24NormalSizeToken.from()]))).toStrictEqual([
      ARIBB24NormalSizeToken.from()
    ]);
  });

  test('Keep Consistenty Tiny Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.TINY)]))).toStrictEqual([
      ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.TINY)
    ]);
  });

  test('Keep Consistenty Double Height Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT)]))).toStrictEqual([
      ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT)
    ]);
  });

  test('Keep Consistenty Double Width Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_WIDTH)]))).toStrictEqual([
      ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_WIDTH)
    ]);
  });

  test('Keep Consistenty Double Height And Width Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH)]))).toStrictEqual([
      ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH)
    ]);
  });

  test('Keep Consistenty Special1 Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_1)]))).toStrictEqual([
      ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_1)
    ]);
  });

  test('Keep Consistenty Special 2 (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_2)]))).toStrictEqual([
      ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_2)
    ]);
  });

  test('Keep Consistenty Flashing Normal (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.NORMAL)]))).toStrictEqual([
      ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.NORMAL)
    ]);
  });

  test('Keep Consistenty Flashing Inverted (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.INVERTED)]))).toStrictEqual([
      ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.INVERTED)
    ]);
  });

  test('Keep Consistenty Flashing Stop (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.STOP)]))).toStrictEqual([
      ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.STOP)
    ]);
  });

  test('Keep Consistenty SingleConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SingleConcealmentModeToken.from(ARIBB24SingleConcealmentModeType.START)]))).toStrictEqual([
      ARIBB24SingleConcealmentModeToken.from(ARIBB24SingleConcealmentModeType.START)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.START)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.START)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode First (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FIRST)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FIRST)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Second (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SECOND)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SECOND)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Third (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.THIRD)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.THIRD)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Fourth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FOURTH)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FOURTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Fifth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FIFTH)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.FIFTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Sixth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SIXTH)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SIXTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Seventh (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SEVENTH)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.SEVENTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Eighth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.EIGHTH)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.EIGHTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Ninth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.NINTH)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.NINTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Tenth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.TENTH)]))).toStrictEqual([
      ARIBB24ReplacingConcealmentModeToken.from(ARIBB24ReplacingConcealmentModeType.TENTH)
    ]);
  });

  test('Keep Consistenty ConcealmentMode Stop (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ConcealmentModeToken.from(ARIBB24ConcealmentModeType.STOP)]))).toStrictEqual([
      ARIBB24ConcealmentModeToken.from(ARIBB24ConcealmentModeType.STOP)
    ]);
  });

  test('Keep Consistenty PatternPolarityControl Normal (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.NORMAL)]))).toStrictEqual([
      ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.NORMAL)
    ]);
  });

  test('Keep Consistenty PatternPolarityControl Inverted1 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.INVERTED_1)]))).toStrictEqual([
      ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.INVERTED_1)
    ]);
  });

  test('Keep Consistenty PatternPolarityControl Inverted2 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.INVERTED_2)]))).toStrictEqual([
      ARIBB24PatternPolarityControlToken.from(ARIBB24PatternPolarityControlType.INVERTED_2)
    ]);
  });

  test('Keep Consistenty WritingModeModification Both (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.BOTH)]))).toStrictEqual([
      ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.BOTH)
    ]);
  });

  test('Keep Consistenty WritingModeModification Foreground (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.FOREGROUND)]))).toStrictEqual([
      ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.FOREGROUND)
    ]);
  });

  test('Keep Consistenty WritingModeModification Background (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.BACKGROUND)]))).toStrictEqual([
      ARIBB24WritingModeModificationToken.from(ARIBB24WritingModeModificationType.BACKGROUND)
    ]);
  });

  test('Keep Consistenty HilightingCharacterBlock (HLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24HilightingCharacterBlockToken.from(0x0F)]))).toStrictEqual([
      ARIBB24HilightingCharacterBlockToken.from(0x0F)
    ]);
  });

  test('Keep Consistenty RepeatCharacter (RPC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24RepeatCharacterToken.from(0x0F)]))).toStrictEqual([
      ARIBB24RepeatCharacterToken.from(0x0F)
    ]);
  });

  test('Keep Consistenty StartLining (STL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24StartLiningToken.from()]))).toStrictEqual([
      ARIBB24StartLiningToken.from()
    ]);
  });

  test('Keep Consistenty StopLining (SPL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24StopLiningToken.from()]))).toStrictEqual([
      ARIBB24StopLiningToken.from()
    ]);
  });

  test('Keep Consistenty TimeControl Wait (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24TimeControlWaitToken.from(4.3)]))).toStrictEqual([
      ARIBB24TimeControlWaitToken.from(4.3)
    ]);
  });

  test('Keep Consistenty TimeControl Mode Free (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.FREE)]))).toStrictEqual([
      ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.FREE)
    ]);
  });

  test('Keep Consistenty TimeControl Mode Real (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.REAL)]))).toStrictEqual([
      ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.REAL)
    ]);
  });

  test('Keep Consistenty TimeControl Mode Offset (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.OFFSET)]))).toStrictEqual([
      ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.OFFSET)
    ]);
  });

  test('Keep Consistenty TimeControl Mode Unique (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.UNIQUE)]))).toStrictEqual([
      ARIBB24TimeControlModeToken.from(ARIBB24TimeControlModeType.UNIQUE)
    ]);
  });

  test('Keep Consistenty SetWritingFormat (SWF) 5 (1920x1080)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SetWritingFormatToken.from(5)]))).toStrictEqual([
      ARIBB24SetWritingFormatToken.from(5)
    ]);
  });

  test('Keep Consistenty SetWritingFormat (SWF) 7 (960x540)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SetWritingFormatToken.from(7)]))).toStrictEqual([
      ARIBB24SetWritingFormatToken.from(7)
    ]);
  });

  test('Keep Consistenty SetWritingFormat (SWF) 9 (720x480)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SetWritingFormatToken.from(9)]))).toStrictEqual([
      ARIBB24SetWritingFormatToken.from(9)
    ]);
  });

  test('Keep Consistenty SetWritingFormat (SWF) 11 (1280x720)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SetWritingFormatToken.from(11)]))).toStrictEqual([
      ARIBB24SetWritingFormatToken.from(11)
    ]);
  });

  test('Keep Consistenty SetDisplayFormat (SDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SetDisplayFormatToken.from(720, 480)]))).toStrictEqual([
      ARIBB24SetDisplayFormatToken.from(720, 480)
    ]);
  });

  test('Keep Consistenty SetDisplayPosition (SDP)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SetDisplayPositionToken.from(120, 40)]))).toStrictEqual([
      ARIBB24SetDisplayPositionToken.from(120, 40)
    ]);
  });

  test('Keep Consistenty SetDisplayPosition (SSM)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24CharacterCompositionDotDesignationToken.from(12, 24)]))).toStrictEqual([
      ARIBB24CharacterCompositionDotDesignationToken.from(12, 24)
    ]);
  });

  test('Keep Consistenty SetHorizontalSpacing (SHS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SetHorizontalSpacingToken.from(2)]))).toStrictEqual([
      ARIBB24SetHorizontalSpacingToken.from(2)
    ]);
  });

  test('Keep Consistenty SetVerticalSpacing (SVS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24SetVerticalSpacingToken.from(12)]))).toStrictEqual([
      ARIBB24SetVerticalSpacingToken.from(12)
    ]);
  });

  test('Keep Consistenty ActiveCoordinatePositionSet (ACPS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24ActiveCoordinatePositionSetToken.from(120, 240)]))).toStrictEqual([
      ARIBB24ActiveCoordinatePositionSetToken.from(120, 240)
    ]);
  });

  test('Keep Consistenty OrnamentControl None (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24OrnamentControlNoneToken.from()]))).toStrictEqual([
      ARIBB24OrnamentControlNoneToken.from()
    ]);
  });

  test('Keep Consistenty OrnamentControl Hemming (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24OrnamentControlHemmingToken.from(1)]))).toStrictEqual([
      ARIBB24OrnamentControlHemmingToken.from(1)
    ]);
  });

  test('Keep Consistenty OrnamentControl Shade (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24OrnamentControlShadeToken.from(2)]))).toStrictEqual([
      ARIBB24OrnamentControlShadeToken.from(2)
    ]);
  });

  test('Keep Consistenty OrnamentControl Hollow (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24OrnamentControlHollowToken.from()]))).toStrictEqual([
      ARIBB24OrnamentControlHollowToken.from()
    ]);
  });

  test('Keep Consistenty BuiltinSoundReplay (PRA)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24BuiltinSoundReplayToken.from(1)]))).toStrictEqual([
      ARIBB24BuiltinSoundReplayToken.from(1)
    ]);
  });

  test('Keep Consistenty RasterColourCommand (RCS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ARIBB24RasterColourCommandToken.from(2)]))).toStrictEqual([
      ARIBB24RasterColourCommandToken.from(2)
    ]);
  });
});

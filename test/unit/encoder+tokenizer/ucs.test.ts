import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/lib/tokenizer/b24/ucs/tokenizer';
import ARIBB24UTF8Encoder from '@/lib/encoder/b24/ucs';
import { ActiveCoordinatePositionSet, ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, BlackForeground, BlueForeground, BuiltinSoundReplay, Cancel, Character, CharacterCompositionDotDesignation, CharacterSizeControl, CharacterSizeControlType, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, ConcealmentMode, ConcealmentModeType, CyanForeground, Delete, DRCS, FlashingControl, FlashingControlType, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, OrnamentControlHemming, OrnamentControlHollow, OrnamentControlNone, OrnamentControlShade, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, PatternPolarityControlType, RasterColourCommand, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, ReplacingConcealmentModeType, SetDisplayFormat, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SingleConcealmentMode, SingleConcealmentModeType, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlModeType, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, WritingModeModificationType, YellowForeground } from '@/lib/tokenizer/token';

const generateCharacterTokens = (str: string) => {
  const segmenter = new Intl.Segmenter();
  return Array.from(segmenter.segment(str), ({ segment }) => segment).map((seg) => Character.from(seg));
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

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ DRCS.from(36, 36, 2, new ArrayBuffer(324)) ]))).toStrictEqual([
      DRCS.from(36, 36, 2, new ArrayBuffer(324))
    ]);
  });

  test('Keep Consistenty DRCS with Combine', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ DRCS.from(36, 36, 2, new ArrayBuffer(324), '\u3099') ]))).toStrictEqual([
      DRCS.from(36, 36, 2, new ArrayBuffer(324), '\u3099')
    ]);
  });

  test('Keep Consistenty NULL (NUL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([Null.from()]))).toStrictEqual([
      Null.from()
    ]);
  });

  test('Keep Consistenty Bell (BEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([Bell.from()]))).toStrictEqual([
      Bell.from()
    ]);
  });

  test('Keep Consistenty ActivePositionBackward (APB)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ActivePositionBackward.from()]))).toStrictEqual([
      ActivePositionBackward.from()
    ]);
  });

  test('Keep Consistenty ActivePositionForward (APF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ActivePositionForward.from()]))).toStrictEqual([
      ActivePositionForward.from()
    ]);
  });

  test('Keep Consistenty ActivePositionDown (APD)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ActivePositionDown.from()]))).toStrictEqual([
      ActivePositionDown.from()
    ]);
  });

  test('Keep Consistenty ActivePositionUp (APU)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ActivePositionUp.from()]))).toStrictEqual([
      ActivePositionUp.from()
    ]);
  });

  test('Keep Consistenty ActivePositionUp (APU)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ActivePositionUp.from()]))).toStrictEqual([
      ActivePositionUp.from()
    ]);
  });

  test('Keep Consistenty ClearScreen (CS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ClearScreen.from()]))).toStrictEqual([
      ClearScreen.from()
    ]);
  });

  test('Keep Consistenty ActivePositionReturn (APR)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ActivePositionReturn.from()]))).toStrictEqual([
      ActivePositionReturn.from()
    ]);
  });

  test('Keep Consistenty ParameterizedActivePositionForward (PAPF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ParameterizedActivePositionForward.from(3)]))).toStrictEqual([
      ParameterizedActivePositionForward.from(3)
    ]);
  });

  test('Keep Consistenty Cancel (CAN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([Cancel.from()]))).toStrictEqual([
      Cancel.from()
    ]);
  });

  test('Keep Consistenty ActivePositionSet (APS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ActivePositionSet.from(21, 15)]))).toStrictEqual([
      ActivePositionSet.from(21, 15)
    ]);
  });

  test('Keep Consistenty RecordSeparator (RS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([RecordSeparator.from()]))).toStrictEqual([
      RecordSeparator.from()
    ]);
  });

  test('Keep Consistenty UnitSeparator (US)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([UnitSeparator.from()]))).toStrictEqual([
      UnitSeparator.from()
    ]);
  });

  test('Keep Consistenty Space (SP)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([Space.from()]))).toStrictEqual([
      Space.from()
    ]);
  });

  test('Keep Consistenty Delete (DEL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([Delete.from()]))).toStrictEqual([
      Delete.from()
    ]);
  });

  test('Keep Consistenty BlackForeground (BKF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([BlackForeground.from()]))).toStrictEqual([
      BlackForeground.from()
    ]);
  });

  test('Keep Consistenty RedForeground (RDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([RedForeground.from()]))).toStrictEqual([
      RedForeground.from()
    ]);
  });

  test('Keep Consistenty GreenForeground (GRF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([GreenForeground.from()]))).toStrictEqual([
      GreenForeground.from()
    ]);
  });

  test('Keep Consistenty YellowForeground (YLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([YellowForeground.from()]))).toStrictEqual([
      YellowForeground.from()
    ]);
  });

  test('Keep Consistenty BlueForeground (BLF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([BlueForeground.from()]))).toStrictEqual([
      BlueForeground.from()
    ]);
  });

  test('Keep Consistenty MagentaForeground (MGF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([MagentaForeground.from()]))).toStrictEqual([
      MagentaForeground.from()
    ]);
  });

  test('Keep Consistenty CyanForeground (CNF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([CyanForeground.from()]))).toStrictEqual([
      CyanForeground.from()
    ]);
  });

  test('Keep Consistenty WhiteForeground (WHF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([WhiteForeground.from()]))).toStrictEqual([
      WhiteForeground.from()
    ]);
  });

  test('Keep Consistenty ColorControlForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ColorControlForeground.from(5)]))).toStrictEqual([
      ColorControlForeground.from(5)
    ]);
  });

  test('Keep Consistenty ColorControlBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ColorControlBackground.from(6)]))).toStrictEqual([
      ColorControlBackground.from(6)
    ]);
  });

  test('Keep Consistenty ColorControlHalfForeground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ColorControlHalfForeground.from(7)]))).toStrictEqual([
      ColorControlHalfForeground.from(7)
    ]);
  });

  test('Keep Consistenty ColorControlHalfBackground (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ColorControlHalfBackground.from(8)]))).toStrictEqual([
      ColorControlHalfBackground.from(8)
    ]);
  });

  test('Keep Consistenty PalletControl (COL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([PalletControl.from(1)]))).toStrictEqual([
      PalletControl.from(1)
    ]);
  });

  test('Keep Consistenty Small Size (SSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SmallSize.from()]))).toStrictEqual([
      SmallSize.from()
    ]);
  });

  test('Keep Consistenty Middle Size (MSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([MiddleSize.from()]))).toStrictEqual([
      MiddleSize.from()
    ]);
  });

  test('Keep Consistenty Normal Size (NSZ)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([NormalSize.from()]))).toStrictEqual([
      NormalSize.from()
    ]);
  });

  test('Keep Consistenty Tiny Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([CharacterSizeControl.from(CharacterSizeControlType.TINY)]))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.TINY)
    ]);
  });

  test('Keep Consistenty Double Height Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT)]))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT)
    ]);
  });

  test('Keep Consistenty Double Width Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_WIDTH)]))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_WIDTH)
    ]);
  });

  test('Keep Consistenty Double Height And Width Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH)]))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH)
    ]);
  });

  test('Keep Consistenty Special1 Size (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_1)]))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_1)
    ]);
  });

  test('Keep Consistenty Special 2 (SZX)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_2)]))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_2)
    ]);
  });

  test('Keep Consistenty Flashing Normal (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([FlashingControl.from(FlashingControlType.NORMAL)]))).toStrictEqual([
      FlashingControl.from(FlashingControlType.NORMAL)
    ]);
  });

  test('Keep Consistenty Flashing Inverted (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([FlashingControl.from(FlashingControlType.INVERTED)]))).toStrictEqual([
      FlashingControl.from(FlashingControlType.INVERTED)
    ]);
  });

  test('Keep Consistenty Flashing Stop (FLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([FlashingControl.from(FlashingControlType.STOP)]))).toStrictEqual([
      FlashingControl.from(FlashingControlType.STOP)
    ]);
  });

  test('Keep Consistenty SingleConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SingleConcealmentMode.from(SingleConcealmentModeType.START)]))).toStrictEqual([
      SingleConcealmentMode.from(SingleConcealmentModeType.START)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Start (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.START)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.START)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode First (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FIRST)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FIRST)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Second (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SECOND)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SECOND)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Third (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.THIRD)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.THIRD)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Fourth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FOURTH)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FOURTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Fifth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FIFTH)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FIFTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Sixth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SIXTH)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SIXTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Seventh (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SEVENTH)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SEVENTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Eighth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.EIGHTH)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.EIGHTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Ninth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.NINTH)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.NINTH)
    ]);
  });

  test('Keep Consistenty ReplacingConcealmentMode Tenth (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ReplacingConcealmentMode.from(ReplacingConcealmentModeType.TENTH)]))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.TENTH)
    ]);
  });

  test('Keep Consistenty ConcealmentMode Stop (CDC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ConcealmentMode.from(ConcealmentModeType.STOP)]))).toStrictEqual([
      ConcealmentMode.from(ConcealmentModeType.STOP)
    ]);
  });

  test('Keep Consistenty PatternPolarityControl Normal (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([PatternPolarityControl.from(PatternPolarityControlType.NORMAL)]))).toStrictEqual([
      PatternPolarityControl.from(PatternPolarityControlType.NORMAL)
    ]);
  });

  test('Keep Consistenty PatternPolarityControl Inverted1 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([PatternPolarityControl.from(PatternPolarityControlType.INVERTED_1)]))).toStrictEqual([
      PatternPolarityControl.from(PatternPolarityControlType.INVERTED_1)
    ]);
  });

  test('Keep Consistenty PatternPolarityControl Inverted2 (POL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([PatternPolarityControl.from(PatternPolarityControlType.INVERTED_2)]))).toStrictEqual([
      PatternPolarityControl.from(PatternPolarityControlType.INVERTED_2)
    ]);
  });

  test('Keep Consistenty WritingModeModification Both (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([WritingModeModification.from(WritingModeModificationType.BOTH)]))).toStrictEqual([
      WritingModeModification.from(WritingModeModificationType.BOTH)
    ]);
  });

  test('Keep Consistenty WritingModeModification Foreground (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([WritingModeModification.from(WritingModeModificationType.FOREGROUND)]))).toStrictEqual([
      WritingModeModification.from(WritingModeModificationType.FOREGROUND)
    ]);
  });

  test('Keep Consistenty WritingModeModification Background (WMM)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([WritingModeModification.from(WritingModeModificationType.BACKGROUND)]))).toStrictEqual([
      WritingModeModification.from(WritingModeModificationType.BACKGROUND)
    ]);
  });

  test('Keep Consistenty HilightingCharacterBlock (HLC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([HilightingCharacterBlock.from(0x0F)]))).toStrictEqual([
      HilightingCharacterBlock.from(0x0F)
    ]);
  });

  test('Keep Consistenty RepeatCharacter (RPC)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([RepeatCharacter.from(0x0F)]))).toStrictEqual([
      RepeatCharacter.from(0x0F)
    ]);
  });

  test('Keep Consistenty StartLining (STL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([StartLining.from()]))).toStrictEqual([
      StartLining.from()
    ]);
  });

  test('Keep Consistenty StopLining (SPL)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([StopLining.from()]))).toStrictEqual([
      StopLining.from()
    ]);
  });

  test('Keep Consistenty TimeControl Wait (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([TimeControlWait.from(4.3)]))).toStrictEqual([
      TimeControlWait.from(4.3)
    ]);
  });

  test('Keep Consistenty TimeControl Mode Free (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([TimeControlMode.from(TimeControlModeType.FREE)]))).toStrictEqual([
      TimeControlMode.from(TimeControlModeType.FREE)
    ]);
  });

  test('Keep Consistenty TimeControl Mode Real (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([TimeControlMode.from(TimeControlModeType.REAL)]))).toStrictEqual([
      TimeControlMode.from(TimeControlModeType.REAL)
    ]);
  });

  test('Keep Consistenty TimeControl Mode Offset (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([TimeControlMode.from(TimeControlModeType.OFFSET)]))).toStrictEqual([
      TimeControlMode.from(TimeControlModeType.OFFSET)
    ]);
  });

  test('Keep Consistenty TimeControl Mode Unique (TIME)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([TimeControlMode.from(TimeControlModeType.UNIQUE)]))).toStrictEqual([
      TimeControlMode.from(TimeControlModeType.UNIQUE)
    ]);
  });

  test('Keep Consistenty SetWritingFormat (SWF) 5 (1920x1080)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SetWritingFormat.from(5)]))).toStrictEqual([
      SetWritingFormat.from(5)
    ]);
  });

  test('Keep Consistenty SetWritingFormat (SWF) 7 (960x540)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SetWritingFormat.from(7)]))).toStrictEqual([
      SetWritingFormat.from(7)
    ]);
  });

  test('Keep Consistenty SetWritingFormat (SWF) 9 (720x480)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SetWritingFormat.from(9)]))).toStrictEqual([
      SetWritingFormat.from(9)
    ]);
  });

  test('Keep Consistenty SetWritingFormat (SWF) 11 (1280x720)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SetWritingFormat.from(11)]))).toStrictEqual([
      SetWritingFormat.from(11)
    ]);
  });

  test('Keep Consistenty SetDisplayFormat (SDF)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SetDisplayFormat.from(720, 480)]))).toStrictEqual([
      SetDisplayFormat.from(720, 480)
    ]);
  });

  test('Keep Consistenty SetDisplayPosition (SDP)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SetDisplayFormat.from(120, 40)]))).toStrictEqual([
      SetDisplayFormat.from(120, 40)
    ]);
  });

  test('Keep Consistenty SetDisplayPosition (SSM)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([CharacterCompositionDotDesignation.from(12, 24)]))).toStrictEqual([
      CharacterCompositionDotDesignation.from(12, 24)
    ]);
  });

  test('Keep Consistenty SetHorizontalSpacing (SHS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SetHorizontalSpacing.from(2)]))).toStrictEqual([
      SetHorizontalSpacing.from(2)
    ]);
  });

  test('Keep Consistenty SetVerticalSpacing (SVS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([SetVerticalSpacing.from(12)]))).toStrictEqual([
      SetVerticalSpacing.from(12)
    ]);
  });

  test('Keep Consistenty ActiveCoordinatePositionSet (ACPS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([ActiveCoordinatePositionSet.from(120, 240)]))).toStrictEqual([
      ActiveCoordinatePositionSet.from(120, 240)
    ]);
  });

  test('Keep Consistenty OrnamentControl None (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([OrnamentControlNone.from()]))).toStrictEqual([
      OrnamentControlNone.from()
    ]);
  });

  test('Keep Consistenty OrnamentControl Hemming (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([OrnamentControlHemming.from(1)]))).toStrictEqual([
      OrnamentControlHemming.from(1)
    ]);
  });

  test('Keep Consistenty OrnamentControl Shade (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([OrnamentControlShade.from(2)]))).toStrictEqual([
      OrnamentControlShade.from(2)
    ]);
  });

  test('Keep Consistenty OrnamentControl Hollow (ORN)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([OrnamentControlHollow.from()]))).toStrictEqual([
      OrnamentControlHollow.from()
    ]);
  });

  test('Keep Consistenty BuiltinSoundReplay (PRA)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([BuiltinSoundReplay.from(1)]))).toStrictEqual([
      BuiltinSoundReplay.from(1)
    ]);
  });

  test('Keep Consistenty RasterColourCommand (RCS)', () => {
    const encoder = new ARIBB24UTF8Encoder();
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeDataUnits(encoder.encode([RasterColourCommand.from(2)]))).toStrictEqual([
      RasterColourCommand.from(2)
    ]);
  });
});

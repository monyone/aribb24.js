import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/tokenizer/b24/ucs/tokenizer';
import { ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, BlackForeground, BlueForeground, Cancel, Character, CharacterSizeControl, CharacterSizeControlType, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, ConcealmentMode, ConcealmentModeType, CyanForeground, Delete, FlashingControl, FlashingControlType, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, PatternPolarityControlType, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, ReplacingConcealmentModeType, SingleConcealmentMode, SingleConcealmentModeType, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlModeType, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, WritingModeModificationType, YellowForeground } from '@/tokenizer/token';
import { CONTROL_CODES } from '@/tokenizer/b24/tokenizer';
import { NotImplementedError, NotUsedDueToStandardError, UnreachableError } from '@/util/error';

const generateBinary = (... operation: (number | string)[]): ArrayBuffer => {
  const encoder = new TextEncoder();
  const inject = operation.map((elem) => {
    if (typeof(elem) === 'number') {
      return Uint8Array.from([elem]);
    } else{
      return new Uint8Array(encoder.encode(elem));
    }
  });

  const length = inject.reduce((sum, array) => sum + array.byteLength, 0);
  const uint8 = new Uint8Array(length);
  for (let i = 0, offset = 0; i < inject.length; offset += inject[i].byteLength, i++) {
    uint8.set(inject[i], offset);
  }
  return uint8.buffer;
}

const generateCharacterTokens = (str: string) => {
  const segmenter = new Intl.Segmenter();
  return Array.from(segmenter.segment(str), ({ segment }) => segment).map((seg) => Character.from(seg));
}

describe("ARIB STD-B24 UCS", () => {
  test('Tokenize UTF-8 ASCII', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('This is Test'))).toStrictEqual([
      ... generateCharacterTokens('This'),
      Space.from(),
      ... generateCharacterTokens('is'),
      Space.from(),
      ... generateCharacterTokens('Test'),
    ]);
  });

  test('Tokenize UTF-8 ASCII with CR,LF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('new\rline\nwith'))).toStrictEqual([
      ... generateCharacterTokens('new'),
      ActivePositionReturn.from(),
      ... generateCharacterTokens('line'),
      ActivePositionDown.from(),
      ... generateCharacterTokens('with'),
    ]);
  });
});

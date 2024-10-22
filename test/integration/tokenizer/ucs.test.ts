import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/v2/tokenizer/b24/ucs/tokenizer';
import { ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, BlackForeground, BlueForeground, Cancel, Character, CharacterSizeControl, CharacterSizeControlType, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, ConcealmentMode, ConcealmentModeType, CyanForeground, Delete, FlashingControl, FlashingControlType, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, PatternPolarityControlType, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, ReplacingConcealmentModeType, SingleConcealmentMode, SingleConcealmentModeType, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlModeType, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, WritingModeModificationType, YellowForeground } from '@/v2/tokenizer/token';
import { CONTROL_CODES } from '@/v2/tokenizer/b24/tokenizer';
import { NotImplementedError, NotUsedDueToStandardError, UnreachableError } from '@/v2/util/error';

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

describe("ARIB STD-B24 UCS", () => {
  test('Tokenize UTF-8 ASCII', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('This is Test'))).toStrictEqual([
      Character.from('T', false),
      Character.from('h', false),
      Character.from('i', false),
      Character.from('s', false),
      Space.from(),
      Character.from('i', false),
      Character.from('s', false),
      Space.from(),
      Character.from('T', false),
      Character.from('e', false),
      Character.from('s', false),
      Character.from('t', false)
    ]);
  });

  test('Tokenize UTF-8 ASCII with CR,LF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('new\rline\nwith'))).toStrictEqual([
      Character.from('n', false),
      Character.from('e', false),
      Character.from('w', false),
      ActivePositionReturn.from(),
      Character.from('l', false),
      Character.from('i', false),
      Character.from('n', false),
      Character.from('e', false),
      ActivePositionDown.from(),
      Character.from('w', false),
      Character.from('i', false),
      Character.from('t', false),
      Character.from('h', false)
    ]);
  });

  test('Tokenize UTF-8 2byte string', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('こんにちは 世界'))).toStrictEqual([
      Character.from('こ', false),
      Character.from('ん', false),
      Character.from('に', false),
      Character.from('ち', false),
      Character.from('は', false),
      Space.from(),
      Character.from('世', false),
      Character.from('界', false),
    ]);
  });
});

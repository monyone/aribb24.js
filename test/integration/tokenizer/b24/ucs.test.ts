import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/v2/tokenizer/b24/ucs/tokenizer';
import { ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, Cancel, Character, ClearScreen, Delete, Null, ParameterizedActivePositionForward, RecordSeparator, Space, UnitSeparator } from '@/v2/tokenizer/token';
import { CONTROL_CODES } from '@/v2/tokenizer/b24/tokenizer';
import { UnreachableError } from '@/v2/util/error';

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
  test('Decode UTF-8 ASCII as is', () => {
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

  test('Decode UTF-8 2byte string as is', () => {
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

  test('Decode UTF-8 combining character as is', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('👨‍👩'))).toStrictEqual([
      Character.from('👨‍👩', false),
    ]);
  });

  test('SS2 throw UnreachableError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.SS2))).toThrowError(UnreachableError);
  });

  test('SS3 throw UnreachableError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.SS3))).toThrowError(UnreachableError);
  });

  test('LS0 throw UnreachableError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.LS0))).toThrowError(UnreachableError);
  });

  test('LS1 throw UnreachableError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.LS1))).toThrowError(UnreachableError);
  });

  test('ESC throw UnreachableError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.ESC))).toThrowError(UnreachableError);
  });

  test('Tokenize NULL', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.NUL))).toStrictEqual([
      Null.from()
    ]);
  });

  test('Tokenize BEL', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.BEL))).toStrictEqual([
      Bell.from()
    ]);
  });

  test('Tokenize APB', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APB))).toStrictEqual([
      ActivePositionBackward.from()
    ]);
  });

  test('Tokenize APF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APF))).toStrictEqual([
      ActivePositionForward.from()
    ]);
  });

  test('Tokenize APD', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APD))).toStrictEqual([
      ActivePositionDown.from()
    ]);
  });

  test('Tokenize APU', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APU))).toStrictEqual([
      ActivePositionUp.from()
    ]);
  });

  test('Tokenize CS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.CS))).toStrictEqual([
      ClearScreen.from()
    ]);
  });

  test('Tokenize APR', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APR))).toStrictEqual([
      ActivePositionReturn.from()
    ]);
  });

  test('Tokenize PAPF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.PAPF, 5))).toStrictEqual([
      ParameterizedActivePositionForward.from(5)
    ]);
  });

  test('Tokenize CAN', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.CAN))).toStrictEqual([
      Cancel.from()
    ]);
  });

  test('Tokenize APS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APS, 1, 3))).toStrictEqual([
      ActivePositionSet.from(3, 1)
    ]);
  });

  test('Tokenize RS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.RS))).toStrictEqual([
      RecordSeparator.from()
    ]);
  });

  test('Tokenize US', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.US))).toStrictEqual([
      UnitSeparator.from()
    ]);
  });

  test('Tokenize SP', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.SP))).toStrictEqual([
      Space.from()
    ]);
  });

  test('Tokenize DEL', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.DEL))).toStrictEqual([
      Delete.from()
    ]);
  });
});

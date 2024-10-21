import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/v2/tokenizer/b24/ucs/tokenizer';
import { Character, Space } from '@/v2/tokenizer/token';
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
});

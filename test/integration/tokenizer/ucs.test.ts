import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/lib/tokenizer/b24/ucs/tokenizer';
import { ARIBB24ActivePositionDownToken, ARIBB24ActivePositionReturnToken, ARIBB24CharacterToken, ARIBB24SpaceToken } from '@/lib/tokenizer/token';
import { CONTROL_CODES } from '@/lib/tokenizer/b24/tokenizer';
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
  return Array.from(segmenter.segment(str), ({ segment }) => segment).map((seg) => ARIBB24CharacterToken.from(seg));
}

describe("ARIB STD-B24 UCS", () => {
  test('Tokenize UTF-8 ASCII', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('This is Test'))).toStrictEqual([
      ... generateCharacterTokens('This'),
      ARIBB24SpaceToken.from(),
      ... generateCharacterTokens('is'),
      ARIBB24SpaceToken.from(),
      ... generateCharacterTokens('Test'),
    ]);
  });

  test('Tokenize UTF-8 ASCII with CR,LF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('new\rline\nwith'))).toStrictEqual([
      ... generateCharacterTokens('new'),
      ARIBB24ActivePositionReturnToken.from(),
      ... generateCharacterTokens('line'),
      ARIBB24ActivePositionDownToken.from(),
      ... generateCharacterTokens('with'),
    ]);
  });
});

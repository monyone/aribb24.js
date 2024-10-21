import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/v2/tokenizer/b24/ucs/tokenizer';
import { Character, Space } from '@/v2/tokenizer/token';

describe("ARIB STD-B24 UCS", () => {
  test('Decode UTF-8 ASCII', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();
    const encoder = new TextEncoder();

    const tokens = tokenizer.tokenizeStatement(encoder.encode("This is Test").buffer);

    expect(tokens).toStrictEqual([
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

  test('Decode UTF-8 2byte String', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();
    const encoder = new TextEncoder();

    const tokens = tokenizer.tokenizeStatement(encoder.encode("こんにちは 世界").buffer);

    expect(tokens).toStrictEqual([
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

  test('Decode UTF-8 Combining Character', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();
    const encoder = new TextEncoder();

    const tokens = tokenizer.tokenizeStatement(encoder.encode("👨‍👩").buffer);

    expect(tokens).toStrictEqual([
      Character.from('👨‍👩', false),
    ]);
  })
});

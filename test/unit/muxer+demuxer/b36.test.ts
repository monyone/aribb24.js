import { describe, test, expect } from 'vitest';
import mux from '@/lib/muxer/b36'
import muxDatagroup from '@/lib/muxer/b24/datagroup';
import ARIBB24JapaneseJIS8Encoder from '@/lib/encoder/b24/jis8/ARIB'
import demux, { ARIBB36Data } from '@/lib/demuxer/b36'
import { ClearScreen } from '@/lib/tokenizer/token';
import { CaptionData } from '@/lib/demuxer/b24/datagroup';

describe("ARIB STD-B36 Muxer Demuxer Consistenty", () => {
  test('Empty STD-B36', () => {
    const data = {
      label: 'DCAPTION',
      pages: []
    } satisfies ARIBB36Data;

    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Reserved Page only STD-B36', () => {
    const encoder = new ARIBB24JapaneseJIS8Encoder();
    const encoded = encoder.encode([ClearScreen.from()]);
    const management = {
      tag: 'CaptionManagement',
      group: 0,
      languages: [{
        lang: 0,
        iso_639_language_code: 'jpn',
        format: 7,
        rollup: false,
        TCS: 0b00,
      }],
      units: [],
    } satisfies CaptionData;

    const data = {
      label: 'DCAPTION',
      pages: [{
        tag: 'ReservedPage',
        pageNumber: '000000',
        management,
      }]
    } satisfies ARIBB36Data;

    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Reserved and Actual Page in STD-B36', () => {
    const management = {
      tag: 'CaptionManagement',
      group: 0,
      languages: [{
        lang: 0,
        iso_639_language_code: 'jpn',
        format: 7,
        rollup: false,
        TCS: 0b00,
      }],
      units: [],
    } satisfies CaptionData;
    const encoder = new ARIBB24JapaneseJIS8Encoder();
    const encoded = encoder.encode([ClearScreen.from()]);
    const statement = {
      tag: 'CaptionStatement',
      group: 0,
      lang: 0,
      units: encoded,
    } satisfies CaptionData;

    const data = {
      label: 'DCAPTION',
      pages: [{
        tag: 'ReservedPage',
        pageNumber: '000000',
        management,
      }, {
        tag: 'ActualPage',
        pageNumber: '000001',
        management,
        statement
      }]
    } satisfies ARIBB36Data;

    expect(demux(mux(data))).toStrictEqual(data);
  });
});

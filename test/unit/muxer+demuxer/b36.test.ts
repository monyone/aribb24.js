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
        pageMaterialType: 0,
        displayTimingType: '  ',
        timingUnitType: 'F',
        displayTiming: 0,
        clearTiming: 0,
        timeControlMode: 'FR',
        clearScreen: false,
        displayFormat: 'HDH',
        displayAspectRatio: ' ',
        displayWindowArea: null,
        scrollType: 'F',
        scrollDirectionType: 'H',
        sound: false,
        pageDataBytes: 0,
        deleted: false,
        memo: 'ここは予約データです',
        completed: false,
        usersAreaUsed: false,
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
        pageMaterialType: 1,
        displayTimingType: '  ',
        timingUnitType: 'F',
        displayTiming: 0,
        clearTiming: 0,
        timeControlMode: 'FR',
        displayFormat: 'HDH',
        clearScreen: false,
        displayWindowArea: null,
        displayAspectRatio: ' ',
        scrollType: 'F',
        scrollDirectionType: 'H',
        sound: false,
        pageDataBytes: 0,
        deleted: false,
        memo: '予約データです',
        completed: false,
        usersAreaUsed: false,
        management,
      }, {
        tag: 'ActualPage',
        pageNumber: '000001',
        pageMaterialType: 0,
        displayTimingType: 'RT',
        timingUnitType: 'F',
        displayTiming: 1001,
        clearTiming: 2002,
        timeControlMode: 'RT',
        clearScreen: false,
        displayFormat: 'HDH',
        displayWindowArea: [[920, 720], [0, 0]],
        displayAspectRatio: ' ',
        scrollType: 'F',
        scrollDirectionType: 'H',
        sound: false,
        pageDataBytes: 12,
        deleted: true,
        memo: '',
        completed: true,
        usersAreaUsed: true,
        writingFormatConversionMode: 0,
        drcsConversionMode: 1,
        management,
        statement
      }, {
        tag: 'ActualPage',
        pageNumber: '000001',
        pageMaterialType: 0,
        displayTimingType: 'RT',
        timingUnitType: 'F',
        displayTiming: 2002,
        clearTiming: Number.POSITIVE_INFINITY,
        timeControlMode: 'RT',
        clearScreen: true,
        displayFormat: 'HDH',
        displayAspectRatio: ' ',
        displayWindowArea: [[920, 720], [0, 0]],
        scrollType: 'F',
        scrollDirectionType: 'H',
        sound: true,
        pageDataBytes: 1111,
        deleted: false,
        memo: 'テスト',
        completed: true,
        usersAreaUsed: false,
        management,
        statement
      }]
    } satisfies ARIBB36Data;

    expect(demux(mux(data))).toStrictEqual(data);
  });
});

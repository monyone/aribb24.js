import mux from '@/lib/muxer/b24/datagroup';
import demux, { CaptionData } from '@/lib/demuxer/b24/datagroup';

import { describe, test, expect } from 'vitest';

describe("ARIB STD-B24 Muxer Demuxer Consistenty for DataUnit", () => {
  test('Mux Statement With Empty Content with A Group', () => {
    const data: CaptionData = {
      tag: 'CaptionStatement',
      group: 0,
      lang: 0,
      units: [],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Statement With Empty Content with B Group', () => {
    const data: CaptionData = {
      tag: 'CaptionStatement',
      group: 1,
      lang: 0,
      units: [],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Statement With Empty Content with secondary language', () => {
    const data: CaptionData = {
      tag: 'CaptionStatement',
      group: 0,
      lang: 1,
      units: [],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Statement With Statement Content', () => {
    const data: CaptionData = {
      tag: 'CaptionStatement',
      group: 0,
      lang: 1,
      units: [{
        tag: 'Statement',
        data: new ArrayBuffer(0)
      }],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Statement With DRCS Content', () => {
    const data: CaptionData = {
      tag: 'CaptionStatement',
      group: 0,
      lang: 1,
      units: [{
        tag: 'DRCS',
        bytes: 1,
        data: new ArrayBuffer(1)
      }],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Statement With DRCS Content', () => {
    const data: CaptionData = {
      tag: 'CaptionStatement',
      group: 0,
      lang: 1,
      units: [{
        tag: 'DRCS',
        bytes: 2,
        data: new ArrayBuffer(2)
      }],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Statement With Bitmap Content', () => {
    const data: CaptionData = {
      tag: 'CaptionStatement',
      group: 0,
      lang: 1,
      units: [{
        tag: 'Bitmap',
        data: new ArrayBuffer(3)
      }],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Statement With Multiple Content', () => {
    const data: CaptionData = {
      tag: 'CaptionStatement',
      group: 0,
      lang: 1,
      units: [{
        tag: 'DRCS',
        bytes: 1,
        data: new ArrayBuffer(4),
      }, {
        tag: 'Statement',
        data: new ArrayBuffer(5)
      }, {
        tag: 'Bitmap',
        data: new ArrayBuffer(6)
      }],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Management With Empty Content with A Group', () => {
    const data: CaptionData = {
      tag: 'CaptionManagement',
      group: 0,
      languages: [],
      units: [],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Management With Empty Content with B Group', () => {
    const data: CaptionData = {
      tag: 'CaptionManagement',
      group: 1,
      languages: [],
      units: [],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Management With Empty Content with Single Language', () => {
    const data: CaptionData = {
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
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Management With Empty Content with Multiple Language', () => {
    const data: CaptionData = {
      tag: 'CaptionManagement',
      group: 0,
      languages: [{
        lang: 0,
        iso_639_language_code: 'jpn',
        format: 7,
        rollup: false,
        TCS: 0b00,
      }, {
        lang: 1,
        iso_639_language_code: 'eng',
        format: 5,
        rollup: true,
        TCS: 0b01,
      }],
      units: [],
    };
    expect(demux(mux(data))).toStrictEqual(data);
  });
});

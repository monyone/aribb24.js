import mux from '@/lib/muxer/b24/independent';
import demux, { PES } from '@/lib/demuxer/b24/independent';

import { describe, test, expect } from 'vitest';

describe("ARIB STD-B24 Muxer Demuxer Consistenty for IndepedentPES", () => {
  test('Mux Caption', () => {
    const data = {
      tag: 'Caption',
      data: new ArrayBuffer(1),
    } as const satisfies PES;
    expect(demux(mux(data))).toStrictEqual(data);
  });

  test('Mux Superimpose', () => {
    const data = {
      tag: 'Superimpose',
      data: new ArrayBuffer(1),
    } as const satisfies PES;
    expect(demux(mux(data))).toStrictEqual(data);
  });
});

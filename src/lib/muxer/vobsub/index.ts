// TODO: need implements

import concat from "../../../util/concat";

export const makePES = (data: ArrayBuffer, pts: number): ArrayBuffer => {
  const length = 3 + 5 + data.byteLength;
  const array = Uint8Array.from([
    0x00, 0x00, 0x01,
    0xbd, (length & 0xFF00) >> 8, (length & 0x00FF) >> 0
  ]);
  const stuff = Uint8Array.from([
    0x80, 0x80, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  return concat(array.buffer, stuff.buffer, data);
}

export const makePS = (data: ArrayBuffer, stc: number): ArrayBuffer => {
  const array = Uint8Array.from([ 0x00, 0x00, 0x01, 0xba ]);
  const stuff = Uint8Array.from({ length: 10 });
  stuff[0] |= 0x40; // MPEG2
  return concat(array.buffer, stuff.buffer, data);
}

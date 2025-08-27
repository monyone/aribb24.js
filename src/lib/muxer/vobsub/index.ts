// TODO: need implements

import concat from "../../../util/concat";
import BitBuilder from "../../../util/bitbuilder";


export const makePES = (data: ArrayBuffer, pts: number): ArrayBuffer => {
  const length = 3 + 5 + data.byteLength;
  const array = Uint8Array.from([
    0x00, 0x00, 0x01,
    0xbd, (length & 0xFF00) >> 8, (length & 0x00FF) >> 0
  ]);
  const builder = new BitBuilder();
  builder.writeBits(0x80, 8); // marker
  builder.writeBits(0x80, 8); // PTS present
  builder.writeBits(5, 8); // length
  builder.writeBits(0b0010, 4); // PTS present
  builder.writeBits(Math.floor(pts / (2 ** 30)) % (2 ** 3), 3);
  builder.writeBits(0b1, 1); // Marker Bit
  builder.writeBits(Math.floor(pts / (2 ** 15)) % (2 ** 15), 15);
  builder.writeBits(0b1, 1); // Marker Bit
  builder.writeBits(Math.floor(pts / (2 **  0)) % (2 ** 15), 15);
  builder.writeBits(0b1, 1); // Marker Bit

  return concat(array.buffer, builder.build(), data);
}

export const makePS = (data: ArrayBuffer, stc: number): ArrayBuffer => {
  const array = Uint8Array.from([ 0x00, 0x00, 0x01, 0xba ]);
  const builder = new BitBuilder();
  builder.writeBits(0b01, 2); // Marker Bit (MPEG2)
  builder.writeBits(Math.floor(stc / (2 ** 30)) % (2 ** 3), 3);
  builder.writeBits(0b1, 1); // Marker Bit
  builder.writeBits(Math.floor(stc / (2 ** 15)) % (2 ** 15), 15);
  builder.writeBits(0b1, 1); // Marker Bit
  builder.writeBits(Math.floor(stc / (2 **  0)) % (2 ** 15), 15);
  builder.writeBits(0b1, 1); // Marker Bit
  builder.writeBits(0b000000000, 9); // SCR extension
  builder.writeBits(0b1, 1); // Marker Bit
  builder.writeBits(0, 22); // Bit Rate
  builder.writeBits(0b11, 2); // Marker Bit
  builder.writeBits(0b11111, 5); // Reserved
  builder.writeBits(0b000, 3); // Stuffing length
  return concat(array.buffer, builder.build(), data);
}

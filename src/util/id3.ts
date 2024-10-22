import { binaryISO85591ToString, binaryUTF8ToString } from "./binary";

export const readID3Size = (binary: Uint8Array, begin: number, end: number): number => {
  let result = 0;
  for (let i = begin; i < end; i++) {
    result <<= 7;
    result |= (binary[i] & 0x7F);
  }
  return result;
}

export type ID3FramePRIV = {
  id: 'PRIV';
  owner: string,
  data: ArrayBuffer
};
export const ID3FramePRIV = {
  from(arraybuffer: ArrayBuffer): ID3FramePRIV {
    const uint8 = new Uint8Array(arraybuffer);

    let frame = 0;
    while (uint8[frame] !== 0 && frame < uint8.byteLength) { frame++; }

    const owner = binaryISO85591ToString(uint8, 0, frame);
    const data = arraybuffer.slice(frame + 1);
    return {
      id: 'PRIV',
      owner,
      data
    };
  }
}
export type ID3FrameTXXX = {
  id: 'TXXX';
  description: string;
  text: string;
};
export const ID3FrameTXXX = {
  from(arraybuffer: ArrayBuffer): ID3FrameTXXX | null {
    const uint8 = new Uint8Array(arraybuffer);

    let frame = 0;
    const encoding = uint8[frame + 0];
    const description_begin = frame + 1;

    if (encoding === 0x03) { // UTF-8
      while (uint8[frame] !== 0 && frame < uint8.byteLength) { frame++; }
      const description_end = frame;
      frame += 1;

      const data_begin = frame;
      while (uint8[frame] !== 0 && frame < uint8.byteLength) { frame++; }
      const data_end = frame;

      const description = binaryUTF8ToString(uint8, description_begin, description_end);
      const text = binaryUTF8ToString(uint8, data_begin, data_end);

      return {
        id: 'TXXX',
        description,
        text,
      };
    } else if(encoding === 0x00) { // Laten-1
      while (uint8[frame] !== 0 && frame < uint8.byteLength) { frame++; }
      const description_end = frame;
      frame += 1;

      const data_begin = frame;
      while (uint8[frame] !== 0 && frame < uint8.byteLength) { frame++; }
      const data_end = frame;

      const description = binaryISO85591ToString(uint8, description_begin, description_end);
      const text = binaryISO85591ToString(uint8, data_begin, data_end);

      return {
        id: 'TXXX',
        description,
        text,
      };
    } else {
      return null;
    }
  }
}

export type ID3Frame = ID3FramePRIV | ID3FrameTXXX;

export const parseID3v2 = (arraybuffer: ArrayBuffer): ID3Frame[] => {
  const uint8 = new Uint8Array(arraybuffer);
  let result: ID3Frame[] = [];

  for (let begin = 0; begin < uint8.length;) {
    const id3_start = begin;

    if (begin + 3 > uint8.length) { break; }
    if (!(uint8[begin + 0] === 0x49 && uint8[begin + 1] === 0x44 && uint8[begin + 2] === 0x33)) {
      if (begin === 0) {
        begin += 5; // ffmpeg 6.1 未満には ID3 を 5 bytes 消すので、それの対策を入れると、修正済みだと 5 bytes パディングされうる
        continue;
      } else {
        break;
      }
    }
    begin += 3 + 2 /* version */ + 1 /* flag */;

    if (begin + 4 > uint8.length) { break; }
    const id3_size = readID3Size(uint8, begin + 0, begin + 4);
    begin += 4;

    const id3_end = id3_start + 3 + 2 + 1 + 4 + id3_size;
    if (id3_end > uint8.length) { break; }

    for (let frame = begin; frame < id3_end;) {
      const frame_begin = frame;

      if (frame + 4 > uint8.length) { break; }
      const frame_name = binaryISO85591ToString(uint8, frame + 0, frame + 4);
      frame += 4;

      if (frame + 4 > uint8.length) { break; }
      const frame_size = readID3Size(uint8, frame + 0, frame + 4);
      frame += 4 + 2 /* flag */;

      const frame_end = frame_begin + 4 + 4 + 2 + frame_size;
      if (frame_end > uint8.length) { break; }

      switch (frame_name) {
        case 'PRIV': result.push(ID3FramePRIV.from(arraybuffer.slice(frame, frame_end))); break;
        case 'TXXX': {
          const txxx = ID3FrameTXXX.from(arraybuffer.slice(frame, frame_end));
          if (txxx != null) { result.push(txxx); }
          break;
        }
      }

      frame = frame_end;
    }

    begin = id3_start + 3 + 2 + 1 + 4 + id3_size;
    if (begin + 3 > uint8.length) { continue; }
    // id3 footer
    if (!(uint8[begin + 0] === 0x33 && uint8[begin + 1] === 0x44 && uint8[begin + 2] === 0x49)) { continue; }
    begin += 3 + 2 /* version */ + 1 /* flags */ + 4 /* size */;
  }

  return result;
}


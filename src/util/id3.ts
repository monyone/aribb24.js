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
  data: Uint8Array
};
export const ID3FramePRIV = {
  from(data: Uint8Array): ID3FramePRIV {
    let frame = 0;
    while (data[frame] !== 0 && frame < data.byteLength) { frame++; }

    return {
      id: 'PRIV',
      owner: binaryISO85591ToString(data, 0, frame),
      data: data.subarray(frame + 1),
    };
  }
}
export type ID3FrameTXXX = {
  id: 'TXXX';
  description: string;
  text: string;
};
export const ID3FrameTXXX = {
  from(data: Uint8Array): ID3FrameTXXX | null {
    let frame = 0;
    const encoding = data[frame + 0];
    const description_begin = frame + 1;

    if (encoding === 0x03) { // UTF-8
      while (data[frame] !== 0 && frame < data.byteLength) { frame++; }
      const description_end = frame;
      frame += 1;

      const data_begin = frame;
      while (data[frame] !== 0 && frame < data.byteLength) { frame++; }
      const data_end = frame;

      return {
        id: 'TXXX',
        description: binaryUTF8ToString(data, description_begin, description_end),
        text: binaryUTF8ToString(data, data_begin, data_end),
      };
    } else if(encoding === 0x00) { // Laten-1
      while (data[frame] !== 0 && frame < data.byteLength) { frame++; }
      const description_end = frame;
      frame += 1;

      const data_begin = frame;
      while (data[frame] !== 0 && frame < data.byteLength) { frame++; }
      const data_end = frame;

      return {
        id: 'TXXX',
        description: binaryISO85591ToString(data, description_begin, description_end),
        text: binaryISO85591ToString(data, data_begin, data_end),
      };
    } else {
      return null;
    }
  }
}

export type ID3Frame = ID3FramePRIV | ID3FrameTXXX;

export const parseID3v2 = (data: Uint8Array): ID3Frame[] => {
  let result: ID3Frame[] = [];

  for (let begin = 0; begin < data.length;) {
    const id3_start = begin;

    if (begin + 3 > data.length) { break; }
    if (!(data[begin + 0] === 0x49 && data[begin + 1] === 0x44 && data[begin + 2] === 0x33)) {
      if (begin === 0) {
        begin += 5; // ffmpeg 6.1 未満には ID3 を 5 bytes 消すので、それの対策を入れると、修正済みだと 5 bytes パディングされうる
        continue;
      } else {
        break;
      }
    }
    begin += 3 + 2 /* version */ + 1 /* flag */;

    if (begin + 4 > data.length) { break; }
    const id3_size = readID3Size(data, begin + 0, begin + 4);
    begin += 4;

    const id3_end = id3_start + 3 + 2 + 1 + 4 + id3_size;
    if (id3_end > data.length) { break; }

    for (let frame = begin; frame < id3_end;) {
      const frame_begin = frame;

      if (frame + 4 > data.length) { break; }
      const frame_name = binaryISO85591ToString(data, frame + 0, frame + 4);
      frame += 4;

      if (frame + 4 > data.length) { break; }
      const frame_size = readID3Size(data, frame + 0, frame + 4);
      frame += 4 + 2 /* flag */;

      const frame_end = frame_begin + 4 + 4 + 2 + frame_size;
      if (frame_end > data.length) { break; }

      switch (frame_name) {
        case 'PRIV': result.push(ID3FramePRIV.from(data.subarray(frame, frame_end))); break;
        case 'TXXX': {
          const txxx = ID3FrameTXXX.from(data.subarray(frame, frame_end));
          if (txxx != null) { result.push(txxx); }
          break;
        }
      }

      frame = frame_end;
    }

    begin = id3_start + 3 + 2 + 1 + 4 + id3_size;
    if (begin + 3 > data.length) { continue; }
    // id3 footer
    if (!(data[begin + 0] === 0x33 && data[begin + 1] === 0x44 && data[begin + 2] === 0x49)) { continue; }
    begin += 3 + 2 /* version */ + 1 /* flags */ + 4 /* size */;
  }

  return result;
}


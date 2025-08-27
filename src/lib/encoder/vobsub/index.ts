import { ByteBuilder } from "../../../util/bytebuilder";
import concat from "../../../util/concat";

const uint16be = (value: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setUint16(0, value, false);
  return buffer;
};

export const ControlType = {
  FORCE: 0x00,
  START: 0x01,
  STOP: 0x02,
  PALLETE: 0x03,
  ALPHA: 0x04,
  COORD: 0x05,
  OFFSET: 0x06,
  END: 0xFF,
} as const;

export const VOBSUBControlForceDisplay = {
  into(): ArrayBuffer {
    return new ArrayBuffer();
  }
};

export const VOBSUBControlStartCaption = {
  into(): ArrayBuffer {
    return new ArrayBuffer();
  }
};

export const VOBSUBControlStopCaption = {
  into(): ArrayBuffer {
    return new ArrayBuffer();
  }
};

export const VOBSUBControlPallete = {
  into(palette: [number, number, number, number]): ArrayBuffer {
    const buffer = new ArrayBuffer(2);
    const array = new Uint8Array(buffer);
    array[0] = (palette[0] << 4) | (palette[1] << 0);
    array[1] = (palette[2] << 4) | (palette[3] << 0);
    return buffer;
  }
};

export const VOBSUBControlAlpha = {
  into(alpha: [number, number, number, number]): ArrayBuffer {
    const buffer = new ArrayBuffer(2);
    const array = new Uint8Array(buffer);
    array[0] = (alpha[0] << 4) | (alpha[1] << 0);
    array[1] = (alpha[2] << 4) | (alpha[3] << 0);
    return buffer;
  }
};

export const VOBSUBControlCoordDefinition = {
  into(coord: [number, number, number, number]): ArrayBuffer {
    const buffer = new ArrayBuffer(6);
    const array = new Uint8Array(buffer);
    array[0] = ((coord[0] & 0x000FF0) >> 4);
    array[1] = ((coord[0] & 0x00000F) << 4) | ((coord[1] & 0x000F00) >> 8);
    array[2] = ((coord[1] & 0x0000FF) >> 0);
    array[3] = ((coord[2] & 0x000FF0) >> 4);
    array[4] = ((coord[2] & 0x00000F) << 4) | ((coord[3] & 0x000F00) >> 8);
    array[5] = ((coord[3] & 0x0000FF) >> 0);
    return buffer;
  }
};

export const VOBSUBControlRLEOffset = {
  into(offset: [number, number]): ArrayBuffer {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint16(0, offset[0], false);
    view.setUint16(2, offset[1], false);
    return buffer;
  }
};

export const VOBSUBControlEND = {
  into(): ArrayBuffer {
    return new ArrayBuffer();
  }
};

export const encodeControl = (type: (typeof ControlType)[keyof typeof ControlType], data: ArrayBuffer): ArrayBuffer => {
  const builder = new ByteBuilder();
  builder.writeU8(type);
  builder.write(data);
  return builder.build();
};

class NibbleWriter {
  private nibbles: number[] = [];

  public write(... nibbles: number[]): void {
    this.nibbles.push(... nibbles);
  }

  public align(): void {
    if (this.nibbles.length % 2 === 0) { return; }
    this.nibbles.push(0);
  }

  public build(): ArrayBuffer {
    const length = Math.floor((this.nibbles.length + 1) / 2);
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = (
        ((i * 2 + 0 < this.nibbles.length) ? this.nibbles[i * 2 + 0] << 4 : 0)
          |
        ((i * 2 + 1 < this.nibbles.length) ? this.nibbles[i * 2 + 1] << 0 : 0)
      );
    }
    return array.buffer;
  }
}

export const indexToRLE = (image: number[][]): ArrayBuffer => {
  const rle = new NibbleWriter();
  const rle_run_max = 3 + 3 * 4 + 12 * 4 + 3 * 2 ** 6;

  for (let y = 0; y < image.length; y++) {
    let begin = 0, end = 1;
    while (begin < image[y].length) {
      const color = 3 - image[y][begin];
      while (end < image[y].length && (end + 1 - begin) < rle_run_max && image[y][begin] === image[y][end]) { end++; }
      const run = end - begin;
      if (end === image[y].length) {
        rle.write(0, 0, 0, color);
      } else if (run <= 3) {
        const value = run;
        rle.write((value << 2) | color);
      } else if (run <= 3 + 3 * 4) {
        const value = run - (3) - 1;
        const first = 1 + ((value >> 2) & 0x0F);
        const second = value & 0x3;
        rle.write(first, (second << 2) | color);
      } else if (run <= 3 + 3 * 4 + 12 * 4) {
        const value = run - (3 + 3 * 4) - 1;
        const first = 0;
        const second = 4 + ((value >> 2) & 0x0F);
        const third = value & 0x03;
        rle.write(first, second, (third << 2) | color);
      } else if (run <= 3 + 3 * 4 + 12 * 4 + 3 * 2 ** 6) {
        const value = run - (3 + 3 * 4 + 12 * 4) - 1;
        const first = 0;
        const second = 1 + ((value >> 6) & 0x03);
        const third = (value >> 2) & 0x0F;
        const fourth = value & 0x3;
        rle.write(first, second, third, (fourth << 2) | color);
      }

      begin = end;
    }
    rle.align();
  }

  return rle.build();
};

type RGBTuple = [r: number, g: number, b: number];
type RGBATuple = [r: number, g: number, b: number, a: number];
export const encodeImage = (width: number, height: number, image: Uint8ClampedArray, color: [RGBATuple, RGBATuple, RGBATuple, RGBATuple]): [ArrayBuffer, ArrayBuffer] => {
  const raw_top_field: number[][] = [];
  for (let y = 0; y < height; y += 2) {
    const y_index = Math.floor(y / 2);
    raw_top_field.push([]);
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = image[index + 0];
      const g = image[index + 1];
      const b = image[index + 2];
      const a = image[index + 3];

      let nearest_value = Number.POSITIVE_INFINITY;
      let nearest_index = -1;
      for (let i = 0; i < color.length; i++) {
        const [dr, dg, db, da] = color[i];
        const value = (dr - r) ** 2 + (dg - g) ** 2 + (db - b) ** 2 + (da - a) ** 2;
        if (value < nearest_value) {
          nearest_value = value;
          nearest_index = i;
        }
      }
      raw_top_field[y_index].push(nearest_index);
    }
  }

  const raw_bottom_field: number[][] = [];
  for (let y = 1; y < height; y += 2) {
    const y_index = Math.floor((y - 1) / 2);
    raw_bottom_field.push([]);
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = image[index + 0];
      const g = image[index + 1];
      const b = image[index + 2];
      const a = image[index + 3];

      let nearest_value = Number.POSITIVE_INFINITY;
      let nearest_index = -1;
      for (let i = 0; i < color.length; i++) {
        const [dr, dg, db, da] = color[i];
        const value = (dr - r) ** 2 + (dg - g) ** 2 + (db - b) ** 2 + (da - a) ** 2;
        if (value < nearest_value) {
          nearest_value = value;
          nearest_index = i;
        }
      }
      raw_bottom_field[y_index].push(nearest_index);
    }
  }

  return [
    indexToRLE(raw_top_field),
    indexToRLE(raw_bottom_field)
  ];
};

export const encode = (x: number, y: number, width: number, height: number, image: Uint8ClampedArray, duration: number | null, colors: [string, string, string, string], palette: string[]) => {
  const colors_rgba = colors.map((code) => {
    return [
      Number.parseInt(code.slice(1, 3), 16),
      Number.parseInt(code.slice(3, 5), 16),
      Number.parseInt(code.slice(5, 7), 16),
      Number.parseInt(code.slice(7, 9), 16),
    ];
  }) satisfies RGBATuple[];
  const palette_rgb = palette.map((code) => {
    return [
      Number.parseInt(code.slice(1, 3), 16),
      Number.parseInt(code.slice(3, 5), 16),
      Number.parseInt(code.slice(5, 7), 16),
    ];
  }) satisfies RGBTuple[];

  const indexes = colors_rgba.map(([sr, sg, sb]) => {
    let index = 0, min_dist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < palette_rgb.length; i++) {
      const [dr, dg, db] = palette_rgb[i];
      const dist = (sr - dr) ** 2 + (sg - dg) ** 2 + (sb - db) ** 2;
      if (dist < min_dist) {
        min_dist = dist;
        index = i;
      }
    }
    return index;
  }) as [number, number, number, number];
  const alphas = colors_rgba.map((rgba) => {
    const alpha = rgba[3];
    return Math.floor(alpha / 16);
  }) as [number, number, number, number];
  const rgba_tuple = [
    [... palette_rgb[indexes[0]], alphas[0] * 16 + alphas[0]] as RGBATuple,
    [... palette_rgb[indexes[1]], alphas[1] * 16 + alphas[1]] as RGBATuple,
    [... palette_rgb[indexes[2]], alphas[2] * 16 + alphas[2]] as RGBATuple,
    [... palette_rgb[indexes[3]], alphas[3] * 16 + alphas[3]] as RGBATuple,
  ] satisfies [RGBATuple, RGBATuple, RGBATuple, RGBATuple];

  const [top, bottom] = encodeImage(width, height, image, rgba_tuple);

  const control_data_offset = top.byteLength + bottom.byteLength + 4;
  const controls: ArrayBuffer[] = [];
  let offset = control_data_offset;
  {
    const curr = offset;
    let next = offset;

    const start = [
      Uint8Array.from([0x01]).buffer,
      VOBSUBControlStartCaption.into(),
    ];
    const palette = [
      Uint8Array.from([0x03]).buffer,
      VOBSUBControlPallete.into(indexes),
    ];
    const alpha = [
      Uint8Array.from([0x04]).buffer,
      VOBSUBControlAlpha.into(alphas),
    ];
    const coord = [
      Uint8Array.from([0x05]).buffer,
      VOBSUBControlCoordDefinition.into([x, x + width - 1, y, y + height - 1]),
    ];
    const rle = [
      Uint8Array.from([0x06]).buffer,
      VOBSUBControlRLEOffset.into([4, 4 + top.byteLength]),
    ];
    const last = [
      Uint8Array.from([0xFF]).buffer,
      VOBSUBControlEND.into(),
    ]
    const all = [... start, ... palette, ... alpha, ... coord, ... rle, ... last] satisfies ArrayBuffer[];
    const bytes = all.reduce((a, b) => a + b.byteLength, 0);
    next += duration == null ? 0 : bytes + 4;
    offset += bytes + 4;
    controls.push(uint16be(Math.floor(0 * 100)), uint16be(next));
    controls.push(... all);
  }
  if (duration != null) {
    const curr = offset;
    const end = [
      Uint8Array.from([0x02]).buffer,
      VOBSUBControlStopCaption.into(),
    ];
    const last = [
      Uint8Array.from([0xFF]).buffer,
      VOBSUBControlEND.into(),
    ]
    controls.push(uint16be(Math.floor(duration * 100)), uint16be(curr));
    controls.push(... end, ... last);
  }
  const controls_packet_bytes = controls.reduce((a, b) => a + b.byteLength, 0);
  const all_packet_bytes = control_data_offset + controls_packet_bytes

  return concat(
    uint16be(all_packet_bytes), // subtitle_size
    uint16be(control_data_offset), // data_packet_size
    top, bottom,
    ... controls
  );
}

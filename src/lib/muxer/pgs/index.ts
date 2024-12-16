import { ByteBuilder } from "../../../util/bytebuilder";

export const encodeSupFormat = (pts: number, dts: number, data: ArrayBuffer): ArrayBuffer => {
  const builder = new ByteBuilder();
  builder.writeU16(0x5047); // magic
  builder.writeU32(pts);
  builder.writeU32(dts);
  builder.write(data);
  return builder.build();
}

export const ycbcr = (r: number, g: number, b: number): [number, number, number] => {
  return [
    Math.max(   0, Math.min(255, Math.round(0.299     * r + 0.587    * g + 0.114    * b))),
    Math.max(-128, Math.min(127, Math.round(-0.168736 * r - 0.331264 * g + 0.5      * b))) + 128,
    Math.max(-128, Math.min(127, Math.round(0.5       * r - 0.418688 * g - 0.081312 * b))) + 128,
  ];
}

export type AribChar = {
  position: [number, number],
  extent: [number, number],
} & ({
  type: 'TEXT',
  character: string,
} | {
  type: 'DRCS',
  data: Uint8Array,
});

export type AribRegion = {
  text: AribChar[],
  position: [number, number],
  extent: [number, number],
  fg_index: number,
  bg_index: number,
  hlc: number,
  stl: boolean,
  orn_index: number | null,
}

export type AribDecoderResult = {
  regions: AribRegion[],
  plane: [number, number],
  end_time: number,
}

export default interface Decoder {
  decode(data: Uint8Array): AribDecoderResult;
}

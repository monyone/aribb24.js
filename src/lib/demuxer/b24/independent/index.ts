export type CaptionPES = {
  tag: 'Caption';
  data: Uint8Array;
}
export type SuperimposePES = {
  tag: 'Superimpose';
  data: Uint8Array;
}

export type PES = CaptionPES | SuperimposePES;

export default (data: Uint8Array | ArrayBufferLike): PES | null => {
  data = data instanceof Uint8Array ? data : new Uint8Array(data);

  if (data.byteLength <= 0) { return null; }
  const data_identifier = data[0];
  if (data_identifier !== 0x80 && data_identifier !== 0x81) { return null }
  const tag = data_identifier === 0x80 ? 'Caption' : 'Superimpose';

  if (data.byteLength <= 2) { return null; }
  const PES_data_packet_header_length = data[2] & 0x0F;

  const data_group_begin = (3 + PES_data_packet_header_length);

  if (data.byteLength < data_group_begin) { return null; }

  return { tag, data: data.subarray(data_group_begin) };
}

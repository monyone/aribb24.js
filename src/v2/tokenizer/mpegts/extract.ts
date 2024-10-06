export type CaptionPES = {
  tag: 'Caption';
  data: ArrayBuffer;
}
export type SuperimposePES = {
  tag: 'Superimpose';
  data: ArrayBuffer;
}

export type PES = CaptionPES | SuperimposePES;

export default (data: ArrayBuffer): PES | null => {
  const uint8 = new Uint8Array(data);

  if (uint8.byteLength <= 0) { return null; }
  const data_identifier = uint8[0];
  if (data_identifier !== 0x80 && data_identifier !== 0x81) { return null }
  const tag = data_identifier === 0x80 ? 'Caption' : 'Superimpose';

  if (uint8.byteLength <= 2) { return null; }
  const PES_data_packet_header_length = uint8[2] & 0x0F;

  const data_group_begin = (3 + PES_data_packet_header_length);

  if (uint8.byteLength < data_group_begin) { return null; }

  return { tag, data: data.slice(data_group_begin) };
}

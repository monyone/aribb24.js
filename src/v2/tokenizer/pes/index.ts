export type StatementDataUnit = {
  tag: 'Statement';
  data: ArrayBuffer;
}
export type DRCSDataUnit = {
  tag: 'DRCS'
  data: ArrayBuffer;
  bytes: 1 | 2;
}
export type DataUnit = StatementDataUnit | DRCSDataUnit;

export type CaptionManagement = {
  tag: 'CaptionManagement';
  group: 0 | 1;
  data: ArrayBuffer;
};
export type CaptionStatement = {
  tag: 'CaptionStatement';
  group: 0 | 1;
  lang: number;
  units: DataUnit[];
}
export type CaptionData = CaptionManagement | CaptionStatement;

export type CaptionPES = {
  tag: 'Caption';
  content: CaptionData;
}
export type SuperimposePES = {
  tag: 'Superimpose';
  content: CaptionData;
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

  if (uint8.byteLength <= data_group_begin) { return null; }
  const data_group_id = (uint8[data_group_begin + 0] & 0xFC) >> 2;
  const group = ((data_group_id & 0x20) >> 5) as (0 | 1);
  const lang = (data_group_id & 0x0F);

  if (lang === 0) { // Management
    return null;
  } else { // Statement
    if (uint8.byteLength <= data_group_begin + 3) { return null; }
    const data_group_size = (uint8[data_group_begin + 3] << 8) + uint8[data_group_begin + 4]

    if (uint8.byteLength < data_group_begin + (5 + data_group_size)) { return null; }
    const units: DataUnit[] = [];
    let data_unit = data_group_begin + 9
    while (data_unit < data_group_begin + (5 + data_group_size)) {
      const unit_separator = uint8[data_unit + 0]
      const data_unit_parameter = uint8[data_unit + 1]
      const data_unit_size = (uint8[data_unit + 2] << 16) | (uint8[data_unit + 3] << 8) | uint8[data_unit + 4]

      if (data_unit_parameter === 0x20) {
        units.push({ tag: 'Statement', data: uint8.slice(data_unit + 5, data_unit + 5 + data_unit_size).buffer });
      }else if (data_unit_parameter == 0x30) {
        units.push({ tag: 'DRCS', bytes: 1, data: uint8.slice(data_unit + 5, data_unit + 5 + data_unit_size).buffer });
      }else if (data_unit_parameter == 0x31) {
        units.push({ tag: 'DRCS', bytes: 2, data: uint8.slice(data_unit + 5, data_unit + 5 + data_unit_size).buffer });
      }
      // TODO: FIXME: Other Ignored...

      data_unit += 5 + data_unit_size
    }

    return {
      tag,
      content: {
        tag: 'CaptionStatement',
        group,
        lang,
        units
      }
    }
  }
}

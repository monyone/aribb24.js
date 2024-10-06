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

export default (data: ArrayBuffer): CaptionData | null => {
  const uint8 = new Uint8Array(data);
  const data_group_id = (uint8[0] & 0xFC) >> 2;
  const group = ((data_group_id & 0x20) >> 5) as (0 | 1);
  const lang = (data_group_id & 0x0F);

  if (lang === 0) { // Management
    return null;
  } else { // Statement
    if (uint8.byteLength <= 3) { return null; }
    const data_group_size = (uint8[3] << 8) + uint8[4]

    if (uint8.byteLength < (5 + data_group_size)) { return null; }
    const units: DataUnit[] = [];
    let data_unit = 9
    while (data_unit < (5 + data_group_size)) {
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
      tag: 'CaptionStatement',
      group,
      lang,
      units
    }
  }
}

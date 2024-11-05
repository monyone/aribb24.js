import { ByteStream } from "../../../util/bytestream";

export type StatementDataUnit = {
  tag: 'Statement';
  data: ArrayBuffer;
}
export const StatementDataUnit = {
  from(data: ArrayBuffer): StatementDataUnit {
    return { tag: 'Statement', data };
  }
}
export type DRCSDataUnit = {
  tag: 'DRCS'
  data: ArrayBuffer;
  bytes: 1 | 2;
}
export const DRCSDataUnit = {
  from(data: ArrayBuffer, bytes: 1 | 2): DRCSDataUnit {
    return { tag: 'DRCS', data, bytes };
  }
}
export type BitmapDataUnit = {
  tag: 'Bitmap'
  data: ArrayBuffer;
}
export const BitmapDataUnit = {
  from(data: ArrayBuffer): BitmapDataUnit {
    return { tag: 'Bitmap', data };
  }
}
export type DataUnit = StatementDataUnit | DRCSDataUnit | BitmapDataUnit;

export const CaptionManagementTCS = {
  JIS8: 0b00,
  UCS: 0b01,
  RESERVED1: 0b10,
  RESERVED2: 0b11,
} as const;

export type CaptionManagementLanguageEntry = {
  lang: number;
  iso_639_language_code: string;
  rollup: boolean;
  format: number;
  TCS: (typeof CaptionManagementTCS)[keyof typeof CaptionManagementTCS];
};

export type CaptionManagement = {
  tag: 'CaptionManagement';
  group: 0 | 1;
  languages: CaptionManagementLanguageEntry[],
  units: DataUnit[];
};
export type CaptionStatement = {
  tag: 'CaptionStatement';
  group: 0 | 1;
  lang: number;
  units: DataUnit[];
}
export type CaptionData = CaptionManagement | CaptionStatement;

export type CaptionLanguageInformation = {
  association: 'ARIB' | 'SBTVD' | 'UNKNOWN',
  language: string;
};

export default (data: ArrayBuffer, readSTM: boolean = false): CaptionData | null => {
  const stream = new ByteStream(data);

  const data_group_id = (stream.readU8() & 0xFC) >> 2;
  const group = ((data_group_id & 0x20) >> 5) as (0 | 1);
  const lang = (data_group_id & 0x0F);
  const data_group_link_number = stream.readU8();
  const last_data_group_link_number = stream.readU8();
  const data_group_size = stream.readU16();

  if (lang === 0) { // Caption Management
    const TMD = (stream.readU8() & 0xC0) >> 6;
    if (TMD === 0b10) {
      const OTM = stream.read(5); // OTM (36 + 4)
    }

    const num_languages = stream.readU8();
    const languages: CaptionManagementLanguageEntry[] = [];
    for (let i = 0; i < num_languages; i++) {
      const language_tag_DMF = stream.readU8();
      const language_tag = (language_tag_DMF & 0xE0) >> 5
      const DMF = language_tag_DMF & 0x0F;
      if (DMF === 0b1100 || DMF === 0b1101 || DMF === 0b1110) {
        const DC = stream.readU8();
      }
      const ISO_639_language_code = String.fromCharCode(stream.readU8(), stream.readU8(), stream.readU8());
      const Format_TCS_rollup = stream.readU8();
      const Format = (Format_TCS_rollup & 0xF0) >> 4;
      const TCS = ((Format_TCS_rollup & 0x0C) >> 2) as (0 | 1 | 2 | 3);
      const rollup_mode = (Format_TCS_rollup & 0x03);

      languages.push({
        lang: language_tag,
        iso_639_language_code: ISO_639_language_code,
        TCS: TCS,
        format: Format,
        rollup: rollup_mode !== 0b00,
      });
    }

    const data_unit_loop_length = stream.readU24();
    const units: DataUnit[] = [];
    let offset = 0;
    while (offset < data_unit_loop_length) {
      const unit_separator = stream.readU8();
      const data_unit_parameter = stream.readU8();
      const data_unit_size = stream.readU24();

      switch (data_unit_parameter) {
        case 0x20:
          units.push({ tag: 'Statement', data: stream.read(data_unit_size) });
          break;
        case 0x30:
          units.push({ tag: 'DRCS', bytes: 1, data: stream.read(data_unit_size) });
          break;
        case 0x31:
          units.push({ tag: 'DRCS', bytes: 2, data: stream.read(data_unit_size) });
          break;
        case 0x35:
          units.push({ tag: 'Bitmap', data: stream.read(data_unit_size) });
          break;
        default: // TODO: FIXME: Other Ignored...
          stream.read(data_unit_size);
          break;
      }

      offset += 5 + data_unit_size;
    }
    const CRC16 = stream.readU16();

    return {
      tag: 'CaptionManagement',
      group,
      languages,
      units,
    };
  } else { // Caption Data
    const TMD = (stream.readU8() & 0xC0) >> 6;
    if (TMD === 0b01 || TMD === 0b10 || readSTM) {
      const STM = stream.read(5); // STM (36 + 4)
    }

    const data_unit_loop_length = stream.readU24();
    const units: DataUnit[] = [];
    let offset = 0;
    while (offset < data_unit_loop_length) {
      const unit_separator = stream.readU8();
      const data_unit_parameter = stream.readU8();
      const data_unit_size = stream.readU24();

      switch (data_unit_parameter) {
        case 0x20:
          units.push({ tag: 'Statement', data: stream.read(data_unit_size) });
          break;
        case 0x30:
          units.push({ tag: 'DRCS', bytes: 1, data: stream.read(data_unit_size) });
          break;
        case 0x31:
          units.push({ tag: 'DRCS', bytes: 2, data: stream.read(data_unit_size) });
          break;
        case 0x35:
          units.push({ tag: 'Bitmap', data: stream.read(data_unit_size) });
          break;
        default: // TODO: FIXME: Other Ignored...
          stream.read(data_unit_size);
          break;
      }

      offset += 5 + data_unit_size;
    }
    const CRC16 = stream.readU16();

    return {
      tag: 'CaptionStatement',
      group,
      lang: lang - 1,
      units,
    };
  }
}

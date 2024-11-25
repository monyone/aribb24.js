import { ByteStream } from "../../../util/bytestream";

export type ARIBB24StatementDataUnit = {
  tag: 'Statement';
  data: ArrayBuffer;
}
export const ARIBB24StatementDataUnit = {
  from(data: ArrayBuffer): ARIBB24StatementDataUnit {
    return { tag: 'Statement', data };
  }
}
export type ARIBB24DRCSDataUnit = {
  tag: 'DRCS'
  data: ArrayBuffer;
  bytes: 1 | 2;
}
export const ARIBB24DRCSDataUnit = {
  from(data: ArrayBuffer, bytes: 1 | 2): ARIBB24DRCSDataUnit {
    return { tag: 'DRCS', data, bytes };
  }
}
export type ARIBB24BitmapDataUnit = {
  tag: 'Bitmap'
  data: ArrayBuffer;
}
export const ARIBB24BitmapDataUnit = {
  from(data: ArrayBuffer): ARIBB24BitmapDataUnit {
    return { tag: 'Bitmap', data };
  }
}
export type ARIBB24DataUnit = ARIBB24StatementDataUnit | ARIBB24DRCSDataUnit | ARIBB24BitmapDataUnit;

export const DisplayModeType = {
  AUTO_ENABLED: 0,
  AUTO_DISABLED: 1,
  SELECT: 2,
  SELECT_SPECIFIC: 3,
} as const;
export type DisplayModeTypeAll =
    0b0000 | 0b0001 | 0b0010 | 0b0011
  | 0b0100 | 0b0101 | 0b0110 | 0b0111
  | 0b1000 | 0b1001 | 0b1010 | 0b1011
  | 0b1100 | 0b1101 | 0b1110 | 0b1111;
export type DisplayModeTypeConditionDesignation =
  | 0b1100 | 0b1101 | 0b1110;
export type DisplayModeAndDisplayConditionDesignation = {
  displayMode: Exclude<DisplayModeTypeAll, DisplayModeTypeConditionDesignation>
} | {
  displayMode: DisplayModeTypeConditionDesignation;
  displayConditionDesignation: number;
}
export const TCSType = {
  JIS8: 0b00,
  UCS: 0b01,
  RESERVED1: 0b10,
  RESERVED2: 0b11,
} as const;
export const RollupModeType = {
  NOT_ROLLUP: 0,
  ROLLUP: 1,
  RESERVED1: 2,
  RESERVED2: 3,
} as const

export type CaptionManagementLanguageEntry = {
  lang: number;
  iso_639_language_code: string;
  rollup: (typeof RollupModeType)[keyof typeof RollupModeType];
  format: number;
  TCS: (typeof TCSType)[keyof typeof TCSType];
} & DisplayModeAndDisplayConditionDesignation;

export const TimeControlModeType = {
  FREE: 0,
  REALTIME: 1,
  OFFSETTIME: 2,
  RESERVED: 3
} as const;
export type TimeControlModeAndOffsetTime = {
  timeControlMode: Exclude<(typeof TimeControlModeType)[keyof typeof TimeControlModeType], (typeof TimeControlModeType.OFFSETTIME)>;
} | {
  timeControlMode: (typeof TimeControlModeType.OFFSETTIME);
  offsetTime: [number, number, number, number];
};
export type TimeControlModeAndPresentationStartTime = {
  timeControlMode: Exclude<(typeof TimeControlModeType)[keyof typeof TimeControlModeType], (typeof TimeControlModeType.OFFSETTIME) | (typeof TimeControlModeType.REALTIME)>;
} | {
  timeControlMode: (typeof TimeControlModeType.OFFSETTIME) | (typeof TimeControlModeType.REALTIME);
  presentationStartTime: [number, number, number, number];
};

export type ARIBB24CaptionManagement = {
  tag: 'CaptionManagement';
  group: 0 | 1;
  languages: CaptionManagementLanguageEntry[],
  units: ARIBB24DataUnit[];
} & TimeControlModeAndOffsetTime;
export type ARIBB24CaptionStatement = {
  tag: 'CaptionStatement';
  group: 0 | 1;
  lang: number;
  units: ARIBB24DataUnit[];
} & TimeControlModeAndPresentationStartTime;
export type ARIBB24CaptionData = ARIBB24CaptionManagement | ARIBB24CaptionStatement;

export type CaptionAssociationInformation = {
  association: 'ARIB' | 'SBTVD' | 'UNKNOWN',
  language: string;
};

const BCD = (stream: ByteStream): [number, number] => {
  const value = stream.readU8();
  return [
    (value & 0xF0) >> 4,
    (value & 0x0F) >> 0,
  ];
}
export const BCDtoHHMMSSsss = (stream: ByteStream): [number, number, number, number] => {
  const numbers = [BCD(stream), BCD(stream), BCD(stream), BCD(stream), BCD(stream)].flatMap((e) => e);
  return [
    numbers[0] * 10 + numbers[1],
    numbers[2] * 10 + numbers[3],
    numbers[4] * 10 + numbers[5],
    numbers[6] * 100 + numbers[7] * 10 + numbers[8],
  ];
}

export default (data: ArrayBuffer): ARIBB24CaptionData | null => {
  const stream = new ByteStream(data);

  const data_group_id = (stream.readU8() & 0xFC) >> 2;
  const group = ((data_group_id & 0x20) >> 5) as (0 | 1);
  const lang = (data_group_id & 0x0F);
  const data_group_link_number = stream.readU8();
  const last_data_group_link_number = stream.readU8();
  const data_group_size = stream.readU16();

  if (lang === 0) { // Caption Management
    const TMD = ((stream.readU8() & 0xC0) >> 6) as (0 | 1 | 2 | 3);
    const timeControlModeAndOffsetTime = (TMD === TimeControlModeType.OFFSETTIME ? {
      timeControlMode: TMD,
      offsetTime: BCDtoHHMMSSsss(stream)
    } : {
      timeControlMode: TMD,
    }) satisfies TimeControlModeAndOffsetTime;

    const num_languages = stream.readU8();
    const languages: CaptionManagementLanguageEntry[] = [];
    for (let i = 0; i < num_languages; i++) {
      const language_tag_DMF = stream.readU8();
      const language_tag = (language_tag_DMF & 0xE0) >> 5
      const DMF = (language_tag_DMF & 0x0F) as DisplayModeTypeAll;
      const displayModeAndDisplayConditionDesignation = ((DMF === 0b1100 || DMF === 0b1101 || DMF === 0b1110) ? {
        displayMode: DMF,
        displayConditionDesignation: stream.readU8(),
      } : {
        displayMode: DMF,
      }) satisfies DisplayModeAndDisplayConditionDesignation;
      const ISO_639_language_code = String.fromCharCode(stream.readU8(), stream.readU8(), stream.readU8());
      const Format_TCS_rollup = stream.readU8();
      const Format = (Format_TCS_rollup & 0xF0) >> 4;
      const TCS = ((Format_TCS_rollup & 0x0C) >> 2) as (0 | 1 | 2 | 3);
      const rollup_mode = (Format_TCS_rollup & 0x03) as (0 | 1 | 2 | 3);

      languages.push({
        ... displayModeAndDisplayConditionDesignation,
        lang: language_tag,
        iso_639_language_code: ISO_639_language_code,
        TCS: TCS,
        format: Format,
        rollup: rollup_mode,
      });
    }

    const data_unit_loop_length = stream.readU24();
    const units: ARIBB24DataUnit[] = [];
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
      ... timeControlModeAndOffsetTime,
      tag: 'CaptionManagement',
      group,
      languages,
      units,
    };
  } else { // Caption Data
    const TMD = ((stream.readU8() & 0xC0) >> 6) as (0 | 1 | 2 | 3);
    const timeControlModeAndPresentationStartTime = ((TMD === TimeControlModeType.REALTIME || TMD === TimeControlModeType.OFFSETTIME) ? {
      timeControlMode: TMD,
      presentationStartTime: BCDtoHHMMSSsss(stream)
    } : {
      timeControlMode: TMD,
    }) satisfies TimeControlModeAndPresentationStartTime;

    const data_unit_loop_length = stream.readU24();
    const units: ARIBB24DataUnit[] = [];
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
      ... timeControlModeAndPresentationStartTime,
      tag: 'CaptionStatement',
      group,
      lang: lang - 1,
      units,
    };
  }
}

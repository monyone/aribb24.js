import { ByteStream } from "../../../util/bytestream";
import { BCDtoHHMMSSsss, CaptionData, CaptionManagementLanguageEntry, DataUnit, DisplayModeAndDisplayConditionDesignation, DisplayModeTypeAll, TimeControlModeAndOffsetTime, TimeControlModeAndPresentationStartTime, TimeControlModeType } from "../b24/datagroup";

export default (data: ArrayBuffer): CaptionData | null => {
  const stream = new ByteStream(data);

  const data_group_id = (stream.readU8() & 0xFC) >> 2;
  const group = ((data_group_id & 0x20) >> 5) as (0 | 1);
  const lang = (data_group_id & 0x0F);
  const data_group_link_number = stream.readU8();
  const last_data_group_link_number = stream.readU8();
  const data_group_size = stream.readU16();

  if (lang === 0) { // Caption Management
    const timeControlMode = ((stream.readU8() & 0xC0) >> 6) as (0 | 1 | 2 | 3);
    const offsetTime = BCDtoHHMMSSsss(stream);
    const timeControlModeAndOffsetTime = (timeControlMode === TimeControlModeType.OFFSETTIME ? {
      timeControlMode,
      offsetTime,
    } : {
      timeControlMode,
    }) satisfies TimeControlModeAndOffsetTime;

    const num_languages = stream.readU8();
    const languages: CaptionManagementLanguageEntry[] = [];
    for (let i = 0; i < 1; i++) {
      const language_tag_DMF = stream.readU8();
      const language_tag = (language_tag_DMF & 0xE0) >> 5
      const displayMode = (language_tag_DMF & 0x0F) as DisplayModeTypeAll;
      const displayConditionDesignation = stream.readU8();
      const displayModeAndDisplayConditionDesignation = ((displayMode === 0b1100 || displayMode === 0b1101 || displayMode === 0b1110) ? {
        displayMode,
        displayConditionDesignation,
      } : {
        displayMode,
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

    return {
      ... timeControlModeAndOffsetTime,
      tag: 'CaptionManagement',
      group,
      languages,
      units: [],
    };
  } else { // Caption Data
    const timeControlMode = ((stream.readU8() & 0xC0) >> 6) as (0 | 1 | 2 | 3);
    const presentationStartTime = BCDtoHHMMSSsss(stream);
    const timeControlModeAndPresentationStartTime = ((timeControlMode === TimeControlModeType.REALTIME || timeControlMode === TimeControlModeType.OFFSETTIME) ? {
      timeControlMode,
      presentationStartTime,
    } : {
      timeControlMode,
    }) satisfies TimeControlModeAndPresentationStartTime;

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

    return {
      ... timeControlModeAndPresentationStartTime,
      tag: 'CaptionStatement',
      group,
      lang: lang - 1,
      units,
    };
  }
}

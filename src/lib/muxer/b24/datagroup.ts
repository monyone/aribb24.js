import { ByteBuilder } from "../../../util/bytebuilder";
import concat from "../../../util/concat";
import CRC16_CCITT from "../../../util/crc16-ccitt";
import { ExhaustivenessError } from "../../../util/error";
import { ARIBB24CaptionData, ARIBB24DataUnit, TimeControlModeType } from "../../demuxer/b24/datagroup";

const data_unit_parameter = (unit: ARIBB24DataUnit) => {
  switch (unit.tag) {
    case 'Statement':
      return 0x20;
    case 'DRCS':
      return unit.bytes === 2 ? 0x31 : 0x30;
    case 'Bitmap':
      return 0x35;
    default:
      throw new ExhaustivenessError(unit, `Unexpected Data Unit in STD-B24 ARIB Caption`);
  }
}

export default (caption: ARIBB24CaptionData) => {
  const dataunitBuilder = new ByteBuilder();
  for (const unit of caption.units) {
    dataunitBuilder.writeU8(0x1F);
    dataunitBuilder.writeU8(data_unit_parameter(unit));
    dataunitBuilder.writeU24(unit.data.byteLength);
    dataunitBuilder.write(unit.data);
  }
  const dataunit = dataunitBuilder.build();

  switch (caption.tag) {
    case 'CaptionManagement': {
      const languagesBuilder = new ByteBuilder();
      for (const language of caption.languages) {
        languagesBuilder.writeU8((language.lang << 5) | (1 << 4) | (language.displayMode));
        if (language.displayMode === 0b1100 || language.displayMode === 0b1101 || language.displayMode === 0b1110) {
          languagesBuilder.writeU8(language.displayConditionDesignation);
        }
        languagesBuilder.writeU8(language.iso_639_language_code.charCodeAt(0));
        languagesBuilder.writeU8(language.iso_639_language_code.charCodeAt(1));
        languagesBuilder.writeU8(language.iso_639_language_code.charCodeAt(2));
        languagesBuilder.writeU8((language.format << 4) | (language.TCS << 2) | (language.rollup));
      }
      const languages = languagesBuilder.build();

      const datagroupBuilder = new ByteBuilder();
      datagroupBuilder.writeU8((caption.timeControlMode << 6) | 0b111111);
      if (caption.timeControlMode === 0b10) {
        const HH = (Math.floor(caption.offsetTime[0] / 10) << 4) | ((caption.offsetTime[0] % 10) << 0);
        const MM = (Math.floor(caption.offsetTime[1] / 10) << 4) | ((caption.offsetTime[1] % 10) << 0);
        const SS = (Math.floor(caption.offsetTime[2] / 10) << 4) | ((caption.offsetTime[2] % 10) << 0);
        const sss1 = (Math.floor(caption.offsetTime[3] / 100) << 4) | ((Math.floor(caption.offsetTime[3] / 10) % 10) << 0);
        const sss2 = (Math.floor(caption.offsetTime[3] % 10) << 4) | 0b1111;
        datagroupBuilder.writeU8(HH);
        datagroupBuilder.writeU8(MM);
        datagroupBuilder.writeU8(SS);
        datagroupBuilder.writeU8(sss1);
        datagroupBuilder.writeU8(sss2);
      }
      datagroupBuilder.writeU8(caption.languages.length)
      datagroupBuilder.write(languages);
      datagroupBuilder.writeU24(dataunit.byteLength);
      datagroupBuilder.write(dataunit);
      const datagroup = datagroupBuilder.build();

      const managementBuilder = new ByteBuilder();
      managementBuilder.writeU8((caption.group << 7) | (0 << 2)); // data_group_id + data_group_version (0)
      managementBuilder.writeU8(0); // data_group_link_number (0)
      managementBuilder.writeU8(0); // last_data_group_link_number (0)
      managementBuilder.writeU16(datagroup.byteLength);
      managementBuilder.write(datagroup);
      managementBuilder.writeU16(CRC16_CCITT(new Uint8Array(managementBuilder.build())));

      return managementBuilder.build();
    }
    case 'CaptionStatement': {
      const datagroupBuilder = new ByteBuilder();
      datagroupBuilder.writeU8((caption.timeControlMode << 6) | 0b111111);
      if (caption.timeControlMode === TimeControlModeType.REALTIME || caption.timeControlMode === TimeControlModeType.OFFSETTIME) {
        const HH = (Math.floor(caption.presentationStartTime[0] / 10) << 4) | ((caption.presentationStartTime[0] % 10) << 0);
        const MM = (Math.floor(caption.presentationStartTime[1] / 10) << 4) | ((caption.presentationStartTime[1] % 10) << 0);
        const SS = (Math.floor(caption.presentationStartTime[2] / 10) << 4) | ((caption.presentationStartTime[2] % 10) << 0);
        const sss1 = (Math.floor(caption.presentationStartTime[2] / 100) << 4) | (((caption.presentationStartTime[2] / 10) % 10) << 0);
        const sss2 = (Math.floor(caption.presentationStartTime[2] % 10) << 4) | 0b1111;
        datagroupBuilder.writeU8(HH);
        datagroupBuilder.writeU8(MM);
        datagroupBuilder.writeU8(SS);
        datagroupBuilder.writeU8(sss1);
        datagroupBuilder.writeU8(sss2);
      }
      datagroupBuilder.writeU24(dataunit.byteLength);
      datagroupBuilder.write(dataunit);
      const datagroup = datagroupBuilder.build();

      const statementBuilder = new ByteBuilder();
      statementBuilder.writeU8((caption.group << 7) | ((caption.lang + 1) << 2) | 0b00); // data_group_id + data_group_version (0)
      statementBuilder.writeU8(0); // data_group_link_number (0)
      statementBuilder.writeU8(0); // last_data_group_link_number (0)
      statementBuilder.writeU16(datagroup.byteLength);
      statementBuilder.write(datagroup);
      statementBuilder.writeU16(CRC16_CCITT(new Uint8Array(statementBuilder.build())));

      return statementBuilder.build();
    }
    default:
      throw new ExhaustivenessError(caption, `Unexpected STD-B24 ARIB Caption Content`);
  }
};

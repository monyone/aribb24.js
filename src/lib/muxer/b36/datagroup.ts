import { ByteBuilder } from "../../../util/bytebuilder";
import CRC16_CCITT from "../../../util/crc16-ccitt";
import { UnreachableError, ViolationStandardError } from "../../../util/error";
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
      const exhaustive: never = unit;
      throw new UnreachableError(`Undefined Data Unit in STD-B24 ARIB Caption (${exhaustive})`);
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
      if (caption.languages.length !== 1) {
        throw new ViolationStandardError('ARIB STD-B36 must only one language');
      }
      for (const language of caption.languages) {
        languagesBuilder.writeU8((0b000 << 5) | (1 << 4) | (language.displayMode));
        languagesBuilder.writeU8(0); // DC is Zero
        languagesBuilder.writeU8(language.iso_639_language_code.charCodeAt(0));
        languagesBuilder.writeU8(language.iso_639_language_code.charCodeAt(1));
        languagesBuilder.writeU8(language.iso_639_language_code.charCodeAt(2));
        languagesBuilder.writeU8((language.format << 4) | (language.TCS << 2) | (language.rollup));
      }
      const languages = languagesBuilder.build();

      const datagroupBuilder = new ByteBuilder();
      datagroupBuilder.writeU8((0b00) << 6 | 0b111111); // TMD is Zero
      if (caption.timeControlMode !== TimeControlModeType.FREE) {
        throw new ViolationStandardError('TimeControlMode (TMD) must be 0 (FREE)');
      }
      { // OTM is Zero
        datagroupBuilder.writeU8(0x00);
        datagroupBuilder.writeU8(0x00);
        datagroupBuilder.writeU8(0x00);
        datagroupBuilder.writeU8(0x00);
        datagroupBuilder.writeU8(0x0F);
      }
      datagroupBuilder.writeU8(0); // Num Languages is 0 for Specification;
      datagroupBuilder.write(languages);
      const datagroup = datagroupBuilder.build();

      const managementBuilder = new ByteBuilder();
      managementBuilder.writeU8((0b0 << 7) | (0 << 2)); // data_group_id(0) + data_group_version (0)
      managementBuilder.writeU8(0); // data_group_link_number (0)
      managementBuilder.writeU8(0); // last_data_group_link_number (0)
      managementBuilder.writeU16(datagroup.byteLength);
      managementBuilder.write(datagroup);

      return managementBuilder.build();
    }
    case 'CaptionStatement': {
      const datagroupBuilder = new ByteBuilder();
      datagroupBuilder.writeU8((0b00 << 6) | 0b111111); // TMD is Zero
      if (caption.timeControlMode !== TimeControlModeType.FREE) {
        throw new ViolationStandardError('TimeControlMode (TMD) must be 0 (FREE)');
      }
      { // STM is Zero
        datagroupBuilder.writeU8(0x00);
        datagroupBuilder.writeU8(0x00);
        datagroupBuilder.writeU8(0x00);
        datagroupBuilder.writeU8(0x00);
        datagroupBuilder.writeU8(0x0F);
      }
      datagroupBuilder.writeU24(dataunit.byteLength);
      datagroupBuilder.write(dataunit);
      const datagroup = datagroupBuilder.build();

      const statementBuilder = new ByteBuilder();
      statementBuilder.writeU8((0b0 << 7) | ((0b1) << 2) | 0b00); // data_group_id(1) + data_group_version (0)
      statementBuilder.writeU8(0); // data_group_link_number (0)
      statementBuilder.writeU8(0); // last_data_group_link_number (0)
      statementBuilder.writeU16(datagroup.byteLength);
      statementBuilder.write(datagroup);

      return statementBuilder.build();
    }
    default:
      const exhaustive: never = caption;
      throw new UnreachableError(`Undefined Caption in STD-B24 ARIB Caption (${exhaustive})`);
  }
};

import concat from "../../../util/concat";
import CRC16_CCITT from "../../../util/crc16-ccitt";
import { UnreachableError } from "../../../util/error";
import { CaptionData, DataUnit } from "../../demuxer/b24/datagroup";

const data_unit_parameter = (unit: DataUnit) => {
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

export default (caption: CaptionData, isB36: boolean = false) => {
  const data_unit_loop = concat(... caption.units.flatMap((unit) => {
    return [
      Uint8Array.from([
        0x1F,
        data_unit_parameter(unit),
        (unit.data.byteLength & 0xFF0000) >> 16,
        (unit.data.byteLength & 0x00FF00) >> 8,
        (unit.data.byteLength & 0x0000FF) >> 0,
      ]).buffer,
      unit.data
    ];
  }));

  switch (caption.tag) {
    case 'CaptionManagement': {
      const languages = concat(... caption.languages.map((language) => {
        const buffer = new ArrayBuffer(1 + 3 + 1);
        const view = new DataView(buffer);
        view.setUint8(0, (language.lang << 5) | (0b0000));
        view.setUint8(1, language.iso_639_language_code.charCodeAt(0));
        view.setUint8(2, language.iso_639_language_code.charCodeAt(1));
        view.setUint8(3, language.iso_639_language_code.charCodeAt(2));
        view.setUint8(4, (language.format << 4) | (language.TCS << 2) | (language.rollup ? 1 : 0) << 0)
        return buffer;
      }));
      const data_group_size = data_unit_loop.byteLength + 3 + 1 /* TMD */ + (isB36 ? 5 : 0) + 1 + languages.byteLength;
      const buffer = new ArrayBuffer(3 + (2 + data_group_size) + (isB36 ? 0 : 2 /* CRC16*/));
      const array = new Uint8Array(buffer);
      const view = new DataView(buffer);
      view.setUint8(0, (caption.group << 7) | (0 << 2));
      view.setUint16(3, data_group_size, false);
      // TODO: TMD only 0 is supported
      view.setUint8(3 + 2 + 1 + (isB36 ? 5 : 0), caption.languages.length);
      array.set(new Uint8Array(languages), 3 + 2 + 1 + (isB36 ? 5 : 0) + 1);
      view.setUint8(3 + 2 + 1 + (isB36 ? 5 : 0) + 1 + languages.byteLength + 0, data_unit_loop.byteLength >> 16);
      view.setUint16(3 + 2 + 1 + (isB36 ? 5 : 0) + 1 + languages.byteLength + 1, data_unit_loop.byteLength & 0xFFFF, false);
      array.set(new Uint8Array(data_unit_loop), 3 + 2 + 2 + languages.byteLength + 3);
      if (!isB36) {
        const CRC16 = CRC16_CCITT(array, 0, array.byteLength - 2);
        view.setUint16(array.byteLength - 2, CRC16, false);
      }
      return buffer;
    }
    case 'CaptionStatement': {
      const data_group_size = data_unit_loop.byteLength + 3 + 1 /* TMD */ + (isB36 ? 5 : 0);
      const buffer = new ArrayBuffer(3 + (2 + data_group_size) + (isB36 ? 0 : 2 /* CRC16*/));
      const array = new Uint8Array(buffer);
      const view = new DataView(buffer);
      view.setUint8(0, (caption.group << 7) | ((caption.lang + 1) << 2));
      view.setUint16(3, data_group_size, false);
      // TODO: TMD only 0b00 is supported
      view.setUint8(3 + 2 + 1 + (isB36 ? 5 : 0), data_unit_loop.byteLength >> 16);
      view.setUint16(3 + 2 + 1 + (isB36 ? 5 : 0) + 1, data_unit_loop.byteLength & 0xFFFF, false);
      array.set(new Uint8Array(data_unit_loop), 3 + 2 + 1 + (isB36 ? 5 : 0) + 3);
      if (!isB36) {
        const CRC16 = CRC16_CCITT(array, 0, array.byteLength - 2);
        view.setUint16(array.byteLength - 2, CRC16, false);
      }
      return buffer;
    }
    default:
      const exhaustive: never = caption;
      throw new UnreachableError(`Undefined Caption in STD-B24 ARIB Caption (${exhaustive})`);
  }
};

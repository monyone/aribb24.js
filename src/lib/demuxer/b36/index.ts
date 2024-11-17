import { ByteStream } from "../../../util/bytestream"
import { ViolationStandardError } from "../../../util/error";
import datagroup, { CaptionManagement, CaptionStatement } from "../b24/datagroup";

export const PageMaterialType = {
  CONTENTS_AND_CM: 0,
  CONTENTS: 1,
  CM: 2,
  SOUND: 3,
} as const;
export const DisplayTimingType = {
  REALTIME: 'RT',
  DURATIONTIME: 'DT',
  UNTIME: 'UT',
  NOT_SPECIFIED: '  ',
} as const;
export const TimingUnitType = {
  TIME: 'T',
  FRAME: 'F',
} as const;

export type PageManagementInformation = {
  pageNumber: string;
  pageMaterialType: (typeof PageMaterialType)[keyof typeof PageMaterialType],
  displayTimingType: (typeof DisplayTimingType)[keyof typeof DisplayTimingType],
  timingUnitType: (typeof TimingUnitType)[keyof typeof TimingUnitType],
};

export type ARIBB36PageData = PageManagementInformation & ({
  tag: 'ActualPage'
  management: CaptionManagement;
  statement: CaptionStatement;
} | {
  tag: 'ReservedPage'
  pageNumber: string;
  management: CaptionManagement;
});

export type ARIBB36Data = {
  label: 'DCAPTION' | 'BCAPTION' | 'MCAPTION';
  pages: ARIBB36PageData[]
};

export default (b36: ArrayBuffer): ARIBB36Data => {
  const block = 256;
  const decoder = new TextDecoder('shift-jis', { fatal: true });
  const stream = new ByteStream(b36);

  //
  const label = decoder.decode(stream.read(8));
  if (!(label === 'DCAPTION' || label === 'BCAPTION' || label === 'MCAPTION')) {
    throw new ViolationStandardError(`Undefined CaptionDataLabel: ${label}`);
  }
  stream.read(block - 8);

  // Program Management Information
  {
    const LI = stream.readU32();
    stream.read(Math.floor((4 + LI + (block - 1)) / block) * block - 4);
  }

  // Program Page Information
  const pages: ARIBB36PageData[] = [];
  while (!stream.isEmpty()) {
    const LI = stream.readU32();
    const buffer = stream.read(Math.floor((4 + LI + (block - 1)) / block) * block - 4)
    const data = new DataView(buffer.slice(0, 4 + LI));

    // Page Management Data (ページ管理データ)
    let begin = 0;
    if (data.byteLength < (begin + 1 + 2)) { continue; }
    const DL = data.getUint16(begin + 1, false);
    begin += 1 + 2;
    if (data.byteLength < (begin + DL)) { continue; }
    const page = new ByteStream(data.buffer.slice(begin, begin + DL))
    // pageNumber (ページナンバー/ページコード)
    const pageNumber = String.fromCharCode(
      page.readU8(), page.readU8(), page.readU8(),
      page.readU8(), page.readU8(), page.readU8()
    );
    // pageMaterialType (ページ素材種別)
    const pageMaterialType = page.readU8();
    switch(pageMaterialType) {
      case PageMaterialType.CONTENTS_AND_CM:
      case PageMaterialType.CONTENTS:
      case PageMaterialType.CM:
      case PageMaterialType.SOUND:
        break;
      default:
        throw new ViolationStandardError(`Undefined PageMaterialType: ${pageMaterialType}`);
    }
    // displayTimingType (送出タイミング種別)
    const displayTimingType = String.fromCharCode(page.readU8(), page.readU8());
    switch(displayTimingType) {
      case DisplayTimingType.REALTIME:
      case DisplayTimingType.DURATIONTIME:
      case DisplayTimingType.UNTIME:
      case DisplayTimingType.NOT_SPECIFIED:
        break;
      default:
        throw new ViolationStandardError(`Undefined DisplayTimingType: ${displayTimingType}`);
    }
    // timingUnitType (タイミング単位指定)
    const timingUnitType = String.fromCharCode(page.readU8());
    switch(timingUnitType) {
      case TimingUnitType.TIME:
      case TimingUnitType.FRAME:
        break;
      default:
        throw new ViolationStandardError(`Undefined TimingUnitType: ${displayTimingType}`);
    }

    // Caption Management Data
    begin += DL;
    if (data.byteLength < (begin + 1 + 2)) { continue; }
    const DL1 = data.getUint16(begin + 1, false);
    begin += 1 + 2;
    if (data.byteLength < (begin + DL1)) { continue; }
    const management = datagroup(data.buffer.slice(begin, begin + DL1), true);
    if (management == null || management.tag !== 'CaptionManagement') { continue; }

    if (pageNumber === '000000') {
      pages.push({
        tag: 'ReservedPage',
        pageNumber,
        pageMaterialType,
        displayTimingType,
        timingUnitType,
        management
      });
      continue;
    }

    // Caption Statement Data
    begin += DL1;
    if (data.byteLength < (begin + 1 + 3)) { continue; }
    const DL2 = data.getUint16(begin + 1, false) << 8 | data.getUint8(begin + 3);
    begin += 1 + 3;
    if (data.byteLength < (begin + DL2)) { continue; }
    const statement = datagroup(data.buffer.slice(begin, begin + DL2), true);
    if (statement == null || statement.tag !== 'CaptionStatement') { continue; }

    pages.push({
      tag: 'ActualPage',
      pageNumber,
      pageMaterialType,
      displayTimingType,
      timingUnitType,
      management,
      statement
    });
  }

  return {
    label,
    pages
  };
}

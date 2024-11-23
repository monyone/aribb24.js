import { ByteStream } from "../../../util/bytestream"
import { ViolationStandardError } from "../../../util/error";
import { timecodeToSecond } from "../../../util/timecode";
import datagroup, { CaptionManagement, CaptionStatement } from "../b24/datagroup";

export const PageMaterialType = {
  CONTENTS_AND_CM: '0',
  CONTENTS: '1',
  CM: '2',
  SOUND: '3',
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
export const TimeControlModeType = {
  FREE: 'FR',
  REALTIME: 'RT',
  OFFSETTIME: 'OF',
} as const;
export const FormatDensityType = {
  STANDARD: 'ST',
  DOUBLE: 'DB',
  EUROPEAN: 'EL',
  FULLHI: 'H2',
  HI: 'H1',
  HD: 'HD',
  SD: 'SD',
  MOBILE: 'MB'
} as const;
export const FormatWritingModeType = {
  HORIZONTAL: 'H',
  VERTICAL: 'V',
} as const;
export const DisplayAspectRatioType = {
  HD: ' ',
  SD: '*',
} as const;
export const ScrollType = {
  FIXED: 'F',
  SCROLL: 'S',
  ROLLUP: 'R',
} as const;
export const ScrollDirectionType = {
  HORIZONTAL: 'H',
  VERTICAL: 'V',
} as const;

export type PageManagementInformation = {
  pageNumber: string;
  pageMaterialType: (typeof PageMaterialType)[keyof typeof PageMaterialType];
  displayTimingType: (typeof DisplayTimingType)[keyof typeof DisplayTimingType];
  timingUnitType: (typeof TimingUnitType)[keyof typeof TimingUnitType];
  displayTiming: number;
  clearTiming: number;
  timeControlMode: (typeof TimeControlModeType)[keyof typeof TimeControlModeType];
  clearScreen: boolean;
  displayFormat: `${(typeof FormatDensityType)[keyof typeof FormatDensityType]}${(typeof FormatWritingModeType)[keyof typeof FormatWritingModeType]}`;
  displayAspectRatio: (typeof DisplayAspectRatioType)[keyof typeof DisplayAspectRatioType];
  displayWindowArea: [[number, number], [number, number]] | null;
  scrollType:(typeof ScrollType)[keyof typeof ScrollType];
  scrollDirectionType: (typeof ScrollDirectionType)[keyof typeof ScrollDirectionType];
  sound: boolean;
  pageDataBytes: number;
  deleted: boolean;
  memo: string;
  completed: boolean;
} & ({
  usersAreaUsed: false
} | {
  usersAreaUsed: true,
  writingFormatConversionMode: number;
  drcsConversionMode: number;
});

export type ARIBB36PageData = PageManagementInformation & ({
  tag: 'ActualPage'
  management: CaptionManagement;
  statement: CaptionStatement;
} | {
  tag: 'ReservedPage'
  pageNumber: '000000';
  management: CaptionManagement;
});

export type ARIBB36Data = {
  label: 'DCAPTION' | 'BCAPTION' | 'MCAPTION';
  pages: ARIBB36PageData[]
};

const textDecoder = new TextDecoder('shift-jis');

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
    const pageMaterialType = String.fromCharCode(page.readU8());
    switch (pageMaterialType) {
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
    switch (displayTimingType) {
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
    switch (timingUnitType) {
      case TimingUnitType.TIME:
      case TimingUnitType.FRAME:
        break;
      default:
        throw new ViolationStandardError(`Undefined TimingUnitType: ${timingUnitType}`);
    }
    // displayTiming (送出タイミング)
    const displayTimingHH = String.fromCharCode(page.readU8(), page.readU8());
    const displayTimingMM = String.fromCharCode(page.readU8(), page.readU8());
    const displayTimingSS = String.fromCharCode(page.readU8(), page.readU8());
    const displayTimingXX = String.fromCharCode(page.readU8(), page.readU8());
    page.readU8();
    const displayTiming = pageNumber === '000000' ? 0 : timingUnitType === 'F'
      ? timecodeToSecond(`${displayTimingHH}:${displayTimingMM}:${displayTimingSS};${displayTimingXX}`)
      : ((Number.parseInt(displayTimingHH, 10) * 60 + Number.parseInt(displayTimingMM, 10)) * 60 + Number.parseInt(displayTimingSS, 10)) + Number.parseInt(displayTimingXX, 10) / 100;
    // clearTiming (消去タイミング)
    const clearTimingHH = String.fromCharCode(page.readU8(), page.readU8());
    const clearTimingMM = String.fromCharCode(page.readU8(), page.readU8());
    const clearTimingSS = String.fromCharCode(page.readU8(), page.readU8());
    const clearTimingXX = String.fromCharCode(page.readU8(), page.readU8());
    const clearTimingALL = `${clearTimingHH}${clearTimingMM}${clearTimingSS}${clearTimingXX}`;
    page.readU8();
    const clearTiming = pageNumber === '000000' ? 0 : clearTimingALL === '        ' ? Number.POSITIVE_INFINITY : timingUnitType === 'F'
      ? timecodeToSecond(`${clearTimingHH}:${clearTimingMM}:${clearTimingSS};${clearTimingXX}`)
      : ((Number.parseInt(clearTimingHH, 10) * 60 + Number.parseInt(clearTimingMM, 10)) * 60 + Number.parseInt(clearTimingSS, 10)) + Number.parseInt(clearTimingXX, 10) / 100;
    // timeControlMode (TMD)
    const timeControlMode = String.fromCharCode(page.readU8(), page.readU8());
    switch (timeControlMode) {
      case TimeControlModeType.FREE:
      case TimeControlModeType.REALTIME:
      case TimeControlModeType.OFFSETTIME:
        break;
      default:
        throw new ViolationStandardError(`Undefined timeControlMode: ${timeControlMode}`);
    }
    // clearScreen (消去画面)
    const clearScreenValue = String.fromCharCode(page.readU8(), page.readU8(), page.readU8());
    if (clearScreenValue !== 'OFF' && clearScreenValue !== '   ') {
      throw new ViolationStandardError(`Undefined clearScreen: ${clearScreenValue}`);
    }
    const clearScreen = clearScreenValue === 'OFF';
    // displayFormat (表示書式)
    const displayFormatDensity = String.fromCharCode(page.readU8(), page.readU8());
    switch (displayFormatDensity) {
      case FormatDensityType.STANDARD:
      case FormatDensityType.DOUBLE:
      case FormatDensityType.EUROPEAN:
      case FormatDensityType.FULLHI:
      case FormatDensityType.HI:
      case FormatDensityType.HD:
      case FormatDensityType.SD:
      case FormatDensityType.MOBILE:
        break;
      default:
        throw new ViolationStandardError(`Undefined formatDensity: ${displayFormatDensity}`);
    }
    const displayFormatWritingMode = String.fromCharCode(page.readU8());
    switch (displayFormatWritingMode) {
      case FormatWritingModeType.HORIZONTAL:
      case FormatWritingModeType.VERTICAL:
        break;
      default:
        throw new ViolationStandardError(`Undefined formatWritingMode: ${displayFormatWritingMode}`);
    }
    const displayFormat = `${displayFormatDensity}${displayFormatWritingMode}` as `${(typeof FormatDensityType)[keyof typeof FormatDensityType]}${(typeof FormatWritingModeType)[keyof typeof FormatWritingModeType]}`;
    const displayAspectRatio = String.fromCharCode(page.readU8());
    switch (displayAspectRatio) {
      case DisplayAspectRatioType.HD:
      case DisplayAspectRatioType.SD:
        break;
      default:
        throw new ViolationStandardError(`Undefined displayAspectRatio: ${displayAspectRatio}`);
    }
    // displayWindowArea (ウィンドウ表示エリア)
    const displayWindowAreaSDFX = String.fromCharCode(page.readU8(), page.readU8(), page.readU8(), page.readU8());
    const displayWindowAreaSDFY = String.fromCharCode(page.readU8(), page.readU8(), page.readU8(), page.readU8());
    const displayWindowAreaSDPX = String.fromCharCode(page.readU8(), page.readU8(), page.readU8(), page.readU8());
    const displayWindowAreaSDPY = String.fromCharCode(page.readU8(), page.readU8(), page.readU8(), page.readU8());
    const displayWindowArea = (displayWindowAreaSDFX !== '    ' && displayWindowAreaSDFY !== '    ' && displayWindowAreaSDPX !== '    ' && displayWindowAreaSDPY !== '    ')
      ? [[Number.parseInt(displayWindowAreaSDFX, 10), Number.parseInt(displayWindowAreaSDFY, 10)], [Number.parseInt(displayWindowAreaSDPX, 10), Number.parseInt(displayWindowAreaSDPY, 10)]] as [[number, number], [number, number]]
      : null;
    // scrollType (スクロール)
    const scrollType = String.fromCharCode(page.readU8());
    switch (scrollType) {
      case ScrollType.FIXED:
      case ScrollType.SCROLL:
      case ScrollType.ROLLUP:
        break;
      default:
        throw new ViolationStandardError(`Undefined scrollType: ${scrollType}`);
    }
    // scrollDirectionType (スクロール方向)
    const scrollDirectionType = String.fromCharCode(page.readU8());
    switch (scrollDirectionType) {
      case ScrollDirectionType.HORIZONTAL:
      case ScrollDirectionType.VERTICAL:
        break;
      default:
        throw new ViolationStandardError(`Undefined scrollDirectionType: ${scrollDirectionType}`);
    }
    // sound (音の有無)
    const soundValue = String.fromCharCode(page.readU8());
    if (soundValue !== '*' && soundValue !== ' ') {
      throw new ViolationStandardError(`Undefined sound: ${soundValue}`);
    }
    const sound = soundValue === '*';
    // pageDataBytes (ページデータ量)
    const pageDataBytes = Number.parseInt(String.fromCharCode(page.readU8(), page.readU8(), page.readU8(), page.readU8(), page.readU8()), 10);
    // deleted (ページ削除指定)
    const deletedValue = String.fromCharCode(page.readU8(), page.readU8(), page.readU8());
    if (deletedValue !== 'ERS' && deletedValue !== '   ') {
      throw new ViolationStandardError(`Undefined deleted: ${deletedValue}`);
    }
    const deleted = deletedValue === 'ERS';
    // memo (メモ)
    const memo = textDecoder.decode(page.read(20)).trim();
    // reserved (予備)
    page.read(32);
    // completed (ページ完成マーク)
    const completedValue = String.fromCharCode(page.readU8());
    if (completedValue !== '*' && completedValue !== ' ') {
      throw new ViolationStandardError(`Undefined completed: ${completedValue}`);
    }
    const completed = completedValue === '*';
    // usersAreaUsed (ユーザーズエリア識別)
    const usersAreaUsedValue = String.fromCharCode(page.readU8());
    if (usersAreaUsedValue !== '*' && usersAreaUsedValue !== ' ') {
      throw new ViolationStandardError(`Undefined sound: ${usersAreaUsedValue}`);
    }
    const usersAreaUsed = usersAreaUsedValue === '*';
    const usersArea = usersAreaUsed ? {
      usersAreaUsed,
      writingFormatConversionMode: page.readU8(),
      drcsConversionMode: ((page.readU8() & 0xC0) >> 6)
    } : { usersAreaUsed };

    const pageManagementInformationBase = {
      pageMaterialType,
      displayTimingType,
      timingUnitType,
      displayTiming,
      clearTiming,
      timeControlMode,
      clearScreen,
      displayFormat,
      displayAspectRatio,
      displayWindowArea,
      scrollType,
      scrollDirectionType,
      sound,
      pageDataBytes,
      deleted,
      memo,
      completed,
    };

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
        ... pageManagementInformationBase,
        ... usersArea,
        pageNumber,
        tag: 'ReservedPage',
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
      ... pageManagementInformationBase,
      ... usersArea,
      tag: 'ActualPage',
      pageNumber,
      management,
      statement
    });
  }

  return {
    label,
    pages
  };
}

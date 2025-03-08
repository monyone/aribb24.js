import { ByteStream } from "../../../util/bytestream"
import { ViolationStandardError } from "../../../util/error";
import { timecodeToSecond } from "../../../util/timecode";
import { ARIBB24CaptionManagement, ARIBB24CaptionStatement } from "../b24/datagroup";
import datagroup from "../b36/datagroup"

// Program/Page
export const TimingUnitType = {
  TIME: 'T',
  FRAME: 'F',
} as const;
export const TimeControlModeType = {
  FREE: 'FR',
  REALTIME: 'RT',
  OFFSETTIME: 'OF',
} as const;

// Program
export const ProgramMaterialType = {
  PROGRAM: '0',
  CM: '1',
  CONTENTS: '2',
  SOUND: '3',
} as const;
export const RegistrationModeType = {
  NEW: 'N',
  RENEW: 'R',
  ADDITION: 'A',
  NOT_SPECIFIED: ' ',
} as const;
export const displayModeType = {
  AUTO_ENABLED: '0',
  AUTO_DISABLED: '1',
  SELECT: '2',
  SELECT_SPECIFIC: '3',
} as const;
export const ProgramType = {
  INDEPENDENT: ' ',
  COMPLEMENT: 'T',
  CAPTION: 'C',
} as const;
export const RealtimeTimingType = {
  CONTINUOUS_TIMECODE: 'TC',
  UNCONTINUOUS_TIMECODE: 'TU',
  LAPTIME: 'LT',
  JST: 'JS',
} as const;
export const SyncronizationModeType = {
  ASYNC: 'A',
  PROGRAM_SYNC: 'P',
  TIME_SYNC: 'T',
} as const;

export type ARIBB36ProgramManagementInformation = {
  broadcasterIdentification: string;
  materialNumber: string;
  programTitle: string;
  programSubtitle: string;
  programMaterialType: (typeof ProgramMaterialType)[keyof typeof ProgramMaterialType];
  registrationMode: (typeof RegistrationModeType)[keyof typeof RegistrationModeType];
  languageCode: string;
  displayMode: `${(typeof displayModeType)[keyof typeof displayModeType]}${(typeof displayModeType)[keyof typeof displayModeType]}`;
  programType: (typeof ProgramType)[keyof typeof ProgramType];
  sound: boolean;
  totalPages: number;
  totalBytes: number;
  untime: boolean;
  realtimeTimingType: (typeof RealtimeTimingType)[keyof typeof RealtimeTimingType];
  timingUnitType: (typeof TimingUnitType)[keyof typeof TimingUnitType];
  initialTime: number;
  syncronizationMode: (typeof SyncronizationModeType)[keyof typeof SyncronizationModeType];
  timeControlMode: (typeof TimeControlModeType)[keyof typeof TimeControlModeType];
  extensible: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  compatible: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  expireDate: [number, number, number] | null;
  author: string;
  creationDateTime: [number, number, number, number, number] | null;
  broadcastStartDate: [number, number, number] | null;
  broadcastEndDate: [number, number, number] | null;
  broadcastDaysOfWeek: [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  broadcastStartTime: [number, number, number] | null;
  broadcastEndTime: [number, number, number] | null;
  memo: string;
  completed: boolean;
} & ({
  usersAreaUsed: false
} | {
  usersAreaUsed: true,
  writingFormatConversionMode: number;
  drcsConversionMode: number;
});;

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

export type ARIBB36PageManagementInformation = {
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

export type ARIBB36PageData = ARIBB36PageManagementInformation & ({
  tag: 'ActualPage'
  management: ARIBB24CaptionManagement;
  statement: ARIBB24CaptionStatement;
} | {
  tag: 'ReservedPage'
  pageNumber: '000000';
  management: ARIBB24CaptionManagement;
});

export type ARIBB36Data = ARIBB36ProgramManagementInformation & {
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
  const LI = stream.readU32();
  // Program Management Data (番組管理情報)
  const program = new ByteStream(stream.read(Math.floor((4 + LI + (block - 1)) / block) * block - 4));
  // broadcasterIdentification (制作局表示)
  const broadcasterIdentification = decoder.decode(program.read(6)).trim();
  // materialNumber (素材ナンバー)
  const materialNumber = decoder.decode(program.read(27)).trim();
  // programTitle (番組タイトル)
  const programTitle = decoder.decode(program.read(40)).trim();
  // programSubtitle (番組サブタイトル)
  const programSubtitle = decoder.decode(program.read(40)).trim();
  // programMaterialType (素材種別)
  const programMaterialType = String.fromCharCode(program.readU8());
  switch (programMaterialType) {
    case ProgramMaterialType.PROGRAM:
    case ProgramMaterialType.CM:
    case ProgramMaterialType.CONTENTS:
    case ProgramMaterialType.SOUND:
      break;
    default:
      throw new ViolationStandardError(`Undefined programMaterialType: ${programMaterialType}`);
  }
  // registrationType (登録モード)
  const registrationMode = String.fromCharCode(program.readU8());
  switch (registrationMode) {
    case RegistrationModeType.NEW:
    case RegistrationModeType.RENEW:
    case RegistrationModeType.ADDITION:
    case RegistrationModeType.NOT_SPECIFIED:
      break;
    default:
      throw new ViolationStandardError(`Undefined registrationMode: ${registrationMode}`);
  }
  // languageCode (言語コード)
  const languageCode = decoder.decode(program.read(3));
  // displayMode (DMF受信表示)
  const receptionDisplayMode = String.fromCharCode(program.readU8());
  switch (receptionDisplayMode) {
    case displayModeType.AUTO_ENABLED:
    case displayModeType.AUTO_DISABLED:
    case displayModeType.SELECT:
    case displayModeType.SELECT_SPECIFIC:
      break;
    default:
      throw new ViolationStandardError(`Undefined displayMode: ${receptionDisplayMode}`);
  }
  const recordingDisplayMode = String.fromCharCode(program.readU8());
  switch (recordingDisplayMode) {
    case displayModeType.AUTO_ENABLED:
    case displayModeType.AUTO_DISABLED:
    case displayModeType.SELECT:
    case displayModeType.SELECT_SPECIFIC:
      break;
    default:
      throw new ViolationStandardError(`Undefined displayMode: ${recordingDisplayMode}`);
  }
  const displayMode = `${receptionDisplayMode}${recordingDisplayMode}` as `${(typeof displayModeType)[keyof typeof displayModeType]}${(typeof displayModeType)[keyof typeof displayModeType]}`;
  // programType (独立/補完/字幕)
  const programType = String.fromCharCode(program.readU8());
  switch (programType) {
    case ProgramType.INDEPENDENT:
    case ProgramType.COMPLEMENT:
    case ProgramType.CAPTION:
      break;
    default:
      throw new ViolationStandardError(`Undefined programType: ${programType}`);
  }
  // sound (音の有無)
  const soundValue = String.fromCharCode(program.readU8());
  if (soundValue !== '*' && soundValue !== ' ') {
    throw new ViolationStandardError(`Undefined sound: ${soundValue}`);
  }
  const sound = soundValue === '*';
  // totalPages (総ページ数)
  const totalPages = Number.parseInt(String.fromCharCode(program.readU8(), program.readU8(), program.readU8(), program.readU8()), 10);
  // totalBytes (番組データ量)
  const totalBytes = Number.parseInt(String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
  ), 10);
  // untime (アンタイムの有無)
  const untimeValue = String.fromCharCode(program.readU8());
  if (soundValue !== '*' && soundValue !== ' ') {
    throw new ViolationStandardError(`Undefined sound: ${soundValue}`);
  }
  const untime = untimeValue === '*';
  // realtimeTimingType (RTタイミング種別)
  const realtimeTimingType = String.fromCharCode(program.readU8(), program.readU8());
  switch (realtimeTimingType) {
    case RealtimeTimingType.CONTINUOUS_TIMECODE:
    case RealtimeTimingType.UNCONTINUOUS_TIMECODE:
    case RealtimeTimingType.LAPTIME:
    case RealtimeTimingType.JST:
      break;
    default:
      throw new ViolationStandardError(`Undefined realtimeTimingType: ${realtimeTimingType}`);
  }
  // timingUnitType (タイミング単位指定)
  const timingUnitType = String.fromCharCode(program.readU8());
  switch (timingUnitType) {
    case TimingUnitType.TIME:
    case TimingUnitType.FRAME:
      break;
    default:
      throw new ViolationStandardError(`Undefined TimingUnitType: ${timingUnitType}`);
  }
  // initialTime (イニシャルタイム)
  const initialTimeHH = String.fromCharCode(program.readU8(), program.readU8());
  const initialTimeMM = String.fromCharCode(program.readU8(), program.readU8());
  const initialTimeSS = String.fromCharCode(program.readU8(), program.readU8());
  const initialTimeXX = String.fromCharCode(program.readU8(), program.readU8());
  program.readU8();
  const initialTime = timingUnitType === 'F'
    ? timecodeToSecond(`${initialTimeHH}:${initialTimeMM}:${initialTimeSS};${initialTimeXX}`)
    : ((Number.parseInt(initialTimeHH, 10) * 60 + Number.parseInt(initialTimeMM, 10)) * 60 + Number.parseInt(initialTimeSS, 10)) + Number.parseInt(initialTimeXX, 10) / 100;
  // syncronizationMode (同期モード)
  const syncronizationMode = String.fromCharCode(program.readU8());
  switch (syncronizationMode) {
    case SyncronizationModeType.ASYNC:
    case SyncronizationModeType.PROGRAM_SYNC:
    case SyncronizationModeType.TIME_SYNC:
      break;
    default:
      throw new ViolationStandardError(`Undefined syncronizationMode: ${syncronizationMode}`);
  }
  // timeControlMode (TMD)
  const timeControlMode = String.fromCharCode(program.readU8(), program.readU8());
  switch (timeControlMode) {
    case TimeControlModeType.FREE:
    case TimeControlModeType.REALTIME:
    case TimeControlModeType.OFFSETTIME:
      break;
    default:
      throw new ViolationStandardError(`Undefined timeControlMode: ${timeControlMode}`);
  }
  // extensible (拡張性)
  const extensibleValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8(), program.readU8()
  );
  if (/[^* ]/.test(extensibleValue)) {
    throw new ViolationStandardError(`Undefined extensible: ${extensibleValue}`);
  }
  const extensible = [
    extensibleValue[0] === '*',
    extensibleValue[1] === '*',
    extensibleValue[2] === '*',
    extensibleValue[3] === '*',
    extensibleValue[4] === '*',
    extensibleValue[5] === '*',
    extensibleValue[6] === '*',
    extensibleValue[7] === '*',
  ] as [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  // compatible (対応可能映像)
  const compatibleValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8(), program.readU8()
  );
  if (/[^* ]/.test(compatibleValue)) {
    throw new ViolationStandardError(`Undefined extensible: ${compatibleValue}`);
  }
  const compatible = [
    compatibleValue[0] === '*',
    compatibleValue[1] === '*',
    compatibleValue[2] === '*',
    compatibleValue[3] === '*',
    compatibleValue[4] === '*',
    compatibleValue[5] === '*',
    compatibleValue[6] === '*',
    compatibleValue[7] === '*',
  ] as [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  // expireDate (有効期限)
  const expireDateValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8(), program.readU8()
  );
  const expireDate = expireDateValue !== '        '
    ?
      [
        Number.parseInt(expireDateValue.slice(0, 4), 10),
        Number.parseInt(expireDateValue.slice(4, 6), 10),
        Number.parseInt(expireDateValue.slice(6, 8), 10),
      ] as [number, number, number]
    : null;
  // author (作成者/作成担当機関)
  const author = decoder.decode(program.read(20)).trim();
  // creationDateTime (作成年月日時分)
  const creationDateTimeValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(),
    program.readU8(), program.readU8(),
    program.readU8(), program.readU8(),
    program.readU8(), program.readU8()
  );
  const creationDateTime = creationDateTimeValue !== '            '
    ?
      [
        Number.parseInt(creationDateTimeValue.slice(0, 4), 10),
        Number.parseInt(creationDateTimeValue.slice(4, 6), 10),
        Number.parseInt(creationDateTimeValue.slice(6, 8), 10),
        Number.parseInt(creationDateTimeValue.slice(8, 10), 10),
        Number.parseInt(creationDateTimeValue.slice(10, 12), 10),
      ] as [number, number, number, number, number]
    : null;
  // broadcastStartDate (放送日)
  const broadcastStartDateValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8(), program.readU8()
  );
  const broadcastStartDate = broadcastStartDateValue !== '        '
    ? [
        Number.parseInt(broadcastStartDateValue.slice(0, 4), 10),
        Number.parseInt(broadcastStartDateValue.slice(4, 6), 10),
        Number.parseInt(broadcastStartDateValue.slice(6, 8), 10),
      ] as [number, number, number]
    : null;
  // broadcastEndDate (放送日)
  const broadcastEndDateValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8(), program.readU8()
  );
  const broadcastEndDate = broadcastEndDateValue !== '        '
    ? [
        Number.parseInt(broadcastEndDateValue.slice(0, 4), 10),
        Number.parseInt(broadcastEndDateValue.slice(4, 6), 10),
        Number.parseInt(broadcastEndDateValue.slice(6, 8), 10),
      ] as [number, number, number]
    : null;
  // broadcastDaysOfWeek (放送曜日)
  const broadcastDaysOfWeekValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8()
  );
  if (/[^* ]/.test(broadcastDaysOfWeekValue)) {
    throw new ViolationStandardError(`Undefined broadcastDaysOfWeek: ${broadcastDaysOfWeekValue}`);
  }
  const broadcastDaysOfWeek = [
    broadcastDaysOfWeekValue[0] === '*',
    broadcastDaysOfWeekValue[1] === '*',
    broadcastDaysOfWeekValue[2] === '*',
    broadcastDaysOfWeekValue[3] === '*',
    broadcastDaysOfWeekValue[4] === '*',
    broadcastDaysOfWeekValue[5] === '*',
    broadcastDaysOfWeekValue[6] === '*',
  ] as [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  // broadcastStartTime (放送時間枠)
  const broadcastStartTimeValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8()
  );
  const broadcastStartTime = broadcastStartTimeValue !== '      '
    ? [
        Number.parseInt(broadcastStartTimeValue.slice(0, 2), 10),
        Number.parseInt(broadcastStartTimeValue.slice(2, 4), 10),
        Number.parseInt(broadcastStartTimeValue.slice(4, 6), 10),
      ] as [number, number, number]
    : null;
  // broadcastEndTime (放送時間枠)
  const broadcastStartEndValue = String.fromCharCode(
    program.readU8(), program.readU8(), program.readU8(),
    program.readU8(), program.readU8(), program.readU8()
  );
  const broadcastEndTime = broadcastStartEndValue !== '      '
    ? [
        Number.parseInt(broadcastStartEndValue.slice(0, 2), 10),
        Number.parseInt(broadcastStartEndValue.slice(2, 4), 10),
        Number.parseInt(broadcastStartEndValue.slice(4, 6), 10),
      ] as [number, number, number]
    : null;
  // memo (メモ)
  const memo = decoder.decode(program.read(60)).trim();
  // reserved (予備)
  program.read(45);
  // completed (完成マーク)
  const completedValue = String.fromCharCode(program.readU8());
  if (completedValue !== '*' && completedValue !== ' ') {
    throw new ViolationStandardError(`Undefined completed: ${completedValue}`);
  }
  const completed = completedValue === '*';
  // usersAreaUsed (ユーザーズエリア識別)
  const usersAreaUsedValue = String.fromCharCode(program.readU8());
  if (usersAreaUsedValue !== '*' && usersAreaUsedValue !== ' ') {
    throw new ViolationStandardError(`Undefined usersAreaUsed: ${usersAreaUsedValue}`);
  }
  const usersAreaUsed = usersAreaUsedValue === '*';
  const usersArea = usersAreaUsed ? {
    usersAreaUsed,
    writingFormatConversionMode: program.readU8(),
    drcsConversionMode: ((program.readU8() & 0xC0) >> 6)
  } : { usersAreaUsed };

  // Program Page Information
  const pages: ARIBB36PageData[] = [];
  while (!stream.isEmpty()) {
    const LI = stream.readU32();
    const buffer = stream.read(Math.floor((4 + LI + (block - 1)) / block) * block - 4)
    const data = new DataView(buffer.slice(0, 4 + LI));

    // Page Management Data (ページ管理情報)
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
    const displayTiming = timingUnitType === 'F'
      ? timecodeToSecond(`${displayTimingHH}:${displayTimingMM}:${displayTimingSS};${displayTimingXX}`)
      : ((Number.parseInt(displayTimingHH, 10) * 60 + Number.parseInt(displayTimingMM, 10)) * 60 + Number.parseInt(displayTimingSS, 10)) + Number.parseInt(displayTimingXX, 10) / 100;
    // clearTiming (消去タイミング)
    const clearTimingHH = String.fromCharCode(page.readU8(), page.readU8());
    const clearTimingMM = String.fromCharCode(page.readU8(), page.readU8());
    const clearTimingSS = String.fromCharCode(page.readU8(), page.readU8());
    const clearTimingXX = String.fromCharCode(page.readU8(), page.readU8());
    const clearTimingALL = `${clearTimingHH}${clearTimingMM}${clearTimingSS}${clearTimingXX}`;
    page.readU8();
    const clearTiming = clearTimingALL === '        ' ? Number.POSITIVE_INFINITY : timingUnitType === 'F'
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
    const memo = decoder.decode(page.read(20)).trim();
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
    const management = datagroup(data.buffer.slice(begin, begin + DL1));
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
    const statement = datagroup(data.buffer.slice(begin, begin + DL2));
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
    broadcasterIdentification,
    materialNumber,
    programTitle,
    programSubtitle,
    programMaterialType,
    registrationMode,
    languageCode,
    displayMode,
    programType,
    sound,
    totalPages,
    totalBytes,
    untime,
    realtimeTimingType,
    timingUnitType,
    initialTime,
    syncronizationMode,
    timeControlMode,
    extensible,
    compatible,
    expireDate,
    author,
    creationDateTime,
    broadcastStartDate,
    broadcastEndDate,
    broadcastDaysOfWeek,
    broadcastStartTime,
    broadcastEndTime,
    memo,
    completed,
    ... usersArea,
    pages
  };
}

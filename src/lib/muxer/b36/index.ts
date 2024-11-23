import { ARIBB36Data, DisplayTimingType, TimingUnitType } from "../../demuxer/b36";
import muxDataGroup from "../../muxer/b24/datagroup";
import ARIBB24Encoder from "../../encoder/b24/encoder";
import concat from "../../../util/concat";
import { ByteBuilder } from "../../../util/bytebuilder";
import { secondsToTimecode } from "../../../util/timecode";
import { ViolationStandardError } from "../../../util/error";

const textDecoder = new TextDecoder('shift-jis', { fatal: true });
const toShiftJIS = new Map<string, [number] | [number, number]>();
// 1 bytes
for (let i = 0x00; i <= 0x7E; i++) {
  const array: [number] = [i];
  const bytes = Uint8Array.from(array);
  try {
    toShiftJIS.set(textDecoder.decode(bytes), array);
  } catch (e) {}
}
// 2 bytes
for (const [begin, end] of [[0x81, 0x9F], [0xE0, 0xEF]]) {
  for (let i = begin; i < end; i++) {
    for (let j = 0x40; j <= 0x7e; j++) {
      const array: [number, number] = [i, j];
      const bytes = Uint8Array.from(array);
      try {
        toShiftJIS.set(textDecoder.decode(bytes), array);
      } catch (e) {}
    }
    for (let j = 0x80; j <= 0xfc; j++) {
      const array: [number, number] = [i, j];
      const bytes = Uint8Array.from(array);
      try {
        toShiftJIS.set(textDecoder.decode(bytes), array);
      } catch (e) {}
    }
  }
}

export default (b36: ARIBB36Data): ArrayBuffer => {
  const block = 256;
  const builder = new ByteBuilder();

  // first page
  for (let i = 0; i < b36.label.length; i++) {
    builder.writeU8(b36.label.charCodeAt(i));
  }
  for (let i = b36.label.length; i < block; i++) {
    builder.writeU8(0x20);
  }

  // program information
  const programInformationBuilder = new ByteBuilder();
  {
    // 制作局表示
    {
      const codes = Array.from(b36.broadcasterIdentification);
      const isInvalid = codes.some((code) => !toShiftJIS.has(code));
      if (isInvalid) { throw new ViolationStandardError('broadcasterIdentification cannot convert to shift-jis'); }
      const converted = codes.flatMap((code) => toShiftJIS.get(code)!).slice(0, 6);
      while (converted.length < 6) { converted.push(' '.charCodeAt(0)); }
      programInformationBuilder.write(Uint8Array.from(converted).buffer);
    }
    // materialNumber (素材ナンバー)
    {
      const codes = Array.from(b36.materialNumber);
      const isInvalid = codes.some((code) => !toShiftJIS.has(code));
      if (isInvalid) { throw new ViolationStandardError('materialNumber cannot convert to shift-jis'); }
      const converted = codes.flatMap((code) => toShiftJIS.get(code)!).slice(0, 27);
      while (converted.length < 27) { converted.push(' '.charCodeAt(0)); }
      programInformationBuilder.write(Uint8Array.from(converted).buffer);
    }
    // programSubtitle (番組タイトル)
    {
      const codes = Array.from(b36.programTitle);
      const isInvalid = codes.some((code) => !toShiftJIS.has(code));
      if (isInvalid) { throw new ViolationStandardError('programTitle cannot convert to shift-jis'); }
      const converted = codes.flatMap((code) => toShiftJIS.get(code)!).slice(0, 40);
      while (converted.length < 40) { converted.push(' '.charCodeAt(0)); }
      programInformationBuilder.write(Uint8Array.from(converted).buffer);
    }
    // programSubtitle (番組サブタイトル)
    {
      const codes = Array.from(b36.programSubtitle);
      const isInvalid = codes.some((code) => !toShiftJIS.has(code));
      if (isInvalid) { throw new ViolationStandardError('programSubtitle cannot convert to shift-jis'); }
      const converted = codes.flatMap((code) => toShiftJIS.get(code)!).slice(0, 40);
      while (converted.length < 40) { converted.push(' '.charCodeAt(0)); }
      programInformationBuilder.write(Uint8Array.from(converted).buffer);
    }
    // rogramMaterialType (素材種別)
    programInformationBuilder.writeU8(b36.programMaterialType.charCodeAt(0));
    // registrationType (登録モード)
    programInformationBuilder.writeU8(b36.registrationMode.charCodeAt(0))
    // languageCode (言語コード)
    for (let i = 0; i < 3; i++) {
      programInformationBuilder.writeU8(b36.languageCode.charCodeAt(i))
    }
    // displayMode (DMF受信表示)
    for (let i = 0; i < 2; i++) {
      programInformationBuilder.writeU8(b36.displayMode.charCodeAt(i));
    }
    // programType (独立/補完/字幕)
    programInformationBuilder.writeU8(b36.programType.charCodeAt(0));
    // sound (音の有無)
    programInformationBuilder.writeU8((b36.sound ? '*' : ' ').charCodeAt(0));
    // totalPages (総ページ数)
    {
      const totalPages = b36.totalPages.toString(10).padStart(4, '0');
      for (let i = 0; i < 4; i++) {
        programInformationBuilder.writeU8(totalPages.charCodeAt(i))
      }
    }
    // totalBytes (番組データ量)
    {
      const totalBytes = b36.totalBytes.toString(10).padStart(8, '0');
      for (let i = 0; i < 8; i++) {
        programInformationBuilder.writeU8(totalBytes.charCodeAt(i))
      }
    }
    // untime (アンタイムの有無)
    programInformationBuilder.writeU8((b36.untime ? '*' : ' ').charCodeAt(0));
    // realtimeTimingType (RTタイミング種別)
    for (let i = 0; i < 2; i++) {
      programInformationBuilder.writeU8(b36.realtimeTimingType.charCodeAt(i));
    }
    // timingUnitType (タイミング単位指定)
    programInformationBuilder.writeU8(b36.timingUnitType.charCodeAt(0));
    // initialTime (イニシャルタイム)
    switch (b36.timingUnitType) {
      case TimingUnitType.FRAME: {
        const value = secondsToTimecode(b36.initialTime).replaceAll(/[:;]/g, '');
        for (let i = 0; i < 8; i++) {
          programInformationBuilder.writeU8(value.charCodeAt(i));
        }
        programInformationBuilder.writeU8('F'.charCodeAt(0));
        break;
      }
      case TimingUnitType.TIME: {
        const XX = Math.ceil(b36.initialTime * 100) % 100;
        const SS = Math.floor(b36.initialTime) % 60;
        const MM = Math.floor((b36.initialTime - SS) / 60) % 60;
        const HH = Math.floor((b36.initialTime - SS - MM * 60) / 3600);
        const HHMMSSXX = `${HH.toString(10).padStart(2, '0')}${MM.toString(10).padStart(2, '0')}${SS.toString(10).padStart(2, '0')}${XX.toString(10).padStart(2, '0')}`;
        console.log(HHMMSSXX)
        for (let i = 0; i < 8; i++) {
          programInformationBuilder.writeU8(HHMMSSXX.charCodeAt(i));
        }
        programInformationBuilder.writeU8('0'.charCodeAt(0));
        break;
      }
    }
    // syncronizationMode (同期モード)
    programInformationBuilder.writeU8(b36.syncronizationMode.charCodeAt(0));
    // timeControlMode (TMD)
    for (let i = 0; i < 2; i++) {
      programInformationBuilder.writeU8(b36.timeControlMode.charCodeAt(i));
    }
    // extensible (拡張性)
    for (let i = 0; i < 8; i++) {
      programInformationBuilder.writeU8((b36.extensible[i] ? '*' : ' ').charCodeAt(0));
    }
    // compatible (拡張性)
    for (let i = 0; i < 8; i++) {
      programInformationBuilder.writeU8((b36.compatible[i] ? '*' : ' ').charCodeAt(0));
    }
    // expireDate (有効期限)
    {
      const year = b36.expireDate[0].toString(10).padStart(4, '0');
      const month = b36.expireDate[1].toString(10).padStart(2, '0');
      const day = b36.expireDate[2].toString(10).padStart(2, '0');
      const expireDate = `${year}${month}${day}`;
      for (let i = 0; i < 8; i++) {
        programInformationBuilder.writeU8(expireDate.charCodeAt(i));
      }
    }
    // author (作成者/作成担当機関)
    {
      const codes = Array.from(b36.author);
      const isInvalid = codes.some((code) => !toShiftJIS.has(code));
      if (isInvalid) { throw new ViolationStandardError('memo cannot convert to shift-jis'); }
      const converted = codes.flatMap((code) => toShiftJIS.get(code)!).slice(0, 20);
      while (converted.length < 20) { converted.push(' '.charCodeAt(0)); }
      programInformationBuilder.write(Uint8Array.from(converted).buffer);
    }
    // creationDateTime (作成年月日時分)
    {
      const year = b36.creationDateTime[0].toString(10).padStart(4, '0');
      const month = b36.creationDateTime[1].toString(10).padStart(2, '0');
      const day = b36.creationDateTime[2].toString(10).padStart(2, '0');
      const hour = b36.creationDateTime[3].toString(10).padStart(2, '0');
      const minute = b36.creationDateTime[4].toString(10).padStart(2, '0');
      const creationDateTime = `${year}${month}${day}${hour}${minute}`;
      for (let i = 0; i < 12; i++) {
        programInformationBuilder.writeU8(creationDateTime.charCodeAt(i));
      }
    }
    // broadcastStartDate (放送日)
    {
      const year = b36.broadcastStartDate[0].toString(10).padStart(4, '0');
      const month = b36.broadcastStartDate[1].toString(10).padStart(2, '0');
      const day = b36.broadcastStartDate[2].toString(10).padStart(2, '0');
      const broadcastStartDate = `${year}${month}${day}`;
      for (let i = 0; i < 8; i++) {
        programInformationBuilder.writeU8(broadcastStartDate.charCodeAt(i));
      }
    }
    // broadcastEndDate (放送日)
    if (b36.broadcastEndDate != null) {
      const year = b36.broadcastEndDate[0].toString(10).padStart(4, '0');
      const month = b36.broadcastEndDate[1].toString(10).padStart(2, '0');
      const day = b36.broadcastEndDate[2].toString(10).padStart(2, '0');
      const broadcastEndDate = `${year}${month}${day}`;
      for (let i = 0; i < 8; i++) {
        programInformationBuilder.writeU8(broadcastEndDate.charCodeAt(i));
      }
    } else {
      for (let i = 0; i < 8; i++) {
        programInformationBuilder.writeU8(' '.charCodeAt(0));
      }
    }
    // broadcastDaysOfWeek (放送曜日)
    for (let i = 0; i < 7; i++) {
      programInformationBuilder.writeU8((b36.broadcastDaysOfWeek[i] ? '*' : ' ').charCodeAt(0));
    }
    // broadcastStartTime (放送時間枠)
    if (b36.broadcastStartTime != null) {
      const hour = b36.broadcastStartTime[0].toString(10).padStart(2, '0');
      const minute = b36.broadcastStartTime[1].toString(10).padStart(2, '0');
      const second = b36.broadcastStartTime[2].toString(10).padStart(2, '0');
      const broadcastStartTime = `${hour}${minute}${second}`;
      for (let i = 0; i < 6; i++) {
        programInformationBuilder.writeU8(broadcastStartTime.charCodeAt(i));
      }
    } else {
      for (let i = 0; i < 6; i++) {
        programInformationBuilder.writeU8(' '.charCodeAt(0));
      }
    }
    // broadcastStartTime (放送時間枠)
    if (b36.broadcastEndTime != null) {
      const hour = b36.broadcastEndTime[0].toString(10).padStart(2, '0');
      const minute = b36.broadcastEndTime[1].toString(10).padStart(2, '0');
      const second = b36.broadcastEndTime[2].toString(10).padStart(2, '0');
      const broadcastEndTime = `${hour}${minute}${second}`;
      for (let i = 0; i < 6; i++) {
        programInformationBuilder.writeU8(broadcastEndTime.charCodeAt(i));
      }
    } else {
      for (let i = 0; i < 6; i++) {
        programInformationBuilder.writeU8(' '.charCodeAt(0));
      }
    }
    // memo (メモ)
    {
      const codes = Array.from(b36.memo);
      const isInvalid = codes.some((code) => !toShiftJIS.has(code));
      if (isInvalid) { throw new ViolationStandardError('memo cannot convert to shift-jis'); }
      const converted = codes.flatMap((code) => toShiftJIS.get(code)!).slice(0, 60);
      while (converted.length < 60) { converted.push(' '.charCodeAt(0)); }
      programInformationBuilder.write(Uint8Array.from(converted).buffer);
    }
    // reserved (予備)
    for (let i = 0; i < 45; i++) {
      programInformationBuilder.writeU8(' '.charCodeAt(0))
    }
    // completed (完成マーク)
    programInformationBuilder.writeU8((b36.completed ? '*' : ' ').charCodeAt(0));
    // usersAreaUsed (ユーザーズエリア識別)
    programInformationBuilder.writeU8((b36.usersAreaUsed ? '*' : ' ').charCodeAt(0))
    if (b36.usersAreaUsed) {
      programInformationBuilder.writeU8(b36.writingFormatConversionMode);
      programInformationBuilder.writeU8(b36.drcsConversionMode << 6 | 0x3F);
    }
  }

  const programInformation =programInformationBuilder.build()
  builder.writeU32(programInformation.byteLength);
  builder.write(programInformation);
  builder.write(new ArrayBuffer(Math.floor((4 + programInformation.byteLength + (block - 1)) / block) * block - (4 + programInformation.byteLength)));

  // page information
  for (const page of b36.pages) {
    const pageInformationBuilder = new ByteBuilder();
    {
      // pageNumber (ページナンバー/ページコード)
      for (let i = 0; i < 6; i++) {
        pageInformationBuilder.writeU8(page.pageNumber.charCodeAt(i))
      }
      // pageMaterialType (ページ素材種別)
      pageInformationBuilder.writeU8(page.pageMaterialType.charCodeAt(0));
      // displayTimingType (送出タイミング種別)
      for (let i = 0; i < 2; i++) {
        pageInformationBuilder.writeU8(page.displayTimingType.charCodeAt(i))
      }
      // timingUnitType (タイミング単位指定)
      for (let i = 0; i < 1; i++) {
        pageInformationBuilder.writeU8(page.timingUnitType.charCodeAt(i))
      }
      // displayTiming (送出タイミング)
      switch (page.timingUnitType) {
        case TimingUnitType.FRAME: {
          const value = secondsToTimecode(page.displayTiming).replaceAll(/[:;]/g, '');
          for (let i = 0; i < 8; i++) {
            pageInformationBuilder.writeU8(value.charCodeAt(i));
          }
          pageInformationBuilder.writeU8('F'.charCodeAt(0));
          break;
        }
        case TimingUnitType.TIME: {
          const XX = Math.ceil(b36.initialTime * 100) % 100;
          const SS = Math.floor(b36.initialTime) % 60;
          const MM = Math.floor((b36.initialTime - SS) / 60) % 60;
          const HH = Math.floor((b36.initialTime - SS - MM * 60) / 3600);
          const HHMMSSXX = `${HH.toString(10).padStart(2, '0')}${MM.toString(10).padStart(2, '0')}${SS.toString(10).padStart(2, '0')}${XX.toString(10).padStart(2, '0')}`;
          for (let i = 0; i < 8; i++) {
            pageInformationBuilder.writeU8(HHMMSSXX.charCodeAt(i));
          }
          pageInformationBuilder.writeU8('0'.charCodeAt(0));
          break;
        }
      }
      // clearTiming (消去タイミング)
      if (page.clearTiming === Number.POSITIVE_INFINITY) {
        for (let i = 0; i < 9; i++) {
          pageInformationBuilder.writeU8(' '.charCodeAt(0));
        }
      } else {
        switch (page.timingUnitType) {
          case TimingUnitType.FRAME: {
            const value = secondsToTimecode(page.clearTiming).replaceAll(/[:;]/g, '');
            for (let i = 0; i < 8; i++) {
              pageInformationBuilder.writeU8(value.charCodeAt(i));
            }
            pageInformationBuilder.writeU8('F'.charCodeAt(0));
            break;
          }
          case TimingUnitType.TIME: {
            const XX = Math.ceil(b36.initialTime * 100) % 100;
            const SS = Math.floor(b36.initialTime) % 60;
            const MM = Math.floor((b36.initialTime - SS) / 60) % 60;
            const HH = Math.floor((b36.initialTime - SS - MM * 60) / 3600);
            const HHMMSSXX = `${HH.toString(10).padStart(2, '0')}${MM.toString(10).padStart(2, '0')}${SS.toString(10).padStart(2, '0')}${XX.toString(10).padStart(2, '0')}`;
            for (let i = 0; i < 8; i++) {
              pageInformationBuilder.writeU8(HHMMSSXX.charCodeAt(i));
            }
            pageInformationBuilder.writeU8('0'.charCodeAt(0));
            break;
          }
        }
      }
      // timeControlMode (TMD)
      for (let i = 0; i < 2; i++) {
        pageInformationBuilder.writeU8(page.timeControlMode.charCodeAt(i))
      }
      // clearScreen (消去画面)
      for (let i = 0; i < 3; i++) {
        pageInformationBuilder.writeU8((page.clearScreen ? 'OFF' : '   ').charCodeAt(i))
      }
      // displayFormat (表示書式)
      for (let i = 0; i < 3; i++) {
        pageInformationBuilder.writeU8((page.displayFormat).charCodeAt(i))
      }
      // displayAspectRatio (表示映像有効比)
      for (let i = 0; i < 1; i++) {
        pageInformationBuilder.writeU8((page.displayAspectRatio).charCodeAt(i))
      }
      // displayWindowArea (ウィンドウ表示エリア)
      if (page.displayWindowArea == null) {
        for (let i = 0; i < 16; i++) {
          pageInformationBuilder.writeU8(' '.charCodeAt(0))
        }
      } else {
        const displayWindowAreaSDFX = page.displayWindowArea[0][0].toString(10).padStart(4, '0');
        const displayWindowAreaSDFY = page.displayWindowArea[0][1].toString(10).padStart(4, '0');
        const displayWindowAreaSDPX = page.displayWindowArea[1][0].toString(10).padStart(4, '0');
        const displayWindowAreaSDPY = page.displayWindowArea[1][1].toString(10).padStart(4, '0');
        for (let i = 0; i < 4; i++) {
          pageInformationBuilder.writeU8(displayWindowAreaSDFX.charCodeAt(i));
        }
        for (let i = 0; i < 4; i++) {
          pageInformationBuilder.writeU8(displayWindowAreaSDFY.charCodeAt(i));
        }
        for (let i = 0; i < 4; i++) {
          pageInformationBuilder.writeU8(displayWindowAreaSDPX.charCodeAt(i));
        }
        for (let i = 0; i < 4; i++) {
          pageInformationBuilder.writeU8(displayWindowAreaSDPY.charCodeAt(i));
        }
      }
      // scrollType (スクロール)
      pageInformationBuilder.writeU8((page.scrollType).charCodeAt(0))
      // scrollDirectionType (スクロール方向)
      pageInformationBuilder.writeU8((page.scrollDirectionType).charCodeAt(0))
      // sound (音の有無)
      pageInformationBuilder.writeU8((page.sound ? '*' : ' ').charCodeAt(0))
      // pageDataBytes (ページデータ量)
      {
        const pageDataBytes = page.pageDataBytes.toString(10).padStart(5, '0');
        for (let i = 0; i < 5; i++) {
          pageInformationBuilder.writeU8(pageDataBytes.charCodeAt(i))
        }
      }
      // deleted (ページ削除指定)
      for (let i = 0; i < 3; i++) {
        pageInformationBuilder.writeU8((page.deleted ? 'ERS' : '   ').charCodeAt(i))
      }
      // memo (メモ)
      {
        const codes = Array.from(page.memo);
        const isInvalid = codes.some((code) => !toShiftJIS.has(code));
        if (isInvalid) { throw new ViolationStandardError('memo cannot convert to shift-jis'); }
        const converted = codes.flatMap((code) => toShiftJIS.get(code)!).slice(0, 20);
        while (converted.length < 20) { converted.push(' '.charCodeAt(0)); }
        pageInformationBuilder.write(Uint8Array.from(converted).buffer);
      }
      // reserved (予備)
      for (let i = 0; i < 32; i++) {
        pageInformationBuilder.writeU8(' '.charCodeAt(0))
      }
      // completed (ページ完成マーク)
      pageInformationBuilder.writeU8((page.completed ? '*' : ' ').charCodeAt(0))
      // usersAreaUsed (ユーザーズエリア識別)
      pageInformationBuilder.writeU8((page.usersAreaUsed ? '*' : ' ').charCodeAt(0))
      if (page.usersAreaUsed) {
        pageInformationBuilder.writeU8(page.writingFormatConversionMode);
        pageInformationBuilder.writeU8(page.drcsConversionMode << 6 | 0x3F);
      }
    }
    // Build
    const pageInformation = pageInformationBuilder.build();

    const management = muxDataGroup(page.management, true);
    const statement = page.tag !== 'ReservedPage' ? muxDataGroup(page.statement, true) : new ArrayBuffer(0);
    const length = (3 + pageInformation.byteLength) + (3 + management.byteLength) + (page.tag !== 'ReservedPage' ? 4 + statement.byteLength : 0);

    builder.writeU32(length);
    builder.writeU8(0x2A)
    builder.writeU16(pageInformation.byteLength);
    builder.write(pageInformation);
    builder.writeU8(0x3A);
    builder.writeU16(management.byteLength);
    builder.write(management);
    if (page.tag === 'ActualPage') {
      builder.writeU8(0x4A);
      builder.writeU24(statement.byteLength);
      builder.write(statement);
    }
    builder.write(new ArrayBuffer(Math.floor((4 + length + (block - 1)) / block) * block - (4 + length)));
  }

  return builder.build();
}

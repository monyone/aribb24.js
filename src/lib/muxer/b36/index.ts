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
  const programInformation = new ArrayBuffer(0);
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
          const XX = Math.ceil(page.displayTiming * 100) / 100;
          const SS = page.displayTiming % 60;
          const MM = Math.floor((page.displayTiming - SS) / 60) % 60;
          const HH = Math.floor((page.displayTiming - SS) / 3600);
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
            const XX = Math.ceil(page.clearTiming * 100) / 100;
            const SS = page.clearTiming % 60;
            const MM = Math.floor((page.clearTiming - SS) / 60) % 60;
            const HH = Math.floor((page.clearTiming - SS) / 3600);
            const HHMMSSXX = `${HH.toString(10).padStart(2, '0')}${MM.toString(10).padStart(2, '0')}${SS.toString(10).padStart(2, '0')}${XX.toString(10).padStart(2, '0')}`;
            for (let i = 0; i < 8; i++) {
              pageInformationBuilder.writeU8(HHMMSSXX.charCodeAt(i));
            }
            pageInformationBuilder.writeU8('0'.charCodeAt(0));
            break;
          }
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
      const displayWindowAreaSDFX = page.displayWindowArea[0][0].toString().padStart(4, '0');
      const displayWindowAreaSDFY = page.displayWindowArea[0][1].toString().padStart(4, '0');
      const displayWindowAreaSDPX = page.displayWindowArea[1][0].toString().padStart(4, '0');
      const displayWindowAreaSDPY = page.displayWindowArea[1][1].toString().padStart(4, '0');
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
      const pageDataBytes = page.pageDataBytes.toString().padStart(5, '0');
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

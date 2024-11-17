import { ByteStream } from "../../../util/bytestream"
import datagroup, { CaptionManagement, CaptionStatement } from "../b24/datagroup";


export type ARIBB36PageData = {
  pageNumber: Omit<string, '000000'>;
  management: CaptionManagement;
  statement: CaptionStatement;
} | {
  pageNumber: '000000';
  management: CaptionManagement;
};

export type ARIBB36Data = {
  pages: ARIBB36PageData[]
};

export default (b36: ArrayBuffer): ARIBB36Data => {
  const block = 256;
  const decoder = new TextDecoder('shift-jis', { fatal: true });
  const stream = new ByteStream(b36);

  //
  {
    const captionDataLabel = decoder.decode(stream.read(8));
    stream.read(block - 8);
  }

  // Program Management Information
  {
    const LI = stream.readU32();
    stream.read(Math.floor((LI + (block - 1)) / block) * block);
  }

  // Program Page Information
  const pages: ARIBB36PageData[] = [];
  while (!stream.isEmpty()) {
    const LI = stream.readU24();
    const buffer = stream.read(Math.floor((LI + 4 + (block - 1)) / block) * block - 4)
    const data = new DataView(buffer.slice(0, 2 + LI));

    // Page Management Data
    let begin = 0;
    const DL = data.getUint16(begin + 1);
    begin += 1 + 2;
    if (data.byteLength < (begin + DL)) { continue; }
    const pageNumber = String.fromCharCode(
      data.getUint8(begin + 0), data.getUint8(begin + 1), data.getUint8(begin + 2),
      data.getUint8(begin + 3), data.getUint8(begin + 4), data.getUint8(begin + 5)
    );

    // Caption Management Data
    begin += (1 + 2 + DL);
    const DL1 = data.getUint16(begin + 1);
    if (data.byteLength < (begin + 1 + (2 + DL1))) { continue; }
    const management = datagroup(data.buffer.slice(begin + 1 + 2, begin + 1 + (2 + DL1)), true);
    if (management == null || management.tag !== 'CaptionManagement') { continue; }

    if (pageNumber === '000000') {
      pages.push({
        pageNumber,
        management
      });
      continue;
    }

    // Caption Statement Data
    begin += (1 + 2 + DL1);
    const DL2 = data.getUint16(begin + 1);
    if (data.byteLength < (begin + 1 + (2 + DL2))) { continue; }
    const statement = datagroup(data.buffer.slice(begin + 1 + 2, begin + 1 + (2 + DL2)), true);
    if (statement == null || statement.tag !== 'CaptionStatement') { continue; }

    pages.push({
      pageNumber,
      management,
      statement
    });
  }

  return {
    pages
  };
}

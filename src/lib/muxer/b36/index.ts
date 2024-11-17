import { ARIBB36Data } from "../../demuxer/b36";
import muxDataGroup from "../../muxer/b24/datagroup";
import ARIBB24Encoder from "../../encoder/b24/encoder";
import concat from "../../../util/concat";
import { ByteBuilder } from "../../../util/bytebuilder";

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
    const pageInformation = new ArrayBuffer(6);
    {
      const view = new DataView(pageInformation);
      // page number
      for (let i = 0; i < 6; i++) {
        view.setUint8(i, page.pageNumber.charCodeAt(i))
      }
    }
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

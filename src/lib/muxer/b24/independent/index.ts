import { ExhaustivenessError } from "../../../../util/error";
import { PES } from "../../../demuxer/b24/independent";

export default (pes: PES): ArrayBuffer => {
  const array = new Uint8Array(3 + pes.data.byteLength);
  switch (pes.tag) {
    case 'Caption':
      array[0] = 0x80;
      array[1] = 0xFF;
      array[2] = 0;
      array.set(new Uint8Array(pes.data), 3);
      return array.buffer;
    case 'Superimpose':
      array[0] = 0x81;
      array[1] = 0xFF;
      array[2] = 0;
      array.set(new Uint8Array(pes.data), 3);
      return array.buffer;
    default:
      throw new ExhaustivenessError(pes, `Unexpected ARIB Caption Type`);
  }
}

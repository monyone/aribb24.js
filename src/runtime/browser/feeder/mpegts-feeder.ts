import { PartialFeederOption } from './feeder';
import { parseID3v2 } from '../../../util/id3';
import { base64ToUint8Array } from '../../../util/binary';
import DecodingFeeder from './decoding-feeder';

export default class MPEGTSFeeder extends DecodingFeeder {
  public constructor(option?: PartialFeederOption) {
    super(option);
  }

  public feedB24(data: Uint8Array | ArrayBufferLike, pts: number, dts?: number) {
    data = data instanceof Uint8Array ? data : new Uint8Array(data);
    this.feed(data, pts, dts ?? pts);
  }

  public feedID3(data: Uint8Array | ArrayBufferLike, pts: number, dts?: number) {
    data = data instanceof Uint8Array ? data : new Uint8Array(data);

    for (const frame of parseID3v2(data)) {
      switch (frame.id) {
        case 'PRIV': {
          if (frame.owner !== 'aribb24.js') { break; }
          this.feed(frame.data, pts, dts ?? pts);
          break;
        }
        case 'TXXX': {
          if (frame.description !== 'aribb24.js') { break; }
          this.feed(base64ToUint8Array(frame.text), pts, dts ?? pts);
          break;
        }
      }
    }
  }
}

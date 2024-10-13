import AVLTree from '../../util/avl';

import { FeederOption } from './feeder';
import { parseID3v2 } from '../../util/id3';
import { base64ToUint8Array } from '../../util/binary';
import DecodingFeeder from './decoding-feeder';

export default class MPEGTSFeeder extends DecodingFeeder {
  public constructor(option?: Partial<FeederOption>) {
    super(option);
  }

  public feedB24(data: ArrayBuffer, pts: number, dts?: number) {
    this.feed(data, pts, dts ?? pts);
  }

  public feedID3(data: ArrayBuffer, pts: number, dts?: number) {
    for (const frame of parseID3v2(data)) {
      switch (frame.id) {
        case 'PRIV': {
          if (frame.owner !== 'aribb24.js') { break; }
          this.feed(frame.data, pts, dts ?? pts);
          break;
        }
        case 'TXXX': {
          if (frame.description !== 'aribb24.js') { break; }
          this.feed(base64ToUint8Array(frame.text).buffer, pts, dts ?? pts);
          break;
        }
      }
    }
  }
}

import { ByteStream } from "../../../../util/bytestream";

import { ARIBB24Token, DRCS } from '../../token';
import { Character } from "../../token";
import ARIBB24Tokenizer, { CONTROL_CODES, processC0, processC1 } from "../tokenizer";
import { NotImplementedError, NotUsedDueToStandardError, UnreachableError } from "../../../../util/error";

type DRCSData = Omit<DRCS, 'tag' | 'combining'>;
const DRCSData = {
  from(width: number, height: number, depth: number, binary: ArrayBuffer): DRCSData {
    return {
      width,
      height,
      depth,
      binary,
    }
  }
};

const is_control_start = (stream: ByteStream) => {
  if (stream.exists(1)) {
    const c0 = stream.peekU8();
    if ((0x00 <= c0 && c0 <= 0x20) || c0 == 0x7F) { // C0 + SP + DEL
      return true;
    }
  }
  if (stream.exists(2)) {
    const c1 = stream.peekU16();
    if (0xC280 <= c1 && c1 <= 0xC29F) { // C1
      return true;
    }
  }

  return false;
}

export default class ARIBB24UTF8Tokenizer extends ARIBB24Tokenizer {
  private segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  private decoder = new TextDecoder('utf-8', { fatal: true });
  private drcs = new Map<string, DRCSData>();

  public tokenizeStatement(arraybuffer: ArrayBuffer): ARIBB24Token[] {
    const stream = new ByteStream(arraybuffer);
    const result: ARIBB24Token[] = [];

    while (!stream.isEmpty()) {
      if (!is_control_start(stream)) {
        const string: number[] = [];
        while (!stream.isEmpty() && !is_control_start(stream)) {
          string.push(stream.readU8());
        }
        for (const ch of Array.from(this.segmenter.segment(this.decoder.decode(Uint8Array.from(string))), ({ segment }) => segment)) {
          const [value ,... rest] = Array.from(ch);
          if (this.drcs.has(value)) {
            const { width, height, depth, binary} = this.drcs.get(value)!;
            result.push(DRCS.from(width, height, depth, binary, rest.join('')));
          } else {
            result.push(Character.from(ch));
          }
        }

        continue;
      }

      const control = stream.peekU8();
      if (stream.exists(1) && (0x00 <= control && control <= 0x20) || control === CONTROL_CODES.DEL) {
        switch (control) {
          case CONTROL_CODES.LS0:
          case CONTROL_CODES.LS1:
          case CONTROL_CODES.SS2:
          case CONTROL_CODES.SS3:
            throw new NotUsedDueToStandardError('Single/Locking Shift is Not used in UTF-8');
          case CONTROL_CODES.ESC:
            throw new NotImplementedError('ESC in UTF-8 is Not Implemented');
        }

        result.push(processC0(stream));
      } else if (stream.exists(2) && 0xC280 <= stream.peekU16() && stream.peekU16() <= 0xC29F) {
        stream.readU8();
        result.push(processC1(stream));
      } else {
        throw new UnreachableError(`Undefined Conrtol Code in STD-B24 ARIB Caption`);
      }
    }

    return result;
  }

  public processDRCS(bytes: 1 | 2, arraybuffer: ArrayBuffer): void {
    if (bytes === 1) {
      throw new NotUsedDueToStandardError('Not used 1-byte DRCS in UTF-8');
    }

    const uint8 = new Uint8Array(arraybuffer);
    let begin = 0, end = uint8.byteLength;
    const NumberOfCode = uint8[begin + 0];
    begin += 1
    while (begin < end){
      const CharacterCode = (uint8[begin + 0] << 8) | uint8[begin + 1];
      const NumberOfFont = uint8[begin + 2];
      begin += 3

      for (let font = 0; font < NumberOfFont; font++) {
        const fontId = (uint8[begin + 0] & 0xF0) >> 4
        const mode = (uint8[begin + 0] & 0x0F)

        if (mode === 0 || mode === 1) {
          const colors = uint8[begin + 1] + 2;
          const width = uint8[begin + 2];
          const height = uint8[begin + 3];
          const depth = [0, 1, 6, 2, 7, 5, 4, 3][(colors * 0b00011101) >> 5]; // De Brujin Sequence in 8 bit
          const length = Math.floor(width * height * depth / 8);
          const binary = uint8.slice(begin + 4, begin + 4 + length).buffer;

          this.drcs.set(String.fromCodePoint(CharacterCode), DRCSData.from(width, height, depth, binary));

          begin += 4 + length
        } else { // FIXME: Other Mode Not Supported
          return;
        }
      }
    }
  }
}

import { EOFError } from "./error";

export class ByteStream {
  private data: Uint8Array;
  private view: DataView<ArrayBufferLike>;
  private offset: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    this.offset = 0;
  }

  public exists(length: number): boolean {
    return this.offset + length <= this.view.byteLength;
  }

  public isEmpty(): boolean {
    return this.offset === this.view.byteLength;
  }

  public read(length: number): Uint8Array {
    if (!this.exists(length)) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  public peekU8(): number {
    if (!this.exists(1)) {
      throw new EOFError('Detected EOF!');
    }

    return this.view.getUint8(this.offset);
  }

  public readU8(): number {
    const result = this.peekU8();
    this.offset += 1;
    return result;
  }

  public peekU16(): number {
    if (!this.exists(2)) {
      throw new EOFError('Detected EOF!');
    }

    return this.view.getUint16(this.offset, false);
  }

  public readU16(): number {
    const result = this.peekU16();
    this.offset += 2;
    return result;
  }

  public peekU24(): number {
    if (!this.exists(3)) {
      throw new EOFError('Detected EOF!');
    }

    return this.view.getUint16(this.offset, false) * (2 ** 8) + this.view.getUint8(this.offset + 2);
  }

  public readU24(): number {
    const result = this.peekU24();
    this.offset += 3;
    return result;
  }

  public peekU32(): number {
    if (!this.exists(4)) {
      throw new EOFError('Detected EOF!');
    }

    return this.view.getUint32(this.offset, false);
  }

  public readU32(): number {
    const result = this.peekU32();
    this.offset += 4;
    return result;
  }

  public readAll(): Uint8Array {
    const result = this.data.subarray(this.offset);
    this.offset = this.view.byteLength;
    return result;
  }
}

import concat from "./concat";

export class ByteBuilder {
  private buffers: ArrayBuffer[] = [];

  public build() {
    return concat(... this.buffers);
  }

  public write(buffer: ArrayBuffer): void {
    this.buffers.push(buffer);
  }

  public writeU8(value: number) {
    const view = new DataView(new ArrayBuffer(1));
    view.setUint8(0, value);
    this.buffers.push(view.buffer);
  }

  public writeU16(value: number) {
    const view = new DataView(new ArrayBuffer(2));
    view.setUint16(0, value, false);
    this.buffers.push(view.buffer);
  }

  public writeU24(value: number) {
    const view = new DataView(new ArrayBuffer(3));
    view.setUint16(0, (value & 0xFFFF00) >> 8, false);
    view.setUint8(2, (value & 0x0000FF) >> 0);
    this.buffers.push(view.buffer);
  }

  public writeU32(value: number) {
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, value, false);
    this.buffers.push(view.buffer);
  }
}

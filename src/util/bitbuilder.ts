export default class BitBuilder {
  private bits: number[] = [];
  private data: number[] = [];

  private fill(): void {
    while (this.bits.length >= 8) {
      let datum = 0;
      for (let i = 0; i < 8; i++) {
        datum = datum * 2 + this.bits.shift()!;
      }
      this.data.push(datum);
    }
  }

  public writeBits(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push(Math.floor((value % (2 ** (i + 1))) / (2 ** i)));
    }
    this.fill();
  }

  public writeBool(value: boolean): void {
    this.writeBits(value ? 1 : 0, 1);
  }

  public writeByte(value: number): void {
    this.writeBits(value, 8);
  }

  public writeByteAlign(fill: 0 | 1 = 0): void {
    if ((this.bits.length % 8) == 0) { return; }
    while ((this.bits.length % 8) !== 0) {
      this.bits.push(fill);
    }
    this.fill();
  }

  public isByteAligned(): boolean {
    return (this.bits.length % 8) === 0;
  }

  public writeBytes(value: Iterable<number>): void {
    for (const byte of value) { this.writeByte(byte); }
  }

  public build(): ArrayBuffer {
    const values = [... this.data];

    if (this.bits.length > 0) {
      let datum = 0;
      for (let i = 0; i < 8; i++) {
        datum = datum * 2 + (this.bits[i] ?? 0);
      }
      values.push(datum);
    }

    return Uint8Array.from(values).buffer;
  }
}

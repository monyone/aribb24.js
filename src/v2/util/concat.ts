export default (... buffers: ArrayBuffer[]): ArrayBuffer => {
  if (!buffers) { return new ArrayBuffer(0); }

  const sum = buffers.reduce((sum, curr) => sum + curr.byteLength, 0);
  const array = new Uint8Array(sum);

  for (let i = 0, offset = 0; i < buffers.length; offset += buffers[i].byteLength, i++) {
    array.set(new Uint8Array(buffers[i]), offset);
  }

  return array.buffer;
}

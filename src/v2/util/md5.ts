const L = (x: number, n: number) => {
  return (x << n) | (x >>> (32 - n))
}

const X = (Y: (b: number, c: number, d: number) => number, a: number, b: number, c: number, d: number, m: number, k: number, s: number) => {
  return (L((a + Y(b, c, d) + m + k) | 0, s) + b) | 0
}

const F = (b: number, c: number, d: number) => {
  return (b & c) | ((~b) & d);
}

const G = (b: number, c: number, d: number) => {
  return (b & d) | (c & (~d));
}

const H = (b: number, c: number, d: number) => {
  return b ^ c ^ d;
}

const I = (b: number, c: number, d: number) => {
  return c ^ (b | (~d));
}

const byteToHex = (byte: number) => {
  const upper = (byte & 0xF0) >> 4;
  const lower = (byte & 0x0F) >> 0;
  return `${upper.toString(16)}${lower.toString(16)}`
}

export default (buffer: ArrayBuffer): string => {
  const dataLength = Math.floor((buffer.byteLength + 8) / 64 + 1) * 64;

  const padding = new Uint8Array(dataLength);
  padding.set(new Uint8Array(buffer), 0)

  const view = new DataView(padding.buffer);
  view.setUint8(buffer.byteLength, 0x80);
  view.setUint32(dataLength - 8, (buffer.byteLength * 8) % (2 ** 32), true);
  view.setUint32(dataLength - 4, (buffer.byteLength * 8) / (2 ** 32), true);

  let a = 0x67452301 | 0;
  let b = 0xefcdab89 | 0;
  let c = 0x98badcfe | 0;
  let d = 0x10325476 | 0;

  for (let i = 0; i < dataLength; i += 64) {
    let aa = a, bb = b, cc = c, dd = d;

    a = X(F, a, b, c, d, view.getUint32(i + 4 * 0,  true), 0xd76aa478, 7);
    d = X(F, d, a, b, c, view.getUint32(i + 4 * 1,  true), 0xe8c7b756, 12);
    c = X(F, c, d, a, b, view.getUint32(i + 4 * 2,  true), 0x242070db, 17);
    b = X(F, b, c, d, a, view.getUint32(i + 4 * 3,  true), 0xc1bdceee, 22);
    a = X(F, a, b, c, d, view.getUint32(i + 4 * 4,  true), 0xf57c0faf, 7);
    d = X(F, d, a, b, c, view.getUint32(i + 4 * 5,  true), 0x4787c62a, 12);
    c = X(F, c, d, a, b, view.getUint32(i + 4 * 6,  true), 0xa8304613, 17);
    b = X(F, b, c, d, a, view.getUint32(i + 4 * 7,  true), 0xfd469501, 22);
    a = X(F, a, b, c, d, view.getUint32(i + 4 * 8,  true), 0x698098d8, 7);
    d = X(F, d, a, b, c, view.getUint32(i + 4 * 9,  true), 0x8b44f7af, 12);
    c = X(F, c, d, a, b, view.getUint32(i + 4 * 10, true), 0xffff5bb1, 17);
    b = X(F, b, c, d, a, view.getUint32(i + 4 * 11, true), 0x895cd7be, 22);
    a = X(F, a, b, c, d, view.getUint32(i + 4 * 12, true), 0x6b901122, 7);
    d = X(F, d, a, b, c, view.getUint32(i + 4 * 13, true), 0xfd987193, 12);
    c = X(F, c, d, a, b, view.getUint32(i + 4 * 14, true), 0xa679438e, 17);
    b = X(F, b, c, d, a, view.getUint32(i + 4 * 15, true), 0x49b40821, 22);

    a = X(G, a, b, c, d, view.getUint32(i + 4 * 1,  true), 0xf61e2562, 5);
    d = X(G, d, a, b, c, view.getUint32(i + 4 * 6,  true), 0xc040b340, 9);
    c = X(G, c, d, a, b, view.getUint32(i + 4 * 11, true), 0x265e5a51, 14);
    b = X(G, b, c, d, a, view.getUint32(i + 4 * 0,  true), 0xe9b6c7aa, 20);
    a = X(G, a, b, c, d, view.getUint32(i + 4 * 5,  true), 0xd62f105d, 5);
    d = X(G, d, a, b, c, view.getUint32(i + 4 * 10, true), 0x02441453, 9);
    c = X(G, c, d, a, b, view.getUint32(i + 4 * 15, true), 0xd8a1e681, 14);
    b = X(G, b, c, d, a, view.getUint32(i + 4 * 4,  true), 0xe7d3fbc8, 20);
    a = X(G, a, b, c, d, view.getUint32(i + 4 * 9,  true), 0x21e1cde6, 5);
    d = X(G, d, a, b, c, view.getUint32(i + 4 * 14, true), 0xc33707d6, 9);
    c = X(G, c, d, a, b, view.getUint32(i + 4 * 3,  true), 0xf4d50d87, 14);
    b = X(G, b, c, d, a, view.getUint32(i + 4 * 8,  true), 0x455a14ed, 20);
    a = X(G, a, b, c, d, view.getUint32(i + 4 * 13, true), 0xa9e3e905, 5);
    d = X(G, d, a, b, c, view.getUint32(i + 4 * 2,  true), 0xfcefa3f8, 9);
    c = X(G, c, d, a, b, view.getUint32(i + 4 * 7,  true), 0x676f02d9, 14);
    b = X(G, b, c, d, a, view.getUint32(i + 4 * 12, true), 0x8d2a4c8a, 20);

    a = X(H, a, b, c, d, view.getUint32(i + 4 * 5,  true), 0xfffa3942, 4);
    d = X(H, d, a, b, c, view.getUint32(i + 4 * 8,  true), 0x8771f681, 11);
    c = X(H, c, d, a, b, view.getUint32(i + 4 * 11, true), 0x6d9d6122, 16);
    b = X(H, b, c, d, a, view.getUint32(i + 4 * 14, true), 0xfde5380c, 23);
    a = X(H, a, b, c, d, view.getUint32(i + 4 * 1,  true), 0xa4beea44, 4);
    d = X(H, d, a, b, c, view.getUint32(i + 4 * 4,  true), 0x4bdecfa9, 11);
    c = X(H, c, d, a, b, view.getUint32(i + 4 * 7,  true), 0xf6bb4b60, 16);
    b = X(H, b, c, d, a, view.getUint32(i + 4 * 10, true), 0xbebfbc70, 23);
    a = X(H, a, b, c, d, view.getUint32(i + 4 * 13, true), 0x289b7ec6, 4);
    d = X(H, d, a, b, c, view.getUint32(i + 4 * 0,  true), 0xeaa127fa, 11);
    c = X(H, c, d, a, b, view.getUint32(i + 4 * 3,  true), 0xd4ef3085, 16);
    b = X(H, b, c, d, a, view.getUint32(i + 4 * 6,  true), 0x04881d05, 23);
    a = X(H, a, b, c, d, view.getUint32(i + 4 * 9,  true), 0xd9d4d039, 4);
    d = X(H, d, a, b, c, view.getUint32(i + 4 * 12, true), 0xe6db99e5, 11);
    c = X(H, c, d, a, b, view.getUint32(i + 4 * 15, true), 0x1fa27cf8, 16);
    b = X(H, b, c, d, a, view.getUint32(i + 4 * 2,  true), 0xc4ac5665, 23);

    a = X(I, a, b, c, d, view.getUint32(i + 4 * 0,  true), 0xf4292244, 6);
    d = X(I, d, a, b, c, view.getUint32(i + 4 * 7,  true), 0x432aff97, 10);
    c = X(I, c, d, a, b, view.getUint32(i + 4 * 14, true), 0xab9423a7, 15);
    b = X(I, b, c, d, a, view.getUint32(i + 4 * 5,  true), 0xfc93a039, 21);
    a = X(I, a, b, c, d, view.getUint32(i + 4 * 12, true), 0x655b59c3, 6);
    d = X(I, d, a, b, c, view.getUint32(i + 4 * 3,  true), 0x8f0ccc92, 10);
    c = X(I, c, d, a, b, view.getUint32(i + 4 * 10, true), 0xffeff47d, 15);
    b = X(I, b, c, d, a, view.getUint32(i + 4 * 1,  true), 0x85845dd1, 21);
    a = X(I, a, b, c, d, view.getUint32(i + 4 * 8,  true), 0x6fa87e4f, 6);
    d = X(I, d, a, b, c, view.getUint32(i + 4 * 15, true), 0xfe2ce6e0, 10);
    c = X(I, c, d, a, b, view.getUint32(i + 4 * 6,  true), 0xa3014314, 15);
    b = X(I, b, c, d, a, view.getUint32(i + 4 * 13, true), 0x4e0811a1, 21);
    a = X(I, a, b, c, d, view.getUint32(i + 4 * 4,  true), 0xf7537e82, 6);
    d = X(I, d, a, b, c, view.getUint32(i + 4 * 11, true), 0xbd3af235, 10);
    c = X(I, c, d, a, b, view.getUint32(i + 4 * 2,  true), 0x2ad7d2bb, 15);
    b = X(I, b, c, d, a, view.getUint32(i + 4 * 9,  true), 0xeb86d391, 21);

    a = (aa + a) | 0
    b = (bb + b) | 0
    c = (cc + c) | 0
    d = (dd + d) | 0
  }

  let result = '';
  result += byteToHex((a & 0x000000FF) >>>  0);
  result += byteToHex((a & 0x0000FF00) >>>  8);
  result += byteToHex((a & 0x00FF0000) >>> 16);
  result += byteToHex((a & 0xFF000000) >>> 24);
  result += byteToHex((b & 0x000000FF) >>>  0);
  result += byteToHex((b & 0x0000FF00) >>>  8);
  result += byteToHex((b & 0x00FF0000) >>> 16);
  result += byteToHex((b & 0xFF000000) >>> 24);
  result += byteToHex((c & 0x000000FF) >>>  0);
  result += byteToHex((c & 0x0000FF00) >>>  8);
  result += byteToHex((c & 0x00FF0000) >>> 16);
  result += byteToHex((c & 0xFF000000) >>> 24);
  result += byteToHex((d & 0x000000FF) >>>  0);
  result += byteToHex((d & 0x0000FF00) >>>  8);
  result += byteToHex((d & 0x00FF0000) >>> 16);
  result += byteToHex((d & 0xFF000000) >>> 24);

  return result;
}

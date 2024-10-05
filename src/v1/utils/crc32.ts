export default function CRC32(buffer: Uint8Array, begin: number, end: number) {
  let crc = -1;
  for (let i = begin; i < end; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320;
      } else {
        crc >>>= 1;
      }
    }
  }
  return ~crc;
}

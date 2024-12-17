import { adaptation_field_length, has_adaptation_field, HEADER_SIZE, PACKET_SIZE, payload_unit_start_indicator, pointer_field, STUFFING_BYTE } from "./packet";

export const BASIC_HEADER_SIZE = 3;
export const EXTENDED_HEADER_SIZE = 8;
export const CRC_SIZE = 4;
export const table_id = (section: Uint8Array): number => {
  return section[0];
}
export const section_length = (section: Uint8Array): number => {
  return ((section[1] & 0x0F) << 8) | section[2];
}

export const CRC32 = (section: Uint8Array, begin: number = 0, end: number = section.byteLength): number =>  {
  let crc = 0xFFFFFFFF;
  for (let i = begin; i < end; i++) {
    for (let index = 7; index >= 0; index--) {
      let bit = (section[i] & (1 << index)) >> index;
      const c = (crc & 0x80000000) !== 0 ? 1 : 0;
      crc <<= 1
      if (c ^ bit) {
        crc ^= 0x04c11db7;
      }
      crc &= 0xFFFFFFFF;
    }
  }
  return crc
}

export default class SectionDemuxer {
  private accendant: Uint8Array = new Uint8Array();

  public *feed(packet: Uint8Array) {
    let begin = HEADER_SIZE + (has_adaptation_field(packet) ? 1 + adaptation_field_length(packet) : 0);
    if (payload_unit_start_indicator(packet)) { begin += 1; }

    if (this.accendant.byteLength == 0) {
      if (payload_unit_start_indicator(packet)) {
        begin += pointer_field(packet);
      } else {
        return;
      }
    } else {
      const next = begin + Math.max(0, BASIC_HEADER_SIZE + section_length(this.accendant) - this.accendant.length);
      if (next > PACKET_SIZE) {
        const old = this.accendant;
        this.accendant = new Uint8Array(this.accendant.byteLength + (PACKET_SIZE - begin));
        this.accendant.set(old, 0);
        this.accendant.set(packet.slice(begin), old.byteLength);
        return;
      } else {
        const section = new Uint8Array(this.accendant.byteLength + (next - begin));
        section.set(this.accendant, 0);
        section.set(packet.slice(begin, next), this.accendant.byteLength);
        this.accendant = new Uint8Array();
        yield section
        begin = next;
      }
    }

    if (!payload_unit_start_indicator(packet)) { return; }
    while (begin < PACKET_SIZE) {
      if (packet[begin] === STUFFING_BYTE) { break; }

      const next = begin + Math.max(0, BASIC_HEADER_SIZE + section_length(packet.slice(begin)));
      if (next > PACKET_SIZE) { this.accendant = packet.slice(begin); break; }
      yield packet.slice(begin, next);
      begin = next;
    }
  }
}

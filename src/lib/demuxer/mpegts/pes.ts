import { adaptation_field_length, has_adaptation_field, HEADER_SIZE, payload_unit_start_indicator } from "./packet";

export const PES_HEADER_SIZE = 6;

export const packet_start_code_prefix = (pes: Uint8Array): number => {
  return (pes[0] << 16) | (pes[1] << 8) | pes[2]
}

export const stream_id = (pes: Uint8Array): number => {
  return pes[3]
}

export const PES_packet_length = (pes: Uint8Array): number => {
  return (pes[4] << 8) | pes[5]
}

export const has_flags = (pes: Uint8Array): boolean => {
  const id = stream_id(pes);
  return (id !== 0xBC) && (id !== 0xBE) && (id !== 0xBF) && (id !== 0xF0) && (id !== 0xF1) && (id !== 0xFF) && (id !== 0xF2) && (id !== 0xF8);
}

export const has_PTS = (pes: Uint8Array): boolean => {
  if (!has_flags(pes)) { return false }
  return (pes[PES_HEADER_SIZE + 1] & 0x80) !== 0;
}

export const has_DTS = (pes: Uint8Array): boolean => {
  if (!has_flags(pes)) { return false; }
  return (pes[PES_HEADER_SIZE + 1] & 0x40) !== 0;
}

export const PTS = (pes: Uint8Array): number | null => {
  if (!has_PTS(pes)) { return null; }

  let value = 0;
  value *= (1 << 3); value += ((pes[PES_HEADER_SIZE + 3 + 0] & 0x0E) >> 1);
  value *= (1 << 8); value += ((pes[PES_HEADER_SIZE + 3 + 1] & 0xFF) >> 0);
  value *= (1 << 7); value += ((pes[PES_HEADER_SIZE + 3 + 2] & 0xFE) >> 1);
  value *= (1 << 8); value += ((pes[PES_HEADER_SIZE + 3 + 3] & 0xFF) >> 0);
  value *= (1 << 7); value += ((pes[PES_HEADER_SIZE + 3 + 4] & 0xFE) >> 1);

  return value;
}

export const DTS = (pes: Uint8Array): number | null => {
  if (!has_DTS(pes)) { return null; }

  const offset = has_PTS(pes) ? 5 : 0;
  let value = 0;
  value *= (1 << 3); value += ((pes[PES_HEADER_SIZE + 3 + offset + 0] & 0x0E) >> 1);
  value *= (1 << 8); value += ((pes[PES_HEADER_SIZE + 3 + offset + 1] & 0xFF) >> 0);
  value *= (1 << 7); value += ((pes[PES_HEADER_SIZE + 3 + offset + 2] & 0xFE) >> 1);
  value *= (1 << 8); value += ((pes[PES_HEADER_SIZE + 3 + offset + 3] & 0xFF) >> 0);
  value *= (1 << 7); value += ((pes[PES_HEADER_SIZE + 3 + offset + 4] & 0xFE) >> 1);

  return value;
}

export const PES_header_length = (pes: Uint8Array): number => {
  if (!has_flags(pes)) { return 0; }
  return 3 + pes[PES_HEADER_SIZE + 2];
}

const is_completed = (pes: Uint8Array) => {
  if (PES_packet_length(pes) === 0) { return false; }
  return pes.byteLength >= (PES_HEADER_SIZE + PES_packet_length(pes));
}

export default class PacketizedElementaryStreamDemuxer {
  private accendant: Uint8Array = new Uint8Array();

  public *feed(packet: Uint8Array) {
    const content = packet.slice(HEADER_SIZE + (has_adaptation_field(packet) ? 1 + adaptation_field_length(packet) : 0));

    if (payload_unit_start_indicator(packet)) {
      if (this.accendant.byteLength > 0 && PES_packet_length(this.accendant) === 0) {
        yield this.accendant;
      }
      this.accendant = content;
    } else if (this.accendant.byteLength > 0) {
      const old = this.accendant;
      this.accendant = new Uint8Array(this.accendant.byteLength + content.byteLength);
      this.accendant.set(old, 0);
      this.accendant.set(content, old.byteLength);
    }
    if (is_completed(this.accendant)) {
      yield this.accendant.slice(0, PES_HEADER_SIZE + PES_packet_length(this.accendant));
      this.accendant = new Uint8Array();
    }
  }
}

export const PACKET_SIZE = 188;
export const HEADER_SIZE = 4;
export const SYNC_BYTE = 0x47;
export const STUFFING_BYTE = 0xFF;
export const TIMESTAMP_TIMESCALE = 90000;
export const TIMESTAMP_ROLLOVER = 2 ** 33;

export const transport_error_indicator = (packet: Uint8Array): boolean => {
  return (packet[1] & 0x80) != 0;
}

export const payload_unit_start_indicator = (packet: Uint8Array): boolean => {
  return (packet[1] & 0x40) != 0;
}

export const transport_priority = (packet: Uint8Array): boolean => {
  return (packet[1] & 0x20) != 0;
}

export const pid = (packet: Uint8Array): number => {
  return ((packet[1] & 0x1F) << 8) | packet[2];
}

export const transport_scrambling_control = (packet: Uint8Array): number => {
  return (packet[3] & 0xC0) >> 6;
}

export const has_adaptation_field = (packet: Uint8Array): boolean => {
  return (packet[3] & 0x20) != 0;
}

export const has_payload = (packet: Uint8Array): boolean => {
  return (packet[3] & 0x10) != 0;
}

export const continuity_counter = (packet: Uint8Array): number => {
  return packet[3] & 0x0F;
}

export const adaptation_field_length = (packet: Uint8Array): number => {
  return has_adaptation_field(packet) ? packet[4] : 0;
}

export const pointer_field = (packet: Uint8Array): number => {
  return packet[HEADER_SIZE + (has_adaptation_field(packet) ? 1 + adaptation_field_length(packet) : 0)];
}

export const has_pcr = (packet: Uint8Array): boolean => {
  return has_adaptation_field(packet) && adaptation_field_length(packet) !== 0 && (packet[HEADER_SIZE + 1] & 0x10) != 0;
}

export const pcr = (packet: Uint8Array): number | null => {
  if (!has_pcr(packet)) { return null; }

  let pcr_base = 0;
  pcr_base = (pcr_base * (1 << 8)) + ((packet[HEADER_SIZE + 1 + 1] & 0xFF) >> 0);
  pcr_base = (pcr_base * (1 << 8)) + ((packet[HEADER_SIZE + 1 + 2] & 0xFF) >> 0);
  pcr_base = (pcr_base * (1 << 8)) + ((packet[HEADER_SIZE + 1 + 3] & 0xFF) >> 0);
  pcr_base = (pcr_base * (1 << 8)) + ((packet[HEADER_SIZE + 1 + 4] & 0xFF) >> 0);
  pcr_base = (pcr_base * (1 << 1)) + ((packet[HEADER_SIZE + 1 + 5] & 0x80) >> 7);

  return pcr_base;
}

export default class MPEGTransportStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(writableStrategy?: QueuingStrategy<Uint8Array>, readableStrategy?: QueuingStrategy<Uint8Array>) {
    let accendant = new Uint8Array();
    super({
      transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
        {
          const old = accendant;
          accendant = new Uint8Array(accendant.byteLength + chunk.byteLength);
          accendant.set(old, 0);
          accendant.set(chunk, old.byteLength);
        }

        for (let i = 0; i < accendant.byteLength; i++) {
          if (accendant[i] !== SYNC_BYTE) { continue; }
          if (i + PACKET_SIZE > accendant.byteLength) {
            accendant = accendant.slice(i);
            return;
          }

          controller.enqueue(accendant.slice(i, i + PACKET_SIZE));
          i += PACKET_SIZE - 1;
        }
        accendant = new Uint8Array();
      }
    }, writableStrategy, readableStrategy);
  }
}

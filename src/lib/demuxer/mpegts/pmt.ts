import { BASIC_HEADER_SIZE, EXTENDED_HEADER_SIZE, CRC_SIZE, section_length } from "./section"

const StreamType = {
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  ARIBB24_CAPTION: 'ARIBB24_CAPTION',
  ARIBB24_SUPERIMPOSE: 'ARIBB24_SUPERIMPOSE',
} as const;

export default (pmt: Uint8Array) => {
  const streams = [];

  const program_info_length = ((pmt[EXTENDED_HEADER_SIZE + 2] & 0x0F) << 8) | pmt[EXTENDED_HEADER_SIZE + 3];
  const length = BASIC_HEADER_SIZE + section_length(pmt) - CRC_SIZE;
  let begin = EXTENDED_HEADER_SIZE + 4 + program_info_length;
  while (begin < length) {
    const stream_type = pmt[begin + 0];
    const elementary_PID = ((pmt[begin + 1] & 0x1F) << 8) | pmt[begin + 2];
    const ES_info_length = ((pmt[begin + 3] & 0x0F) << 8) | pmt[begin + 4];

    let type: (typeof StreamType)[keyof typeof StreamType] | null = null;
    switch (stream_type) {
      // VIDEO
      case 0x01: type = 'VIDEO'; break; // MPEG-1
      case 0x02: type = 'VIDEO'; break; // MPEG-2
      case 0x1B: type = 'VIDEO'; break; // H264
      case 0x24: type = 'VIDEO'; break; // H265
      // AUDIO
      case 0x03: type = 'AUDIO'; break; // MP2
      case 0x04: type = 'AUDIO'; break; // MP3
      case 0x0F: type = 'AUDIO'; break; // AAC (ADTS)
      case 0x11: type = 'AUDIO'; break; // AAC (LATM)
    }

    let offset = begin + 5;
    while (offset < begin + 5 + ES_info_length) {
      const descriptor_tag = pmt[offset + 0];
      const descriptor_length = pmt[offset + 1];

      if (descriptor_tag === 0x52) {
        const component_tag = pmt[offset + 2];
        if (stream_type === 0x06 && component_tag === 0x30) {
          type = 'ARIBB24_CAPTION';
        } else if (stream_type === 0x06 && component_tag === 0x38) {
          type = 'ARIBB24_SUPERIMPOSE';
        }
      }

      offset += 2 + descriptor_length;
    }

    if (type != null) {
      streams.push({
        type,
        elementary_PID
      });
    }

    begin += 5 + ES_info_length;
  }

  return streams;
}

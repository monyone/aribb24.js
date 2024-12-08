import { BASIC_HEADER_SIZE, EXTENDED_HEADER_SIZE, CRC_SIZE, section_length } from "./section"

export default (pat: Uint8Array) => {
  const programs = [];
  const length = BASIC_HEADER_SIZE + section_length(pat) - CRC_SIZE;
  for (let i = EXTENDED_HEADER_SIZE; i < length; i += 4) {
    const program_number = (pat[i + 0] << 8) | (pat[i + 1] << 0);
    const program_map_PID = ((pat[i + 2] & 0x1F) << 8) | (pat[i + 3] << 0);
    if (program_number === 0) { continue; }

    programs.push({
      program_number,
      program_map_PID
    });
  }

  return programs;
}

import demuxDatagroup, { ARIBB24CaptionData } from "../b24/datagroup";
import demuxIndependentPES from "../b24/independent";
import MPEGTransformStream, { pid as getPID, TIMESTAMP_ROLLOVER } from "./packet";
import parsePAT from "./pat";
import parsePMT from "./pmt";
import PacketizedElementaryStreamDemuxer, { DTS, PES_header_length, PES_HEADER_SIZE, PTS } from "./pes";
import SectionDemuxer, { CRC32 } from "./section";

export type ARIBB24MPEGTSData = {
  tag: 'Caption' | 'Superimpose';
  pts: number;
  dts: number;
  data: ARIBB24CaptionData;
};

export type ARIBB24MPEGDemuxOption = {
  serviceId: number | null;
  offset: 'VIDEO' | 'AUDIO' | 'BOTH' | 'NONE';
  type: 'Caption' | 'Superimpose';
}

export default async function* (readable: ReadableStream<Uint8Array>, option?: Partial<ARIBB24MPEGDemuxOption>): AsyncIterable<ARIBB24MPEGTSData> {
  const packets = readable.pipeThrough(new MPEGTransformStream());
  const demuxerPAT = new SectionDemuxer();
  const demuxerPMT = new SectionDemuxer();
  const demuxerCaption = new PacketizedElementaryStreamDemuxer();
  const demuxerOthers = new Map<number, PacketizedElementaryStreamDemuxer>();

  let PMT_PID: number | null = null;
  let CAPTION_PID: number | null = null;
  let offset: number | null = ((option?.offset ?? 'BOTH') === 'NONE' ? 0 : null);

  const reader = packets.getReader();
  while (true) {
    const { value: packet, done } = await reader.read();
    if (done) { return; }

    const pid = getPID(packet);
    if (pid === 0) { // PAT
      for (const PAT of demuxerPAT.feed(packet)) {
        if (CRC32(PAT) !== 0) { continue; }
        const serviceId = option?.serviceId ?? null;
        PMT_PID = parsePAT(PAT).find(({ program_number }) => serviceId == null || serviceId === program_number)?.program_map_PID ?? null;
      }
    } else if (pid === PMT_PID) {
      for (const PMT of demuxerPMT.feed(packet)) {
        if (CRC32(PMT) !== 0) { continue; }
        const streams = parsePMT(PMT);
        CAPTION_PID = streams.find((stream) => {
          if (option?.type === 'Superimpose') { return stream.type === 'ARIBB24_SUPERIMPOSE'; }
          return stream.type === 'ARIBB24_CAPTION';
        })?.elementary_PID ?? null;

        for (const stream of streams) {
          const video = (option?.offset === 'VIDEO' || option?.offset === 'BOTH' || option?.offset == null) && stream.type === 'VIDEO';
          const audio = (option?.offset === 'AUDIO' || option?.offset === 'BOTH' || option?.offset == null) && stream.type === 'AUDIO';
          if (!video && !audio) { continue; }

          if (!demuxerOthers.has(stream.elementary_PID)) {
            demuxerOthers.set(stream.elementary_PID, new PacketizedElementaryStreamDemuxer());
          }
        }
      }
    } else if (demuxerOthers.has(pid) && offset == null) {
      for (const stream of demuxerOthers.get(pid)!.feed(packet)) {
        const pts = PTS(stream);
        if (pts == null) { continue; }
        offset ??= pts;
      }
    } else if (pid === CAPTION_PID) {
      for (const pes of demuxerCaption.feed(packet)) {
        if (offset == null) { continue; }
        const content = pes.slice(PES_HEADER_SIZE + PES_header_length(pes));
        const independent = demuxIndependentPES((new Uint8Array(content)).buffer);
        if (independent == null) { continue; }
        const datagroup = demuxDatagroup(independent.data);
        if (datagroup == null) { continue; }

        yield {
          tag: independent.tag,
          pts: ((TIMESTAMP_ROLLOVER + PTS(pes)! - offset) % TIMESTAMP_ROLLOVER) / 90000,
          dts: ((TIMESTAMP_ROLLOVER + (DTS(pes) ?? PTS(pes))! - offset) % TIMESTAMP_ROLLOVER) / 90000,
          data: datagroup
        };
      }
    }
  }
}

import { PartialFeederOption } from './feeder';
import { parseID3v2 } from '../../../util/id3';
import { base64ToUint8Array } from '../../../util/binary';
import DecodingFeeder from './decoding-feeder';

export default class HLSFeeder extends DecodingFeeder {
  private media: HTMLMediaElement | null = null;
  private timer: number | null = null;
  private privious_time: number | null = null;
  private id3Tracks: TextTrack[] = [];
  private readonly onAddTrackHandler: ((event: TrackEvent) => void) = this.onAddTrack.bind(this);
  private readonly onRemoveTrackHandler: ((event: TrackEvent) => void) = this.onRemoveTrack.bind(this);
  private readonly onPlayHandler = this.onPlay.bind(this);
  private readonly onPauseHandler = this.onPause.bind(this);
  private readonly interspactHandler = this.interspact.bind(this);

  public constructor(option?: PartialFeederOption) {
    super(option);
  }

  public attachMedia(media: HTMLVideoElement): void {
    this.detachMedia();
    this.media = media;

    this.setupHandlers();
    this.registerID3Track();
  }

  public detachMedia(): void {
    this.unregisterID3Track();
    this.cleanupHandlers();

    this.media = null
    this.privious_time = null;
  }

  private static isID3Track(track: TextTrack): boolean {
    if (track.kind !== 'metadata') { return false; }

    if (track.inBandMetadataTrackDispatchType === 'com.apple.streaming') { // Safari
      return true;
    } else if (track.label === 'id3') { // hls.js
      return true;
    } else if (track.label === 'Timed Metadata') { // video.js
      return true;
    }

    return false;
  }

  private setupHandlers(): void {
    if (this.media == null) { return; }

    this.media.textTracks.addEventListener('addtrack', this.onAddTrackHandler);
    this.media.textTracks.addEventListener('removetrack', this.onRemoveTrackHandler);
    this.media.addEventListener('play', this.onPlayHandler);
    this.media.addEventListener('pause', this.onPauseHandler);
  }

  private cleanupHandlers(): void {
    if (this.media == null) { return; }

    this.media.textTracks.removeEventListener('addtrack', this.onAddTrackHandler);
    this.media.textTracks.removeEventListener('removetrack', this.onRemoveTrackHandler);
    this.media.removeEventListener('play', this.onPlayHandler);
    this.media.removeEventListener('pause', this.onPauseHandler);
  }

  public destroy(): void {
    this.detachMedia();
  }

  private registerID3Track(): void {
    if (this.media == null) { return; }

    for (const track of Array.from(this.media.textTracks)) {
      if (!HLSFeeder.isID3Track(track)) { continue; }
      this.id3Tracks.push(track);
    }
  }

  private unregisterID3Track(): void {
    this.id3Tracks = [];
  }

  private onAddTrack(event: TrackEvent): void {
    const track = event.track!;
    if (!HLSFeeder.isID3Track(track)) { return; }

    this.id3Tracks.push(track);
  }

  private onRemoveTrack(event: TrackEvent): void {
    const track = event.track!;
    if (!HLSFeeder.isID3Track(track)) { return; }

    this.id3Tracks = this.id3Tracks.filter((track) => track !== track);
  }

  private interspact(): void {
    this.registerRenderingLoop();
    if (this.media == null) { return; }
    const current_time = this.media.currentTime;

    if (this.privious_time == null) {
      this.privious_time = current_time;
      return;
    }

    for (const track of this.id3Tracks) {
      const cues = Array.from(track.cues ?? []);
      if (cues.length === 0) { continue; }

      let prev_index: number | null = null;
      let curr_index: number | null = null;

      {
        let begin = 0, end = cues.length;
        while (begin + 1 < end) {
          const middle = Math.floor((begin + end) / 2);
          const start_time = cues[middle].startTime;

          if (current_time < start_time) {
            end = middle;
          } else {
            begin = middle;
          }
        }
        prev_index = begin;
      }
      {
        let begin = 0, end = cues.length;
        while (begin + 1 < end) {
          const middle = Math.floor((begin + end) / 2);
          const start_time = cues[middle].startTime;

          if (current_time < start_time) {
            end = middle;
          } else {
            begin = middle;
          }
        }
        curr_index = begin;
      }

      if (prev_index === null || curr_index === null || prev_index === curr_index){
        continue;
      }

      if (prev_index < curr_index) {
        for (let index = curr_index; index > prev_index; index--) {
          this.feedID3v2Cue(cues[index]);
        }
      } else {
        for (let index = prev_index; index < curr_index; index++) {
          this.feedID3v2Cue(cues[index]);
        }
      }
    }

    this.privious_time = current_time;
  }

  private registerRenderingLoop(): void {
    this.timer = requestAnimationFrame(this.interspactHandler);
  }

  private unregisterRenderingLoop(): void {
    if (this.timer == null) { return; }
    cancelAnimationFrame(this.timer);
    this.timer = null;
  }

  private onPlay(): void {
    if (this.timer != null) { return }
    this.registerRenderingLoop();
  }

  private onPause(): void {
    this.unregisterRenderingLoop();
  }

  private feedID3v2Cue(cue: TextTrackCue): void {
    if (cue.track == null) { return; }

    const id3 = cue as any;
    if (cue.track.inBandMetadataTrackDispatchType === 'com.apple.streaming') { // Safari
      if (id3.value.key === 'PRIV' && id3.value.info === 'aribb24.js') {
        this.feed(id3.value.data, cue.startTime, cue.startTime);
      } else if (id3.value.key === 'TXXX' && id3.value.info === 'aribb24.js') {
        this.feed(base64ToUint8Array(id3.value.data).buffer, cue.startTime, cue.startTime);
      }
    } else if (cue.track.label === 'id3') { // hls.js
      if (id3.value.key === 'PRIV' && id3.value.info === 'aribb24.js') {
        this.feed(id3.value.data, cue.startTime, cue.startTime);
      } else if (id3.value.key === 'TXXX' && id3.value.info === 'aribb24.js') {
        this.feed(base64ToUint8Array(id3.value.data).buffer, cue.startTime, cue.startTime);
      }
    } else if (cue.track.label === 'Timed Metadata') { // video.js
      if (id3.frame.key === 'PRIV' && id3.frame.owner === 'aribb24.js') {
        this.feed(id3.frame.data, cue.startTime, cue.startTime);
      } else if (id3.frame.key === 'TXXX' && id3.frame.description === 'aribb24.js') {
        this.feed(base64ToUint8Array(id3.frame.data).buffer, cue.startTime, cue.startTime);
      }
    }
  }

  public feedB24(data: ArrayBuffer, pts: number, dts?: number): void {
    this.feed(data, pts, pts ?? dts);
  }

  public feedID3(data: ArrayBuffer, pts: number, dts?: number): void {
    for (const frame of parseID3v2(data)) {
      switch (frame.id) {
        case 'PRIV': {
          if (frame.owner !== 'aribb24.js') { break; }
          this.feed(frame.data, pts, dts ?? pts);
          break;
        }
        case 'TXXX': {
          if (frame.description !== 'aribb24.js') { break; }
          this.feed(base64ToUint8Array(frame.text).buffer, pts, dts ?? pts);
          break;
        }
      }
    }
  }
}

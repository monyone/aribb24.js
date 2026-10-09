import { PartialFeederOption } from './feeder';
import { parseID3v2 } from '../../../util/id3';
import { base64ToUint8Array } from '../../../util/binary';
import DecodingFeeder from './decoding-feeder';

export default class HLSFeeder extends DecodingFeeder {
  private media: HTMLMediaElement | null = null;
  private timer: number | null = null;
  private id3Tracks: TextTrack[] = [];
  private id3TrackPriviousTimes: Map<TextTrack, number> = new Map<TextTrack, number>();
  private readonly onAddTrackHandler: ((event: TrackEvent) => void) = this.onAddTrack.bind(this);
  private readonly onRemoveTrackHandler: ((event: TrackEvent) => void) = this.onRemoveTrack.bind(this);
  private readonly onPlayHandler = this.onPlay.bind(this);
  private readonly onPauseHandler = this.onPause.bind(this);
  private readonly introspectHandler = this.introspect.bind(this);

  public constructor(option?: PartialFeederOption) {
    super(option);
  }

  public attachMedia(media: HTMLVideoElement): void {
    this.detachMedia();
    this.media = media;

    this.setupHandlers();
    this.registerID3Track();
    if (!this.media.paused) {
      this.registerRenderingLoop();
    }
  }

  public detachMedia(): void {
    this.unregisterRenderingLoop();
    this.unregisterID3Track();
    this.cleanupHandlers();

    this.media = null
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
    super.destroy();
    this.detachMedia();
  }

  protected disappearance(): void {
    super.disappearance();
    this.id3TrackPriviousTimes.clear();
  }

  private registerID3Track(): void {
    if (this.media == null) { return; }

    for (const track of Array.from(this.media.textTracks)) {
      if (!HLSFeeder.isID3Track(track)) { continue; }
      track.mode = 'hidden';
      this.id3Tracks.push(track);
    }
  }

  private unregisterID3Track(): void {
    this.id3Tracks = [];
    this.id3TrackPriviousTimes.clear();
  }

  private onAddTrack(event: TrackEvent): void {
    const track = event.track!;
    if (!HLSFeeder.isID3Track(track)) { return; }
    track.mode = 'hidden';
    this.id3Tracks.push(track);
  }

  private onRemoveTrack(event: TrackEvent): void {
    const track = event.track!;
    if (!HLSFeeder.isID3Track(track)) { return; }
    this.id3Tracks = this.id3Tracks.filter((t) => t !== track);
    this.id3TrackPriviousTimes.delete(track);
  }

  private introspect(): void {
    this.timer = null;
    this.registerRenderingLoop();

    if (this.media == null) { return; }
    const current_time = this.media.currentTime;

    for (const track of this.id3Tracks) {
      const cues = Array.from(track.cues ?? []);
      if (cues.length === 0) { continue; }

      // ない場合は現在時刻未満の 直近のstartTime を保存する
      if (!this.id3TrackPriviousTimes.has(track)) {
        let curr_index = 0;
        {
          let begin = -1, end = cues.length;
          while (begin + 1 < end) {
            const middle = Math.floor((begin + end) / 2);
            const start_time = cues[middle].startTime;

            if (current_time <= start_time) {
              end = middle;
            } else {
              begin = middle;
            }
          }
          curr_index = begin;
        }
        this.id3TrackPriviousTimes.set(track, cues[curr_index]?.startTime ?? Number.NEGATIVE_INFINITY);
        continue;
      }
      const privious_time = this.id3TrackPriviousTimes.get(track)!;

      let prev_index = 0, curr_index = 0;
      {
        let begin = -1, end = cues.length;
        while (begin + 1 < end) {
          const middle = Math.floor((begin + end) / 2);
          const start_time = cues[middle].startTime;

          if (privious_time < start_time) {
            end = middle;
          } else {
            begin = middle;
          }
        }
        prev_index = begin;
      }
      {
        let begin = -1, end = cues.length;
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

      if (cues[curr_index] != null) {
        this.id3TrackPriviousTimes.set(track, cues[curr_index].startTime);
      }

      if (prev_index < curr_index) {
        for (let index = prev_index + 1; index <= curr_index; index++) {
          this.feedID3v2Cue(cues[index]);
        }
      }
    }
  }

  private registerRenderingLoop(): void {
    if (this.timer != null){ return; }
    this.timer = requestAnimationFrame(this.introspectHandler);
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
        this.feed(base64ToUint8Array(id3.value.data), cue.startTime, cue.startTime);
      }
    } else if (cue.track.label === 'id3') { // hls.js
      if (id3.value.key === 'PRIV' && id3.value.info === 'aribb24.js') {
        this.feed(id3.value.data, cue.startTime, cue.startTime);
      } else if (id3.value.key === 'TXXX' && id3.value.info === 'aribb24.js') {
        this.feed(base64ToUint8Array(id3.value.data), cue.startTime, cue.startTime);
      }
    } else if (cue.track.label === 'Timed Metadata') { // video.js
      if (id3.frame.key === 'PRIV' && id3.frame.owner === 'aribb24.js') {
        this.feed(id3.frame.data, cue.startTime, cue.startTime);
      } else if (id3.frame.key === 'TXXX' && id3.frame.description === 'aribb24.js') {
        this.feed(base64ToUint8Array(id3.frame.data), cue.startTime, cue.startTime);
      }
    }
  }

  public feedB24(data: Uint8Array | ArrayBufferLike, pts: number, dts?: number): void {
    data = data instanceof Uint8Array ? data : new Uint8Array(data);
    this.feed(data, pts, dts ?? pts);
  }

  public feedID3(data: Uint8Array | ArrayBufferLike, pts: number, dts?: number): void {
    data = data instanceof Uint8Array ? data : new Uint8Array(data);

    for (const frame of parseID3v2(data)) {
      switch (frame.id) {
        case 'PRIV': {
          if (frame.owner !== 'aribb24.js') { break; }
          this.feed(frame.data, pts, dts ?? pts);
          break;
        }
        case 'TXXX': {
          if (frame.description !== 'aribb24.js') { break; }
          this.feed(base64ToUint8Array(frame.text), pts, dts ?? pts);
          break;
        }
      }
    }
  }
}

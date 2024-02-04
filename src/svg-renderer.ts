import SVGProvider from './svg-provider'
import HighResTextTrack from './utils/high-res-texttrack'
import DummyCue from './utils/dummy-cue'
import { readID3Size, binaryISO85591ToString, binaryUTF8ToString, base64ToUint8Array} from './utils/binary'

const DETECT_TIMEUPDATE_SEEKING_RANGE = 1;

export interface RendererOption {
  data_identifier?: number,
  data_group_id?: number,
  forceStrokeColor?: boolean | string,
  forceBackgroundColor?: string,
  normalFont?: string,
  gaijiFont?: string,
  drcsReplacement?: boolean,
  drcsReplaceMapping?: Record<string, string>,
  PRACallback?: (index: number) => unknown,
  keepAspectRatio?: boolean,
  enableAutoInBandMetadataTextTrackDetection?: boolean,
  useHighResTextTrack?: boolean,
  useHighResTimeupdate?: boolean,
  usePUA?: boolean,
}

export default class SVGRenderer {

  private media: HTMLVideoElement | null = null
  private id3Track: TextTrack | null = null
  private b24Track: TextTrack | null = null
  private subtitleElement: HTMLElement | null = null
  private svg: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private textContent: string | null = null;
  private prevCurrentTime: number | null = null
  private highResTimeupdatePollingId: number | null = null
  private isShowing: boolean = true
  private isOnSeeking: boolean = false
  private onB24CueChangeDrawed: boolean = false

  private readonly onID3AddtrackHandler: ((event: TrackEvent) => void) = this.onID3Addtrack.bind(this);
  private readonly onID3CueChangeHandler: (() => void) = this.onID3CueChange.bind(this);
  private readonly onB24CueChangeHandler: (() => void)  = this.onB24CueChange.bind(this);

  private readonly onHighResTimeupdateHandler: (() => void) =this.onHighResTimeupdate.bind(this);
  private readonly onTimeupdateHandler: (() => void) = this.onTimeupdate.bind(this);
  private readonly onCanplayHandler: (() => void) = this.onCanplay.bind(this);
  private readonly onPlayHandler: (() => void) = this.onPlay.bind(this);
  private readonly onPauseHandler: (() => void) = this.onPause.bind(this);
  private readonly onPauseAnimationHandler: (() => void) = this.onPauseAnimation.bind(this);
  private readonly onResumeAnimationHandler: (() => void) = this.onResumeAnimation.bind(this);
  private readonly onSeekingHandler: (() => void) = this.onSeeking.bind(this);
  private readonly onSeekedHandler: (() => void) = this.onSeeked.bind(this);

  private rendererOption: RendererOption | undefined
  private data_identifier: number
  private data_group_id: number

  public constructor(option?: RendererOption) {
    this.data_identifier = option?.data_identifier ?? 0x80 // default: caption
    this.data_group_id = option?.data_group_id ?? 0x01 // default: 1st language
    this.rendererOption = {
      ... option,
      data_identifier: this.data_identifier,
      data_group_id: this.data_group_id,
      keepAspectRatio: option?.keepAspectRatio ?? true, // default: true
      enableAutoInBandMetadataTextTrackDetection: option?.enableAutoInBandMetadataTextTrackDetection ?? true, // default: true
    }
  }

  public attachMedia(media: HTMLVideoElement, subtitleElement?: HTMLElement): void {
    this.detachMedia()
    this.media = media
    this.subtitleElement = subtitleElement ?? media.parentElement

    this.media.addEventListener('canplay', this.onCanplayHandler)
    this.media.addEventListener('play', this.onResumeAnimationHandler)
    this.media.addEventListener('pause', this.onPauseAnimationHandler)

    if (this.rendererOption?.useHighResTimeupdate) {
      this.media.addEventListener('play', this.onPlayHandler)
      this.media.addEventListener('pause', this.onPauseHandler)
    } else {
      this.media.addEventListener('timeupdate', this.onTimeupdateHandler)
    }
    this.prevCurrentTime = null;

    this.setupTrack()
    this.setupSVG()
  }

  public detachMedia(): void {
    this.cleanupSVG()
    this.cleanupTrack()

    this.media?.removeEventListener('canplay', this.onCanplayHandler)
    this.media?.removeEventListener('play', this.onPlayHandler)
    this.media?.removeEventListener('pause', this.onPauseHandler)
    this.media?.removeEventListener('play', this.onResumeAnimationHandler)
    this.media?.removeEventListener('pause', this.onPauseAnimationHandler)
    this.onPause();
    this.media?.removeEventListener('timeupdate', this.onTimeupdateHandler)
    this.prevCurrentTime = null;

    this.media = this.subtitleElement = null
  }

  public dispose(): void {
    this.detachMedia()
  }

  public getSVG(): SVGElement {
    return this.svg
  }

  public getTextContent(): string | null {
    return this.textContent;
  }

  public show(): void {
    this.isShowing = true

    this.svg.style.visibility = 'visible';
  }

  public hide(): void {
    this.isShowing = false

    this.svg.style.visibility = 'hidden';
  }

  public isPresent() {
    return this.onB24CueChangeDrawed
  }

  public pushRawData(pts: number, data: Uint8Array): boolean {
    const provider: SVGProvider = new SVGProvider(data, pts);
    const estimate = provider.render({
      ... this.rendererOption,
    })
    if (estimate == null) { return false; }

    const end_time = Number.isFinite(estimate.endTime) ? estimate.endTime : Number.MAX_SAFE_INTEGER;
    return this.addB24Cue(pts, end_time, data)
  }

  public pushBase64Data(pts: number, base64: string): boolean {
    const data = base64ToUint8Array(base64);
    return this.pushRawData(pts, data);
  }

  // for b24.js compatibility
  public pushData(pid: number, uint8array: Uint8Array, pts: number): boolean {
    return this.pushRawData(pts, uint8array);
  }

  public pushID3v2PRIVData(pts: number, owner: string, data: Uint8Array): boolean {
    if (owner !== 'aribb24.js') { return false; }
    return this.pushRawData(pts, data);
  }

  public pushID3v2TXXXData(pts: number, description: string, text: string): boolean {
    if (description !== 'aribb24.js') { return false; }
    return this.pushBase64Data(pts, text);
  }

  public pushID3v2Data(pts: number, data: Uint8Array): boolean {
    let result = false;

    for (let begin = 0; begin < data.length;) {
      const id3_start = begin;

      if (begin + 3 > data.length) { break; }
      if (!(data[begin + 0] === 0x49 && data[begin + 1] === 0x44 && data[begin + 2] === 0x33)) {
        if (begin === 0) {
          begin += 5; // ffmpeg 6.1 未満には ID3 を 5 bytes 消すので、それの対策を入れると、修正済みだと 5 bytes パディングされうる
          continue;
        } else {
          break;
        }
      }
      begin += 3 + 2 /* version */ + 1 /* flag */;

      if (begin + 4 > data.length) { break; }
      const id3_size = readID3Size(data, begin + 0, begin + 4);
      begin += 4;

      const id3_end = id3_start + 3 + 2 + 1 + 4 + id3_size;
      if (id3_end > data.length) { break; }

      for (let frame = begin; frame < id3_end;) {
        const frame_begin = frame;

        if (frame + 4 > data.length) { break; }
        const frame_name = binaryISO85591ToString(data, frame + 0, frame + 4);
        frame += 4;

        if (frame + 4 > data.length) { break; }
        const frame_size = readID3Size(data, frame + 0, frame + 4);
        frame += 4 + 2 /* flag */;

        const frame_end = frame_begin + 4 + 4 + 2 + frame_size;
        if (frame_end > data.length) { break; }

        if (frame_name === 'PRIV') {
          const PRIV_begin = frame;
          const PRIV_end = frame_end;

          while (data[frame] !== 0 && frame < frame_end) { frame++; }

          const owner = binaryISO85591ToString(data, PRIV_begin, frame);
          const pes = new Uint8Array(Array.prototype.slice.call(data, frame + 1, PRIV_end));

          if (this.pushID3v2PRIVData(pts, owner, pes)) { result = true; }
        } else if (frame_name === 'TXXX') {
          const encoding = data[frame + 0];
          const description_begin = frame + 1;

          if (encoding === 0x03) { // UTF-8
            while (data[frame] !== 0 && frame < frame_end) { frame++; }
            const description_end = frame;
            frame += 1;

            const data_begin = frame;
            while (data[frame] !== 0 && frame < frame_end) { frame++; }
            const data_end = frame;

            const description = binaryUTF8ToString(data, description_begin, description_end);
            const text = binaryUTF8ToString(data, data_begin, data_end);

            if (this.pushID3v2TXXXData(pts, description, text)) { result = true; }
          } else if(encoding === 0x00) { // Laten-1
            while (data[frame] !== 0 && frame < frame_end) { frame++; }
            const description_end = frame;
            frame += 1;

            const data_begin = frame;
            while (data[frame] !== 0 && frame < frame_end) { frame++; }
            const data_end = frame;

            const description = binaryISO85591ToString(data, description_begin, description_end);
            const text = binaryISO85591ToString(data, data_begin, data_end);

            if (this.pushID3v2TXXXData(pts, description, text)) { result = true; }
          }
        }

        frame = frame_end;
      }

      begin = id3_start + 3 + 2 + 1 + 4 + id3_size;
      if (begin + 3 > data.length) { continue; }
      // id3 footer
      if (!(data[begin + 0] === 0x33 && data[begin + 1] === 0x44 && data[begin + 2] === 0x49)) { continue; }
      begin += 3 + 2 /* version */ + 1 /* flags */ + 4 /* size */;
    }

    return result;
  }

  public setInBandMetadataTextTrack(track: TextTrack): void {
    this.id3Track?.removeEventListener('cuechange', this.onID3CueChangeHandler)

    this.id3Track = track
    this.id3Track.mode = 'hidden'

    this.id3Track.addEventListener('cuechange', this.onID3CueChangeHandler)
  }

  private pushID3v2Cue(cue: TextTrackCue): boolean {
    if (!this.id3Track) { return false; }

    const start_time = cue.startTime;
    const id3_cue = cue as any;

    if (this.id3Track.inBandMetadataTrackDispatchType === '15260DFFFF49443320FF49443320000F'){ // Legacy Edge
      return this.pushID3v2Data(start_time, new Uint8Array(id3_cue.data));
    } else if (this.id3Track.inBandMetadataTrackDispatchType === 'com.apple.streaming') { // Safari
      if (id3_cue.value.key === 'PRIV') {
        return this.pushID3v2PRIVData(start_time, id3_cue.value.info, new Uint8Array(id3_cue.value.data));
      } else if (id3_cue.value.key === 'TXXX') {
        return this.pushID3v2TXXXData(start_time, id3_cue.value.info, id3_cue.value.data);
      }
    } else if (this.id3Track.label === 'id3') { // hls.js
      if (id3_cue.value.key === 'PRIV') {
        return this.pushID3v2PRIVData(start_time, id3_cue.value.info, new Uint8Array(id3_cue.value.data));
      } else if (id3_cue.value.key === 'TXXX') {
        return this.pushID3v2TXXXData(start_time, id3_cue.value.info, id3_cue.value.data);
      }
    } else if (this.id3Track.label === 'Timed Metadata') { // video.js
      if (id3_cue.frame.key === 'PRIV') {
        return this.pushID3v2PRIVData(start_time, id3_cue.frame.owner, new Uint8Array(id3_cue.frame.data));
      } else if (id3_cue.frame.key === 'TXXX') {
        return this.pushID3v2TXXXData(start_time, id3_cue.frame.description, id3_cue.frame.data);
      }
    }

    return false;
  }

  private onID3CueChange() {
    if (!this.id3Track) { return }

    if (this.isOnSeeking) { return }

    /*
    const activeCues = this.id3Track.activeCues ?? []
    for (let i = activeCues.length - 1; i >= 0; i--) {
      if (this.pushID3v2Cue(activeCues[i])) { break; }
    }
    */
    this.onTimeupdate();
  }

  private addB24Cue (start_time: number, end_time: number, data: Uint8Array): boolean {
    if (!this.b24Track) { return false; }
    if (!SVGProvider.detect(data, this.rendererOption)) { return false; }

    const CueClass = window.VTTCue ?? window.TextTrackCue

    const b24_cue = new CueClass(start_time, end_time, '');
    (b24_cue as any).data = data;

    if (window.VTTCue) {
      this.b24Track.addCue(b24_cue)
    } else if (window.TextTrackCue) {
      const hasCue = Array.prototype.some.call(this.b24Track.cues ?? [], (target) => {
        return target.startTime === start_time
      })
      if (hasCue) { return false; }

      if (this.b24Track.cues) {
        const removed_cues: TextTrackCue[] = [];
        for (let i = this.b24Track.cues.length - 1; i >= 0; i--) {
          if (this.b24Track.cues[i].startTime >= start_time) {
            removed_cues.push(this.b24Track.cues[i])
            this.b24Track.removeCue(this.b24Track.cues[i])
          }
        }
        this.b24Track.addCue(b24_cue)
        for (let i = removed_cues.length - 1; i >= 0; i--) {
          this.b24Track.addCue(removed_cues[i])
        }
      }
    }

    return true;
  }

  private onB24CueChange() {
    if (!this.media || !this.b24Track) {
      this.onB24CueChangeDrawed = false
      return
    }

    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    if (this.b24Track.activeCues && this.b24Track.activeCues.length > 0) {
      const lastCue = this.b24Track.activeCues[this.b24Track.activeCues.length - 1] as any

      if ((lastCue.startTime <= this.media.currentTime && this.media.currentTime <= lastCue.endTime) && !this.isOnSeeking) {
        // なんか Win Firefox で Cue が endTime 過ぎても activeCues から消えない場合があった、バグ?

        const provider: SVGProvider = new SVGProvider(lastCue.data, lastCue.startTime);
        let rendered = false

        if (this.isShowing) {
          const result = provider.render({
            ... this.rendererOption,
            svg: this.svg
          })

          if (result?.PRA != null) {
             this.rendererOption?.PRACallback?.(result.PRA);
          }

          rendered = result?.rendered ?? false
          this.textContent = result?.textContent ?? null;
        }

        this.onB24CueChangeDrawed = true
      } else {
        this.onB24CueChangeDrawed = false
        this.textContent = null;
      }

      for (let i = this.b24Track.activeCues.length - 2; i >= 0; i--) {
        const cue = this.b24Track.activeCues[i]
        cue.endTime = Math.min(cue.endTime, lastCue.startTime)
        if (cue.startTime === cue.endTime) { // .. if duplicate subtitle appeared
          this.b24Track.removeCue(cue);
        }
      }
    } else{
      this.onB24CueChangeDrawed = false
      this.textContent = null;
    }
  }

  private onHighResTimeupdate() {
    this.onTimeupdate();
    this.highResTimeupdatePollingId = window.requestAnimationFrame(this.onHighResTimeupdateHandler);
  }

  private onTimeupdate() {
    if (!this.media) { return; }
    if (this.prevCurrentTime == null) {
      this.prevCurrentTime = this.media.currentTime;
      return;
    }

    if (!this.id3Track || !this.id3Track.cues || this.id3Track.cues.length === 0) {
      this.prevCurrentTime = this.media.currentTime;
      return;
    }

    if (this.isOnSeeking) {
      this.prevCurrentTime = this.media.currentTime;
      return;
    }
    if (Math.abs(this.media.currentTime - this.prevCurrentTime) > DETECT_TIMEUPDATE_SEEKING_RANGE) {
      this.prevCurrentTime = this.media.currentTime;
      return;
    }

    const dummyCue = new DummyCue(Number.NEGATIVE_INFINITY, this.id3Track.cues[0].startTime);
    let prevIndex: number | null = null;
    let currIndex: number | null = null;

    const cues: TextTrackCue[] = [ dummyCue ]; // ... this.id3Track.cues
    for (let i = 0; i < this.id3Track.cues.length; i++) {
      cues.push(this.id3Track.cues[i]);
    }

    {
      let begin = 0, end = cues.length;
      while (begin + 1 < end) {
        const currentTime = this.prevCurrentTime;
        const middle = Math.floor((begin + end) / 2);
        const startTime = cues[middle].startTime;

        if (currentTime < startTime) {
          end = middle;
        } else {
          begin = middle;
        }
      }
      prevIndex = begin;
    }
    {
      let begin = 0, end = cues.length;
      while (begin + 1 < end) {
        const currentTime = this.media.currentTime;
        const middle = Math.floor((begin + end) / 2);
        const startTime = cues[middle].startTime;

        if (currentTime < startTime) {
          end = middle;
        } else {
          begin = middle;
        }
      }
      currIndex = begin;
    }

    if (prevIndex === null || currIndex === null || prevIndex === currIndex){
      this.prevCurrentTime = this.media.currentTime;
      return;
    }

    if (prevIndex < currIndex) {
      for (let index = currIndex; index > prevIndex; index--) {
        const cue = cues[index];
        if (cue === dummyCue) { continue; }

        if (this.pushID3v2Cue(cue)) { break; }
      }
    } else {
      for (let index = prevIndex; index < currIndex; index++) {
        const cue = cues[index];
        if (cue === dummyCue) { continue; }

        if (this.pushID3v2Cue(cue)) { break; }
      }
    }

    this.prevCurrentTime = this.media.currentTime;
  }

  private onCanplay() {
    if (this.id3Track) {
      this.id3Track.mode = 'hidden';
    }
    if (this.b24Track) {
      this.b24Track.mode = 'hidden';
    }

    if (this.media != null && this.prevCurrentTime == null) {
      this.prevCurrentTime = this.media.currentTime - Number.MIN_VALUE;
    }
  }

  private onPlay() {
    if (this.highResTimeupdatePollingId == null) {
      this.onHighResTimeupdate();
    }
  }

  private onPause() {
    if (this.highResTimeupdatePollingId != null) {
      window.cancelAnimationFrame(this.highResTimeupdatePollingId);
      this.highResTimeupdatePollingId = null;
    }
  }

  private onPauseAnimation() {
    (this.svg as unknown as SVGSVGElement).pauseAnimations();
  }

  private onResumeAnimation() {
    (this.svg as unknown as SVGSVGElement).unpauseAnimations();
  }

  private onSeeking() {
    this.isOnSeeking = true
    this.onB24CueChange()
  }

  private onSeeked() {
    this.isOnSeeking = false
  }

  private onID3Addtrack(event: TrackEvent): void {
    if (!this.media) {
      return;
    }

    const textTrack = event.track!;
    if (textTrack.kind !== 'metadata') { return; }

    if ( textTrack.inBandMetadataTrackDispatchType === '15260DFFFF49443320FF49443320000F' // Legacy Edge
      || textTrack.inBandMetadataTrackDispatchType === 'com.apple.streaming' // Safari
      || textTrack.label === 'id3' // hls.js
    ) {
      this.setInBandMetadataTextTrack(textTrack);
    }
  }

  private setupTrack(): void {
    if (!this.media) {
      return
    }

    if (this.rendererOption?.useHighResTextTrack) {
      this.b24Track = new HighResTextTrack(this.media);
      (this.b24Track as HighResTextTrack).startPolling();
    } else {
      const aribb24js_label = `ARIB B24 Japanese SVG (data_identifier=0x${this.data_identifier.toString(16)}, data_group_id=${this.data_group_id})`
      for (let i = 0; i < this.media.textTracks.length; i++) {
        const track = this.media.textTracks[i]
        if (track.label === aribb24js_label) {
          this.b24Track = track
          break
        }
      }
      if (!this.b24Track) {
        this.b24Track = this.media.addTextTrack('metadata', aribb24js_label, 'ja')
        this.b24Track.mode = 'hidden'
      }
    }

    this.b24Track.addEventListener('cuechange', this.onB24CueChangeHandler)

    if (this.rendererOption?.enableAutoInBandMetadataTextTrackDetection) {
      for (let i = 0; i < this.media.textTracks.length; i++) {
        const track = this.media.textTracks[i];

        if (track.kind !== 'metadata') { continue; }

        if ( track.inBandMetadataTrackDispatchType === '15260DFFFF49443320FF49443320000F' // Legacy Edge
          || track.inBandMetadataTrackDispatchType === 'com.apple.streaming' // Safari
          || track.label === 'id3' // hls.js
        ) {
          this.setInBandMetadataTextTrack(track);
          break;
        }
      }

      this.media.textTracks.addEventListener('addtrack', this.onID3AddtrackHandler)
    }

    this.media.addEventListener('seeking', this.onSeekingHandler)
    this.media.addEventListener('seeked', this.onSeekedHandler)
  }

  private setupSVG(): void {
    if (!this.media || !this.subtitleElement){
      return
    }
    this.svg.style.position = 'absolute'
    this.svg.style.top = this.svg.style.left = '0'
    this.svg.style.pointerEvents = 'none'
    this.svg.style.width = '100%'
    this.svg.style.height = '100%'

    this.subtitleElement.appendChild(this.svg)
  }

  private cleanupTrack(): void {
    if (this.b24Track) {
      if (this.rendererOption?.useHighResTextTrack) {
        (this.b24Track as HighResTextTrack).stopPolling();
      } else {
        if (this.b24Track.cues) {
          for (let i = this.b24Track.cues.length - 1; i >= 0; i--) {
            this.b24Track.removeCue(this.b24Track.cues[i])
          }
        }
      }
    }

    this.b24Track?.removeEventListener('cuechange', this.onB24CueChangeHandler)

    this.id3Track?.removeEventListener('cuechange', this.onID3CueChangeHandler)

    this.media?.removeEventListener('seeking', this.onSeekingHandler)
    this.media?.removeEventListener('seeked', this.onSeekedHandler)
    this.media?.textTracks.removeEventListener('addtrack', this.onID3AddtrackHandler)

    this.b24Track = this.id3Track = null
  }

  private cleanupSVG(): void {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
  }
}

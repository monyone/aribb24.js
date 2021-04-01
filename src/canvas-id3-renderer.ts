import CanvasProvider from './canvas-provider'

interface RendererOption {
  width?: number,
  height?: number,
  forceStrokeColor?: string,
  normalFont?: string,
  gaijiFont?: string,
  drcsReplacement?: boolean,
}

export default class CanvasID3Renderer {
  private media: HTMLMediaElement | null = null
  private track: TextTrack | null = null
  private subtitleElement: HTMLElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private mutationObserver: MutationObserver | null = null
  private isOnSeeking: boolean = false
  private onCueChangeDrawed: boolean = false

  private onAddtrackHandler: ((event: TrackEvent) => void) | null = null
  private onCueChangeHandler: (() => void) | null = null
  private onSeekingHandler: (() => void) | null = null
  private onSeekedHandler: (() => void) | null = null
  private onResizeHandler: (() => void) | null = null

  private rendererOption: RendererOption | undefined

  public constructor(option?: RendererOption) {
    this.rendererOption = option
  }

  public attachMedia(media: HTMLMediaElement, subtitleElement?: HTMLElement): void {
    this.media = media
    this.subtitleElement = subtitleElement ?? media.parentElement
    this.setupTrack()
    this.setupCanvas()
  }

  public detachMedia(): void {
    this.cleanupCanvas()
    this.cleanupTrack()
    this.media = this.subtitleElement = null
  }

  public dispose(): void {
    this.detachMedia()
  }

  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas
  }

  public refresh(): void {
    this.onResize()
  }

  public show(): void {
    if (!this.track) {
      return
    }

    this.track.mode = 'hidden'
    this.onCueChange()
  }

  public hide(): void {
    if (!this.track) {
      return
    }

    this.track.mode = 'disabled'
    if (!this.canvas) {
      return
    }

    const ctx = this.canvas.getContext('2d')
    if (!ctx) { return }
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private onCueChange() {
    if (!this.media || !this.track || !this.canvas) {
      this.onCueChangeDrawed = false
      return
    }

    const canvasContext = this.canvas.getContext('2d')
    if (!canvasContext) {
      this.onCueChangeDrawed = false
      return
    }
    canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const activeCues = this.track.activeCues
    if (activeCues && activeCues.length > 0) {
      const lastCue = activeCues[activeCues.length - 1] as any

      // mark for endTime value not infinite bug in hls.js
      if (!lastCue.marked) { lastCue.endTime = Number.MAX_SAFE_INTEGER; }
      lastCue.marked = true;

      const binary = window.atob(lastCue.value.data || lastCue.value.info);
      const pes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) { pes[i] = binary.charCodeAt(i); }

      const provider: CanvasProvider = new CanvasProvider(pes, lastCue.startTime);
      const estimate = provider.render() // calc endTime
      if (estimate != null && estimate.endTime !== Number.MAX_SAFE_INTEGER) {
        lastCue.endTime = estimate.endTime;
      }

      if ((lastCue.startTime <= this.media.currentTime && this.media.currentTime <= lastCue.endTime) && !this.isOnSeeking) {
        // なんか Win Firefox で Cue が endTime 過ぎても activeCues から消えない場合があった、バグ?
        // Safari の id3 は終了時刻が求まったタイミングで値を上書きされるので、改めて上書きしてチェック

        provider.render({
          ... this.rendererOption,
          canvas: this.canvas ?? undefined,
          width: this.rendererOption?.width ?? this.canvas.width,
          height: this.rendererOption?.height ?? this.canvas.height,
        })

        this.onCueChangeDrawed = true
      } else {
        this.onCueChangeDrawed = false
      }

      for (let i = 0; i < activeCues.length - 1; i++) {
        const cue = activeCues[i]
        cue.endTime = Math.min(cue.endTime, lastCue.startTime)
      }
    } else{
      this.onCueChangeDrawed = false
    }
  }

  private onSeeking() {
    this.isOnSeeking = true
    this.onCueChange()
  }

  private onSeeked() {
    this.isOnSeeking = false
  }

  private onResize() {
    if (!this.canvas || !this.media || !this.track) {
      return
    }

    const style = window.getComputedStyle(this.media)
    const purpose_width = Math.max((this.media as any).videoWidth, Number.parseInt(style.width) * window.devicePixelRatio)
    const purpose_height = Math.max((this.media as any).videoHeight, Number.parseInt(style.height) * window.devicePixelRatio)

    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.width = purpose_width
    this.canvas.height = purpose_height

    const canvasContext = this.canvas.getContext('2d')
    if (!canvasContext) { return }
    canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.onCueChangeDrawed) { return }

    // onCueChange とほぼ同じだが、this.onCueChangeDrawed を変更しない
    const activeCues = this.track.activeCues
    if (activeCues && activeCues.length > 0) {
      const lastCue = activeCues[activeCues.length - 1] as any

      if (!lastCue.marked) { return }

      const binary = window.atob(lastCue.value.data || lastCue.value.info);
      const pes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) { pes[i] = binary.charCodeAt(i); }

      const provider: CanvasProvider = new CanvasProvider(pes, lastCue.startTime);
      const estimate = provider.render() // calc endTime
      if (estimate != null && estimate.endTime !== Number.MAX_SAFE_INTEGER) {
        lastCue.endTime = estimate.endTime;
      }

      if ((lastCue.startTime <= this.media.currentTime && this.media.currentTime <= lastCue.endTime) && !this.isOnSeeking) {
        provider.render({
          ... this.rendererOption,
          canvas: this.canvas ?? undefined,
          width: this.rendererOption?.width ?? this.canvas.width,
          height: this.rendererOption?.height ?? this.canvas.height,
        })
      }
    }
  }

  private onAddtrack(event: TrackEvent): void {
    if (!this.media) {
      return;
    }

    const textTrack = event.track!;
    if (textTrack.kind !== 'metadata') { return; }

    if (textTrack.inBandMetadataTrackDispatchType === 'com.apple.streaming' || textTrack.label === 'id3') {
      this.track = textTrack;

      this.track.mode = 'hidden'
      this.onCueChangeHandler = this.onCueChange.bind(this)
      this.onSeekingHandler = this.onSeeking.bind(this)
      this.onSeekedHandler = this.onSeeked.bind(this)
      this.track.addEventListener('cuechange', this.onCueChangeHandler)
      this.media.addEventListener('seeking', this.onSeekingHandler)
      this.media.addEventListener('seeked', this.onSeekedHandler) 
    }
  }

  private setupTrack(): void {
    if (!this.media) {
      return
    }

    for (let i = 0; i < this.media.textTracks.length; i++) {
      const track = this.media.textTracks[i];

      if (track.kind !== 'metadata') { continue; }
      if (track.inBandMetadataTrackDispatchType === 'com.apple.streaming' || track.label === 'id3') {
        this.track = track;
        break;
      }
    }

    if (!this.track) {
      this.onAddtrackHandler = this.onAddtrack.bind(this)
      this.media.textTracks.addEventListener('addtrack', this.onAddtrackHandler)
    } else {
      this.track.mode = 'hidden'
      this.onCueChangeHandler = this.onCueChange.bind(this)
      this.onSeekingHandler = this.onSeeking.bind(this)
      this.onSeekedHandler = this.onSeeked.bind(this)
      this.track.addEventListener('cuechange', this.onCueChangeHandler)
      this.media.addEventListener('seeking', this.onSeekingHandler)
      this.media.addEventListener('seeked', this.onSeekedHandler)
    }
  }

  private setupCanvas(): void {
    if (!this.media || !this.subtitleElement){
      return
    }
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = this.canvas.style.left = '0'
    this.canvas.style.pointerEvents = 'none'
    this.onResize()

    this.subtitleElement.appendChild(this.canvas)
    this.onResizeHandler = this.onResize.bind(this)
    window.addEventListener('resize', this.onResizeHandler)
    this.media.addEventListener('loadeddata', this.onResizeHandler)
    this.media.addEventListener('playing', this.onResizeHandler)

    this.mutationObserver = new MutationObserver(() => {
      this.onResize()
    })
    this.mutationObserver.observe(this.media, {
      attributes: true,
      attributeFilter: ['style']
    })
  }

  private cleanupTrack(): void {
    if (!this.track) {
      return
    }

    if (this.onCueChangeHandler) {
      this.track.removeEventListener('cuechange', this.onCueChangeHandler)
      this.onCueChangeHandler = null
    }
    if (this.media){
      if (this.onSeekingHandler) {
        this.media.removeEventListener('seeking', this.onSeekingHandler)
        this.onSeekingHandler = null
      }
      if (this.onSeekedHandler) {
        this.media.removeEventListener('seeked', this.onSeekedHandler)
        this.onSeekedHandler = null
      }
      if (this.onAddtrackHandler) {
        this.media.textTracks.removeEventListener('addtrack', this.onAddtrackHandler)
        this.onAddtrackHandler = null
      }
    }

    this.track = null
  }

  private cleanupCanvas(): void {
    if (this.onResizeHandler) {
      window.removeEventListener('resize', this.onResizeHandler)
    }
    if (this.onResizeHandler && this.media) {
      this.media.removeEventListener('loadeddata', this.onResizeHandler)
      this.media.removeEventListener('playing', this.onResizeHandler)
    }
    this.onResizeHandler = null

    if(this.mutationObserver){
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }

    if (this.canvas && this.subtitleElement){
      this.subtitleElement.removeChild(this.canvas)
    }
    this.canvas = this.subtitleElement = null
  }
}

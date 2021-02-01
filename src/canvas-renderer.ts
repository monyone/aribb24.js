import CanvasProvider from '@/canvas-provider'

interface RendererOption {
  width?: number,
  height?: number,
  forceStrokeColor?: string,
  normalFont?: string,
  gaijiFont?: string,
}

export default class CanvasRenderer {
  private media: HTMLMediaElement | null = null
  private track: TextTrack | null = null
  private subtitleElement: HTMLElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private lastCueChangeCanvas: HTMLCanvasElement = document.createElement('canvas')
  private mutationObserver: MutationObserver | null = null
  private isOnSeeking: boolean = false
  
  private onCueChangeHandler: (() => void) | null = null
  private onSeekingHandler: (() => void) | null = null
  private onSeekedHandler: (() => void) | null = null
  private onResizeHandler: (() => void) | null = null

  private rendererOption: RendererOption | undefined
  
  public constructor(option?: RendererOption) {
    this.rendererOption = option
  }

  public attachMedia(media: HTMLMediaElement, subtitleElement: HTMLElement): void {
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

  public pushData(pid: number, uint8array: Uint8Array, pts: number): void {
    if (!this.media || !this.track) {
      return
    }

    const style = window.getComputedStyle(this.media)
    const purpose_width = Math.max((this.media as any).videoWidth, Number.parseInt(style.width) * window.devicePixelRatio)
    const purpose_height = Math.max((this.media as any).videoHeight, Number.parseInt(style.height) * window.devicePixelRatio)

    const provider = new CanvasProvider(uint8array, {
      ... this.rendererOption,
      width: (this.rendererOption?.width ?? purpose_width),
      height: (this.rendererOption?.height ?? purpose_height),
    })

    const cue = provider.render(pts)
    if (!cue) {
      return
    }
    this.track.addCue(cue)
  }

  private onCueChange() {
    if (!this.media || !this.track || !this.canvas) {
      return
    }

    this.lastCueChangeCanvas.width = this.canvas.width
    this.lastCueChangeCanvas.height = this.canvas.height

    const canvasContext = this.canvas.getContext('2d')
    const lastCueChangeCanvasContext = this.lastCueChangeCanvas.getContext('2d')
    if (!canvasContext) {
      if (!lastCueChangeCanvasContext) { 
        return
      }
      lastCueChangeCanvasContext.clearRect(0, 0, this.lastCueChangeCanvas.width, this.lastCueChangeCanvas.height);
      return
    }
    canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const activeCues = this.track.activeCues
    if (activeCues && activeCues.length > 0) {
      const lastCue = activeCues[activeCues.length - 1]
      const lastCanvas = (lastCue as any).canvas as HTMLCanvasElement 

      if (lastCue.endTime > this.media.currentTime && !this.isOnSeeking) { 
        // なんか Win Firefox で Cue が endTime 過ぎても消えない場合があった、バグ?
        canvasContext.drawImage(lastCanvas, 0, 0, lastCanvas.width, lastCanvas.height, 0, 0, this.canvas.width, this.canvas.height)
      }

      for (let i = 0; i < activeCues.length - 1; i++) {
        const cue = activeCues[i]
        cue.endTime = Math.min(cue.endTime, lastCue.startTime)
      }
    }

    if (lastCueChangeCanvasContext) {
      lastCueChangeCanvasContext.drawImage(this.canvas,
        0, 0, this.canvas.width, this.canvas.height,
        0, 0, this.lastCueChangeCanvas.width, this.lastCueChangeCanvas.height
      )
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
    if (!this.canvas || !this.media) {
      return
    }

    const style = window.getComputedStyle(this.media)
    const purpose_width = Math.max((this.media as any).videoWidth, Number.parseInt(style.width) * window.devicePixelRatio)
    const purpose_height = Math.max((this.media as any).videoHeight, Number.parseInt(style.height) * window.devicePixelRatio)

    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.width = purpose_width
    this.canvas.height = purpose_height

    /*
      このコードは高画質化(都度PESレンダリング方式) では使えない
      その際は直前の onCueChange で描画したかをメモっておく
      clearRect した後、描画した場合のみ再度描画を行えば良い
      逆にメモ用キャンバスは今の方式だから必要なだけで将来的にはいらない
    */    
    const canvasContext = this.canvas.getContext('2d')
    if (!canvasContext) { return }
    canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    canvasContext.drawImage(this.lastCueChangeCanvas,
      0, 0, this.lastCueChangeCanvas.width, this.lastCueChangeCanvas.height,
      0, 0, this.canvas.width, this.canvas.height
    )
  }

  private setupTrack(): void {
    if (!this.media) {
      return
    }

    const aribb24js_label = 'ARIB B24 Japanese'
    for (let i = 0; i < this.media.textTracks.length; i++) {
      const track = this.media.textTracks[i]
      if (track.label === aribb24js_label) {
        this.track = track
        break
      }
    }
    if (!this.track) {
      this.track = this.media.addTextTrack('metadata', aribb24js_label, 'ja')
      this.track.mode = 'hidden'
    }
    this.onCueChangeHandler = this.onCueChange.bind(this)
    this.onSeekingHandler = this.onSeeking.bind(this)
    this.onSeekedHandler = this.onSeeked.bind(this)
    this.track.addEventListener('cuechange', this.onCueChangeHandler)
    this.media.addEventListener('seeking', this.onSeekingHandler)
    this.media.addEventListener('seeked', this.onSeekedHandler)
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

    const cues = this.track.cues
    if (cues) {
      for (let i = cues.length - 1; i >= 0; i--) {
        this.track.removeCue(cues[i])
      }
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

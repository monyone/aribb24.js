import CanvasProvider from '@/canvas-provider'

interface RendererOption {
  width?: number,
  height?: number,
  normalFont?: string,
  gaijiFont?: string,
}

export default class CanvasRenderer {
  private media: HTMLMediaElement | null
  private track: TextTrack | null
  private subtitleElement: HTMLElement | null
  private canvas: HTMLCanvasElement | null
  private mutationObserver: MutationObserver | null
  private onCueChangeHandler: (() => void) | null
  private onResizeHandler: (() => void) | null

  private width: number | undefined
  private height: number | undefined
  private normalFont: string | undefined
  private gaijiFont: string | undefined
  
  public constructor(option?: RendererOption) {
    this.media = null
    this.track = null
    this.subtitleElement = null
    this.canvas = null
    this.mutationObserver = null
    this.onCueChangeHandler = null
    this.onResizeHandler = null

    this.width = option?.width
    this.height = option?.height
    this.normalFont = option?.normalFont
    this.gaijiFont = option?.gaijiFont
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

    const provider = new CanvasProvider(uint8array, {
      width: (this.width ?? (this.media as any).videoWidth) * window.devicePixelRatio,
      height: (this.height ?? (this.media as any).videoHeight) * window.devicePixelRatio,
      normalFont: this.normalFont,
      gaijiFont: this.gaijiFont
    })

    const cue = provider.render(pts)
    if (!cue) {
      return
    }
    this.track.addCue(cue)
  }

  private onCueChange() {
    if (!this.track || !this.canvas) {
      return
    }

    const ctx = this.canvas.getContext('2d')
    if (!ctx) { return }
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cues = this.track.activeCues
    if (cues && cues.length > 0) {
      const lastCue = cues[cues.length - 1]
      const lastCanvas = (lastCue as any).canvas as HTMLCanvasElement

      ctx.drawImage(lastCanvas, 0, 0, lastCanvas.width, lastCanvas.height, 0, 0, this.canvas.width, this.canvas.height)

      for (let i = 0; i < cues.length - 1; i++) {
        const cue = cues[i]
        cue.endTime = lastCue.startTime
      }
    }
  }

  private onResize() {
    if (!this.canvas || !this.media) {
      return
    }

    const style = window.getComputedStyle(this.media)
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.width = ((this.media as any).videoWidth ?? Number.parseInt(style.width)) * window.devicePixelRatio
    this.canvas.height = ((this.media as any).videoHeight ?? Number.parseInt(style.height)) * window.devicePixelRatio

    this.onCueChange()
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
    this.track.addEventListener('cuechange', this.onCueChangeHandler)
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

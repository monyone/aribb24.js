import CanvasProvider from '@/canvas-provider'

export default class CanvasRenderer {
  private media: HTMLMediaElement | null
  private track: TextTrack | null
  private subtitleElement: HTMLElement | null
  private canvas: HTMLCanvasElement | null
  private onCueChangeHandler: (() => void) | null
  private onResizeHandler: (() => void) | null

  public constructor() {
    this.media = null
    this.track = null
    this.subtitleElement = null
    this.canvas = null
    this.onCueChangeHandler = null
    this.onResizeHandler = null
  }

  public attachMedia(media: HTMLMediaElement, subtitleElement: HTMLElement): void {
    this.media = media
    this.subtitleElement = subtitleElement ?? media.parentElement
    this.getTrack()
    this.getCanvas()
  }

  public detachMedia(): void {
    this.cleanupCanvas()
    this.cleanupTrack()
    this.media = null
  }

  public pushData(pid: number, uint8array: Uint8Array, pts: number): void {
    if (!this.media || !this.track) {
      return
    }

    const provider = new CanvasProvider(uint8array)
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
    this.canvas.style.width = style.width
    this.canvas.style.height = style.height
    this.canvas.width = Number.parseInt(style.width, 10) * window.devicePixelRatio
    this.canvas.height = Number.parseInt(style.height, 10) * window.devicePixelRatio

    this.onCueChange()
  }

  private getTrack(): void {
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
      this.track = this.media.addTextTrack('subtitles', aribb24js_label, 'ja')
    }
    this.onCueChangeHandler = this.onCueChange.bind(this)
    this.track.addEventListener('cuechange', this.onCueChangeHandler)
  }

  private getCanvas(): void {
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
    if (!this.onResizeHandler || !this.media) {
      return
    }
    window.removeEventListener('resize', this.onResizeHandler)
    this.media.removeEventListener('loadeddata', this.onResizeHandler)
    this.media.removeEventListener('playing', this.onResizeHandler)

    this.onResizeHandler = null

    if (this.canvas && this.subtitleElement){
      this.subtitleElement.removeChild(this.canvas)
    }
    this.canvas = null
  }
}

import CanvasProvider from './canvas-provider'

interface RendererOption {
  width?: number,
  height?: number,
  data_identifer?: number,
  data_group_id?: number,
  forceStrokeColor?: string,
  forceBackgroundColor?: string,
  normalFont?: string,
  gaijiFont?: string,
  drcsReplacement?: boolean,
  keepAspectRatio?: boolean,
  enableRawCanvas?: boolean,
  useStrokeText?: boolean,
}

export default class CanvasB24Renderer {
  private media: HTMLMediaElement | null = null
  private track: TextTrack | null = null
  private subtitleElement: HTMLElement | null = null
  private viewCanvas: HTMLCanvasElement | null = null
  private rawCanvas: HTMLCanvasElement | null = null
  private resizeObserver: ResizeObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private isShowing: boolean = true
  private isOnSeeking: boolean = false
  private onCueChangeDrawed: boolean = false

  private onCueChangeHandler: (() => void) | null = null
  private onSeekingHandler: (() => void) | null = null
  private onSeekedHandler: (() => void) | null = null
  private onResizeHandler: (() => void) | null = null

  private rendererOption: RendererOption | undefined
  private data_identifer: number
  private data_group_id: number

  public constructor(option?: RendererOption) {
    this.data_identifer = option?.data_identifer ?? 0x80 // default: caption
    this.data_group_id = option?.data_group_id ?? 0x01 // default: 1st language
    this.rendererOption = {
      ... option,
      data_identifer: this.data_identifer,
      data_group_id: this.data_group_id,
      keepAspectRatio: option?.keepAspectRatio ?? true, // default: true
    }
  }

  public attachMedia(media: HTMLMediaElement, subtitleElement?: HTMLElement): void {
    this.detachMedia()
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

  public getViewCanvas(): HTMLCanvasElement | null {
    return this.viewCanvas
  }

  public getRawCanvas(): HTMLCanvasElement | null {
    return this.rawCanvas
  }

  public refresh(): void {
    this.onResize()
  }

  public show(): void {
    this.isShowing = true
    this.onResize()
  }

  public hide(): void {
    this.isShowing = false

    if (this.viewCanvas) {
      const viewContext = this.viewCanvas.getContext('2d')
      if (viewContext) {
        viewContext.clearRect(0, 0, this.viewCanvas.width, this.viewCanvas.height);
      }
    }

    if (this.rawCanvas) {
      const rawContext = this.rawCanvas.getContext('2d')
      if (rawContext) {
        rawContext.clearRect(0, 0, this.rawCanvas.width, this.rawCanvas.height);
      }
    }
  }

  public pushData(pid: number, uint8array: Uint8Array, pts: number): void {
    if (!this.media || !this.track) {
      return
    }

    const provider = new CanvasProvider(uint8array, pts)
    // if (!provider.check()) { return }

    const result = provider.render({
      ... this.rendererOption,
      width: undefined, // ここはデフォルト値で負荷を軽くする
      height: undefined, // ここはデフォルト値で負荷を軽くする
    })

    if (!result){ return }

    const { startTime, endTime } = result

    const CueClass = window.VTTCue ?? window.TextTrackCue;
    const cue = new CueClass(startTime, endTime, '');
    (cue as any).provider = provider;

    if (window.VTTCue) {
      this.track.addCue(cue)
    } else if (window.TextTrackCue) {
      const hasCue = Array.prototype.some.call(this.track.cues ?? [], (target) => {
        return target.startTime === startTime
      })
      if (hasCue) { return }

      if (this.track.cues) {
        const removed_cues: TextTrackCue[] = [];
        for (let i = this.track.cues.length - 1; i >= 0; i--) {
          if (this.track.cues[i].startTime >= cue.startTime) {
            removed_cues.push(this.track.cues[i])
            this.track.removeCue(this.track.cues[i])
          }
        }
        this.track.addCue(cue)
        for (let i = removed_cues.length - 1; i >= 0; i--) {
          this.track.addCue(removed_cues[i])
        }
      }
    }
  }

  private onCueChange() {
    if (!this.media || !this.track) {
      this.onCueChangeDrawed = false
      return
    }

    if (this.viewCanvas) {
      const viewContext = this.viewCanvas.getContext('2d')
      if (viewContext) {
        viewContext.clearRect(0, 0, this.viewCanvas.width, this.viewCanvas.height);
      }
    }

    if (this.rawCanvas) {
      const rawContext = this.rawCanvas.getContext('2d')
      if (rawContext) {
        rawContext.clearRect(0, 0, this.rawCanvas.width, this.rawCanvas.height);
      }
    }

    const activeCues = this.track.activeCues
    if (activeCues && activeCues.length > 0) {
      const lastCue = activeCues[activeCues.length - 1]
      const provider: CanvasProvider = (lastCue as any).provider
      
      if ((lastCue.startTime <= this.media.currentTime && this.media.currentTime <= lastCue.endTime) && !this.isOnSeeking) {
        // なんか Win Firefox で Cue が endTime 過ぎても activeCues から消えない場合があった、バグ?

        // render view canvas
        if (this.isShowing && this.viewCanvas) {
          provider.render({
            ... this.rendererOption,
            canvas: this.viewCanvas,
            width: this.rendererOption?.width ?? this.viewCanvas.width,
            height: this.rendererOption?.height ?? this.viewCanvas.height,
          })
        }

        // render raw canvas
        if (this.isShowing && this.rawCanvas) {
          provider.render({
            ... this.rendererOption,
            canvas: this.rawCanvas,
            width: this.rawCanvas.width,
            height: this.rawCanvas.height,
            keepAspectRatio: true,
          })
        }

        this.onCueChangeDrawed = true
      } else {
        this.onCueChangeDrawed = false
      }

      for (let i = activeCues.length - 2; i >= 0; i--) {
        const cue = activeCues[i]
        cue.endTime = Math.min(cue.endTime, lastCue.startTime)
        if (cue.startTime === cue.endTime) { // if duplicate subtitle appeared ..
          this.track.removeCue(cue);
        }
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
    if (!this.media) {
      return
    }

    const style = window.getComputedStyle(this.media)
    const media_width = Number.parseInt(style.width) * window.devicePixelRatio
    const media_height = Number.parseInt(style.height) * window.devicePixelRatio
    const video_width = (this.media as any).videoWidth
    const video_height = (this.media as any).videoHeight

    if (this.viewCanvas) {
      this.viewCanvas.width = Math.round(media_width)
      this.viewCanvas.height = Math.round(media_height)
    }
    if (this.rawCanvas) {
      this.rawCanvas.width = video_width
      this.rawCanvas.height = video_height
    }

    if (!this.track) {
      return
    }

    if (this.viewCanvas) {
      const viewContext = this.viewCanvas.getContext('2d')
      if (viewContext) {
        viewContext.clearRect(0, 0, this.viewCanvas.width, this.viewCanvas.height);
      }
    }

    if (this.rawCanvas) {
      const rawContext = this.rawCanvas.getContext('2d')
      if (rawContext) {
        rawContext.clearRect(0, 0, this.rawCanvas.width, this.rawCanvas.height);
      }
    }

    if (!this.onCueChangeDrawed) { return }

    // onCueChange とほぼ同じだが、this.onCueChangeDrawed を変更しない
    const activeCues = this.track.activeCues
    if (activeCues && activeCues.length > 0) {
      const lastCue = activeCues[activeCues.length - 1]
      const provider: CanvasProvider = (lastCue as any).provider

      if ((lastCue.startTime <= this.media.currentTime && this.media.currentTime <= lastCue.endTime) && !this.isOnSeeking) {
        if (this.isShowing && this.viewCanvas) {
          provider.render({
            ... this.rendererOption,
            canvas: this.viewCanvas,
            width: this.rendererOption?.width ?? this.viewCanvas.width,
            height: this.rendererOption?.height ?? this.viewCanvas.height,
          })
        }

        if (this.isShowing && this.rawCanvas) {
          provider.render({
            ... this.rendererOption,
            canvas: this.rawCanvas,
            width: this.rawCanvas.width,
            height: this.rawCanvas.height,
            keepAspectRatio: true,
          })
        }
      }
    }
  }

  private setupTrack(): void {
    if (!this.media) {
      return
    }

    const aribb24js_label = `ARIB B24 Japanese (data_identifer=0x${this.data_identifer.toString(16)}, data_group_id=${this.data_group_id})`
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
    this.viewCanvas = document.createElement('canvas')
    this.viewCanvas.style.position = 'absolute'
    this.viewCanvas.style.top = this.viewCanvas.style.left = '0'
    this.viewCanvas.style.pointerEvents = 'none'
    this.viewCanvas.style.width = '100%'
    this.viewCanvas.style.height = '100%'

    if (this.rendererOption?.enableRawCanvas) {
      this.rawCanvas = document.createElement('canvas')
    }

    this.onResize()

    this.subtitleElement.appendChild(this.viewCanvas)

    this.onResizeHandler = this.onResize.bind(this)
    this.media.addEventListener('resize', this.onResizeHandler)

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize()
      })
      this.resizeObserver.observe(this.media)
    } else {
      window.addEventListener('resize', this.onResizeHandler)

      if (window.MutationObserver) {
        this.mutationObserver = new MutationObserver(() => {
          this.onResize()
        })
        this.mutationObserver.observe(this.media, {
          attributes: true,
          attributeFilter: ['class', 'style']
        })
      }
    }
  }

  private cleanupTrack(): void {
    if (this.track) {
      const cues = this.track.cues
      if (cues) {
        for (let i = cues.length - 1; i >= 0; i--) {
          this.track.removeCue(cues[i])
        }
      }
    }

    if (this.track && this.onCueChangeHandler) {
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
      if (this.media) {
        this.media.removeEventListener('resize', this.onResizeHandler)
      }

      this.onResizeHandler = null
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }

    if (this.viewCanvas && this.subtitleElement) {
      this.subtitleElement.removeChild(this.viewCanvas)
    }

    if (this.viewCanvas) {
      this.viewCanvas.width = this.viewCanvas.height = 0
    }

    if (this.rawCanvas) {
      this.rawCanvas.width = this.rawCanvas.height = 0
    }

    this.viewCanvas = this.rawCanvas = null
  }
}

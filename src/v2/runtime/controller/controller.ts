import ARIBB24Feeder from "../feeder/feeder";
import ARIBB24Renderer from "../renderer/renderer";
import { ControllerOption } from "./controller-option";
import EventEmitter from "./eventemitter";
import { Event, EventType, BuiltinSound } from "./events";

export default class PGSController {
  // Option
  private option: ControllerOption;
  // Video
  private media: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  // Container Resize Handler
  private readonly onContainerResizeHandler = this.onContainerResize.bind(this);
  private resize_observer: ResizeObserver | null = null;
  // Video Resize Handler
  private readonly onVideoResizeHandler = this.onVideoResize.bind(this);
  // Timeupdate Handler
  private readonly onTimeupdateHandler = this.onTimeupdate.bind(this);
  private timer: number | null = null;
  // Seeking Handler
  private readonly onSeekingHandler = this.onSeeking.bind(this);
  // Play/Pause Handler
  private readonly onPlayHandler = this.onPlay.bind(this);
  private readonly onPauseHandler = this.onPause.bind(this);
  // Renderer
  private renderers: ARIBB24Renderer[] = [];
  private privious_pts: number | null = null;
  // Feeder
  private feeder: ARIBB24Feeder | null = null;
  // Control
  private isShowing: boolean = true;
  // Event Bus
  private emitter: EventEmitter = new EventEmitter();

  public constructor(option?: Partial<ControllerOption>) {
    this.option = {
      ... option,
    }
  }

  public attachMedia(media: HTMLVideoElement, container?: HTMLElement): void {
    if (this.container) {
      this.renderers.forEach((renderer) => renderer.onDetach());
    }
    this.media = media;
    this.container = container ?? media.parentElement!;
    if (this.container) {
      this.renderers.forEach((renderer) => renderer.onAttach(this.container!));
    }
    this.feeder?.prepare(this.media.currentTime);
    this.setupHandlers();
  }

  public detachMedia(): void {
    if (this.container) {
      this.renderers.forEach((renderer) => renderer.onDetach());
    }
    this.cleanupHandlers()
    this.media = this.container = null
  }

  private setupHandlers() {
    if (!this.media || !this.container) { return; }

    // setup media handler
    this.media.addEventListener('seeking', this.onSeekingHandler);
    this.media.addEventListener('resize', this.onVideoResizeHandler);
    this.media.addEventListener('play', this.onPlayHandler);
    this.media.addEventListener('pause', this.onPauseHandler);

    // setup container Resize Handler
    this.resize_observer = new ResizeObserver(this.onContainerResizeHandler);
    this.resize_observer.observe(this.container);
  }

  private cleanupHandlers() {
    // cleanup media seeking handler
    this.media?.removeEventListener('seeking', this.onSeekingHandler);
    this.media?.removeEventListener('resize', this.onVideoResizeHandler);
    this.media?.removeEventListener('play', this.onPlayHandler);
    this.media?.removeEventListener('pause', this.onPauseHandler);

    // setup container Resize Handler
    if (this.container) {
      this.resize_observer?.unobserve(this.container);
    }
    this.resize_observer?.disconnect();
    this.resize_observer = null;
  }

  public attachFeeder(feeder: ARIBB24Feeder) {
    this.detachFeeder();
    this.feeder = feeder;
    this.feeder.onAttach();

    if (this.media != null) {
      this.feeder.prepare(this.media.currentTime);
    }
  }

  public detachFeeder() {
    this.feeder?.onDetach();
    this.feeder = null;
  }

  public attachRenderer(renderer: ARIBB24Renderer) {
    renderer.onDetach();
    this.renderers.push(renderer);
    if (this.container) {
      renderer.onAttach(this.container);
    }
  }

  public detachRenderer(renderer: ARIBB24Renderer) {
    renderer.onDetach();
    this.renderers = this.renderers.filter((elem) => elem !== renderer);
  }

  public on<T extends keyof Event>(type: T, handler: ((payload: Event[T]) => void)): void {
    this.emitter.on(type, handler);
  }
  public off<T extends keyof Event>(type: T, handler: ((payload: Event[T]) => void)): void {
    this.emitter.off(type, handler);
  }

  private onSeeking() {
    this.feeder?.onSeeking();
    this.renderers.forEach((renderer) => renderer.onSeeking());
    this.clear();
  }

  private onContainerResize(entries: ResizeObserverEntry[]) {
    if (!this.media || !this.container) { return; }

    const target = entries.find((entry) => entry.target === this.container);
    if (!target) { return; }

    const width = target.devicePixelContentBoxSize[0].inlineSize;
    const height = target.devicePixelContentBoxSize[0].blockSize;

    this.renderers.forEach((renderer) => {
      if (!renderer.onContainerResize(width, height)) { return; }
      this.paint(true);
    });
  }

  private onVideoResize() {
    if (!this.media || !this.container) { return; }

    this.renderers.forEach((renderer) => {
      if (!renderer.onVideoResize(this.media!.videoWidth, this.media!.videoHeight)) { return; }
      this.paint(true);
    });
  }

  private onTimeupdate() {
    // not showing, do not show
    if (!this.isShowing) { return; }

    this.registerRenderingLoop();
    this.paint(false);
  }

  private registerRenderingLoop(): void {
    this.timer = requestAnimationFrame(this.onTimeupdateHandler);
  }

  private unregisterRenderingLoop(): void {
    if (this.timer == null) { return; }
    cancelAnimationFrame(this.timer);
    this.timer = null;
  }

  private onPlay(): void {
    if (this.media != null) {
      this.feeder?.prepare(this.media.currentTime);
    }

    if (this.timer != null) { return }
    this.registerRenderingLoop();
  }

  private onPause(): void {
    this.unregisterRenderingLoop();
  }

  private paint(repaint: boolean) {
    // precondition
    if (!this.media) { return; }

    const currentTime = this.media.currentTime;
    const current = this.feeder?.content(currentTime) ?? null;
    if (repaint) {
      // paint
      if (current == null || currentTime >= current.pts + current.duration) {
        this.renderers.forEach((renderer) => renderer.clear());
      } else {
        this.renderers.forEach((renderer) => renderer.render(current.state, current.data, current.info));
      }

      return;
    }

    // render
    if (current == null) { // current is null
      if (this.privious_pts == null) { return; }
      this.renderers.forEach((renderer) => renderer.clear());
      this.privious_pts = null;
    } else if (currentTime >= current.pts + current.duration) { // cue duration expired, clear
      const end = current.pts + current.duration;
      if (this.privious_pts === end) { return; }
      this.renderers.forEach((renderer) => renderer.clear());
      this.privious_pts = end; // end is finite
    } else { // render
      if (this.privious_pts === current.pts) { return; }
      this.renderers.forEach((renderer) => renderer.render(current.state, current.data, current.info));
      this.privious_pts = current.pts

      // Builtin Sound Callback
      for (const token of current.data.filter((data) => data.tag === 'BuiltinSoundReplay')) {
        this.emitter.emit(EventType.BuiltinSound, BuiltinSound.from(token.sound));
      }
    }
  }

  private clear() {
    // clearRect for viewer
    this.renderers.forEach((renderer) => renderer.clear());
    // clear privious information
    this.privious_pts = null;
  }

  public show(): void {
    this.isShowing = true;
    if (this.timer == null) {
      this.registerRenderingLoop();
    }
    this.renderers.forEach((renderer) => renderer.show());
  }

  public hide(): void {
    this.isShowing = false;
    this.unregisterRenderingLoop();
    this.renderers.forEach((renderer) => renderer.hide());
  }

  public showing(): boolean {
    return this.isShowing;
  }
}

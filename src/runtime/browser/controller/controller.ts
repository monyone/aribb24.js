import ARIBB24Feeder, { FeederPresentationData } from "../feeder/feeder";
import ARIBB24Renderer from "../renderer/renderer";
import { ControllerOption } from "./controller-option";
import EventEmitter from "./eventemitter";
import { Event, EventType, BuiltinSound } from "./events";

export default class Controller {
  // Option
  private option: ControllerOption;
  // Video
  private media: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  // Container Resize Handler
  private readonly onContainerResizeHandler = this.onContainerResize.bind(this);
  private resize_observer: ResizeObserver | null = null;
  private resize_content_box: [number, number] | null = null;
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
  private previous: [FeederPresentationData, number] | null = null;
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
    this.detachMedia();
    this.media = media;
    this.container = container ?? media.parentElement!;
    this.setupHandlers();
    this.registerRenderingLoop();

    if (this.feeder) { this.attachFeeder(this.feeder); }
    // attach 時に detach されて削除されたりするので、コピーして attach する
    Array.from(this.renderers).forEach((renderer) => { this.attachRenderer(renderer); });
  }

  public detachMedia(): void {
    this.clear();
    if (this.container) {
      this.renderers.forEach((renderer) => renderer.onDetach());
    }
    this.cleanupHandlers()
    this.media = this.container = null
    this.unregisterRenderingLoop();
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
    this.resize_content_box = null;
  }

  public attachFeeder(feeder: ARIBB24Feeder) {
    this.detachFeeder();

    this.feeder = feeder;
    this.feeder.onAttach();
  }

  public detachFeeder() {
    this.feeder?.onDetach();
    this.feeder = null;
  }

  public attachRenderer(renderer: ARIBB24Renderer) {
    this.detachRenderer(renderer);

    this.renderers.push(renderer);
    if (this.resize_content_box) {
      const [width, height] = this.resize_content_box;
      renderer.onContainerResize(width, height);
    }
    if (this.media) {
      renderer.onVideoResize(this.media.videoWidth, this.media.videoHeight);
    }
    if (this.container) {
      renderer.onAttach(this.container);
    }

    this.repaint(renderer);
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

    const width = target.devicePixelContentBoxSize != null ? target.devicePixelContentBoxSize[0].inlineSize : Math.floor(target.contentBoxSize[0].inlineSize * devicePixelRatio);
    const height = target.devicePixelContentBoxSize != null ? target.devicePixelContentBoxSize[0].blockSize : Math.floor(target.contentBoxSize[0].blockSize * devicePixelRatio);
    this.resize_content_box = [width, height];

    this.renderers.forEach((renderer) => {
      if (!renderer.onContainerResize(width, height)) { return; }
      this.repaint(renderer);
    });
  }

  private onVideoResize() {
    if (!this.media || !this.container) { return; }

    this.renderers.forEach((renderer) => {
      if (!renderer.onVideoResize(this.media!.videoWidth, this.media!.videoHeight)) { return; }
      this.repaint(renderer);
    });
  }

  private onTimeupdate() {
    this.timer = null;
    this.registerRenderingLoop();
    this.paint();
  }

  private registerRenderingLoop(): void {
    if (this.timer != null) { return; }
    this.timer = requestAnimationFrame(this.onTimeupdateHandler);
  }

  private unregisterRenderingLoop(): void {
    if (this.timer == null) { return; }
    cancelAnimationFrame(this.timer);
    this.timer = null;
  }

  private onPlay(): void {
    this.renderers.forEach((renderer) => {
      renderer.onPlay();
    });
  }

  private onPause(): void {
    this.renderers.forEach((renderer) => {
      renderer.onPause();
    });
  }

  private paint() {
    // precondition
    if (!this.media) { return; }

    const currentTime = this.media.currentTime;
    const current = this.feeder?.content(currentTime) ?? null;
    const previous = this.previous?.[0] ?? null;
    const previous_pts = this.previous?.[1] ?? null;

    // render
    if (current == null) { // current is null
      if (this.previous == null) { return; }
      this.renderers.forEach((renderer) => renderer.clear());
      this.previous = null;
    } else if (currentTime >= current.pts + current.duration) { // cue duration expired, clear
      const end = current.pts + current.duration;
      if (current === previous && previous_pts === end) { return; }
      this.renderers.forEach((renderer) => renderer.clear());
      this.previous = [current, end]; // end is finite
    } else { // render
      if (current === previous && previous_pts === current.pts) { return; }
      this.renderers.forEach((renderer) => renderer.render(structuredClone(current.state), structuredClone(current.data), structuredClone(current.info)));
      this.previous = [current, current.pts];

      // Builtin Sound Callback
      if (this.isShowing) { // Hide 中に開始した場合は鳴らさない
        for (const token of current.data.filter((data) => data.tag === 'BuiltinSoundReplay')) {
          this.emitter.emit(EventType.BuiltinSound, BuiltinSound.from(token.sound));
        }
      }
    }
  }

  private repaint(renderer?: ARIBB24Renderer) {
    // precondition
    if (!this.media) { return; }

    const renderers = renderer == null ? this.renderers : [renderer];
    const currentTime = this.media.currentTime;
    const current = this.feeder?.content(currentTime) ?? null;
    if (current == null || currentTime >= current.pts + current.duration) {
      renderers.forEach((renderer) => renderer.clear());
    } else {
      renderers.forEach((renderer) => renderer.render(structuredClone(current.state), structuredClone(current.data), structuredClone(current.info)));
    }
  }

  private clear() {
    // clearRect for viewer
    this.renderers.forEach((renderer) => renderer.clear());
    // clear previous information
    this.previous = null;
  }

  public show(): void {
    this.isShowing = true;
    this.renderers.forEach((renderer) => renderer.show());
  }

  public hide(): void {
    this.isShowing = false;
    this.renderers.forEach((renderer) => renderer.hide());
  }

  public showing(): boolean {
    return this.isShowing;
  }
}

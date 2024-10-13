import ARIBB24Feeder from "../feeder/feeder";
import ARIBB24Renderer from "../renderer/renderer";
import { ControllerOption } from "./controller-option";

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
  private readonly onSeekedHandler = this.onSeeked.bind(this);
  // Renderer
  private renderers: ARIBB24Renderer[] = [];
  private privious_pts: number | null = null;
  // Feeder
  private feeder: ARIBB24Feeder | null = null;
  // Control
  private isShowing: boolean = true;

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
    this.setupHandlers();

    // prepare Event Loop
    this.onTimeupdate();
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
    this.media.addEventListener('seeked', this.onSeekedHandler);
    this.media.addEventListener('resize', this.onVideoResizeHandler);

    // setup container Resize Handler
    this.resize_observer = new ResizeObserver(this.onContainerResizeHandler);
    this.resize_observer.observe(this.container);
  }

  private cleanupHandlers() {
    // cleanup media seeking handler
    if (this.media) {
      this.media.removeEventListener('seeking', this.onSeekingHandler);
      this.media.removeEventListener('seeked', this.onSeekedHandler);
      this.media.removeEventListener('resize', this.onVideoResizeHandler);
    }

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

  private onSeeking() {
    this.feeder?.onSeeking();
    this.renderers.forEach((renderer) => renderer.onSeeking());
    this.clear();
  }

  private onSeeked() {
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
    this.timer = requestAnimationFrame(this.onTimeupdateHandler);

    this.paint(false);
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
        this.renderers.forEach((renderer) => renderer.render(current.state, current.data));
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
      this.renderers.forEach((renderer) => renderer.render(current.state, current.data));
      this.privious_pts = current.pts
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
      this.timer = requestAnimationFrame(this.onTimeupdateHandler);
    }
    this.onTimeupdate();
  }

  public hide(): void {
    this.isShowing = false;
    if (this.timer != null) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
    this.clear();
  }

  public showing(): boolean {
    return this.isShowing;
  }
}

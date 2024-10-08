import ARIBB24Feeder from "../feeder/feeder";
import ARIBB24Renderer from "../renderer/renderer";
import { ARIBB24ControllerOption } from "./controller-option";

export default class PGSController {
  // Option
  private option: ARIBB24ControllerOption;
  // Video
  private media: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  // Timeupdate Handler
  private readonly onTimeupdateHandler = this.onTimeupdate.bind(this);
  private timer: number | null = null;
  // Seeking Handler
  private readonly onSeekingHandler = this.onSeeking.bind(this);
  private readonly onSeekedHandler = this.onSeeked.bind(this);
  // Renderer
  private renderers: ARIBB24Renderer[] = [];
  private priviousPts: number | null = null;
  // Feeder
  private feeder: ARIBB24Feeder | null = null;
  // Control
  private isShowing: boolean = true;

  public constructor(option?: Partial<ARIBB24ControllerOption>) {
    this.option = {
      ... option,
    }
  }

  public attachMedia(media: HTMLVideoElement, container?: HTMLElement): void {
    if (this.container) {
      this.renderers.forEach((renderer) => renderer.onDetach(this.container!));
    }
    this.media = media;
    this.container = container ?? media.parentElement!;
    if (this.container) {
      this.renderers.forEach((renderer) => renderer.onAttach(this.container!));
    }
    this.setupHandlers();
  }

  public detachMedia(): void {
    if (this.container) {
      this.renderers.forEach((renderer) => renderer.onDetach(this.container!));
    }
    this.cleanupHandlers()
    this.media = this.container = null
  }

  private setupHandlers() {
    if (!this.media || !this.container) { return; }

    // setup media handler
    this.media.addEventListener('seeking', this.onSeekingHandler);
    this.media.addEventListener('seeked', this.onSeekedHandler);

    // prepare Event Loop
    this.onTimeupdate();
  }

  private cleanupHandlers() {
    // cleanup media seeking handler
    if (this.media) {
      this.media.removeEventListener('seeking', this.onSeekingHandler);
      this.media.removeEventListener('seeked', this.onSeekedHandler);
    }
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
    this.renderers.push(renderer);
    if (this.container) {
      renderer.onAttach(this.container);
    }
  }

  public detachRenderer(renderer: ARIBB24Renderer) {
    if (this.container) {
      renderer.onDetach(this.container);
    }
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

  private onContainerResize() {
    if (!this.media || !this.container) { return; }

    if (this.feeder == null) {
      this.renderers.forEach((renderer) => renderer.onContainerResize(this.container!));
      return;
    }

    this.paint(true);
  }

  private onVideoResize() {
    if (!this.media || !this.container) { return; }

    if (this.feeder == null ) {
      this.renderers.forEach((renderer) => renderer.onVideoResize(this.media!));
      return;
    }

    this.paint(true);
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
    const content = this.feeder?.content(currentTime) ?? null;
    // If no content this time
    if (content == null) { return; }

    // repaint
    if (repaint) {
      this.renderers.forEach((renderer) => renderer.render(content.data));
      return;
    }

    // If already rendered, ignore it
    if (this.priviousPts === content.pts) { return; }
    this.renderers.forEach((renderer) => renderer.render(content.data));

    // Update privious information
    this.priviousPts = content.pts;
  }

  private clear() {
    // clearRect for viewer
    this.renderers.forEach((renderer) => renderer.clear());
    // clear privious information
    this.priviousPts = null;
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

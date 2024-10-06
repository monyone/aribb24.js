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
  private renderer: ARIBB24Renderer | null = null;
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
    this.media = media;
    this.container = container ?? media.parentElement!;
    this.renderer?.onattach(this.container);
    this.setupHandlers();
  }

  public detachMedia(): void {
    if (this.container) { this.renderer?.ondetach(this.container); }
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
    this.feeder = feeder;
    this.feeder.onattach();
  }

  public detachFeeder() {
    this.feeder?.ondetach();
    this.feeder = null;
  }

  public attachRenderer(renderer: ARIBB24Renderer) {
    this.renderer = renderer;
    if (this.container) { this.renderer?.onattach(this.container); }
  }

  public detachRenderer() {
    if (this.container) { this.renderer?.ondetach(this.container); }
    this.renderer = null;
  }

  private onSeeking() {
    this.feeder?.onseeking();
    this.renderer?.onseeking();
    this.clear();
  }

  private onSeeked() {
    this.clear();
  }

  private onTimeupdate() {
    // not showing, do not show
    if (!this.isShowing) { return; }
    this.timer = requestAnimationFrame(this.onTimeupdateHandler);

    // precondition
    if (this.media == null || this.feeder == null) { return; }

    const currentTime = this.media.currentTime;
    const content = this.feeder.content(currentTime) ?? null;
    if (content == null) { return; }

    // If already rendered, ignore it
    if (this.priviousPts === content.pts) { return ; }
    this.renderer?.render(content);

    // Update privious information
    this.priviousPts = content.pts;
  }

  private clear() {
    // clearRect for viewer
    this.renderer?.clear();
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

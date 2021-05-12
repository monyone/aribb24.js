class HighResMetadataTextTrackCueList extends Array<TextTrackCue> implements TextTrackCueList{
  public addCue(cue: TextTrackCue) {
    this.push(cue);
  }

  public removeCue(cue: TextTrackCue) {
    const index = this.findIndex((c) => c === cue);
    if (index < 0) { return; }

    this.splice(index, 1);
  }

  public getCueById(id :string) {
    return this.find((c) => c.id === id) ?? null;
  }
}

export default class HighResMetadataTextTrack implements TextTrack {

  private media: HTMLMediaElement;
  private all: HighResMetadataTextTrackCueList = new HighResMetadataTextTrackCueList();
  private active: HighResMetadataTextTrackCueList = new HighResMetadataTextTrackCueList();

  private readonly polling_handler: (() => any) = this.polling.bind(this);
  private polling_id: number | null = null;

  public constructor(media: HTMLMediaElement) {
    this.media = media;
  }

  public startPolling() {
    this.polling_id = window.requestAnimationFrame(this.polling_handler);
  }

  public endPolling() {
    if (this.polling_id == null) { return; }
    window.cancelAnimationFrame(this.polling_id);
    this.polling_id = null;
  }

  private polling() {
    const old_active = this.active;
    const new_active = this.activeCues;

    if (old_active.length !== new_active.length) {
      let event: CustomEvent | null = null;
      try {
        event = new CustomEvent('cuechange');
      } catch { // for IE11
        event = document.createEvent('CustomEvent');
        event.initCustomEvent('cuechange', false, false, {});
      }

      if (event != null) {
        this.dispatchEvent(event);
        if (this.oncuechange) { this.oncuechange.call(this, event); }
      }
    } else {
      for (let i = 0; i < new_active.length; i++) {
        if (old_active[i] !==  new_active[i]) {
          let event: CustomEvent | null = null;
          try {
            event = new CustomEvent('cuechange');
          } catch { // for IE11
            event = document.createEvent('CustomEvent');
            event.initCustomEvent('cuechange', false, false, {});
          }

          if (event != null) {
            this.dispatchEvent(event);
            if (this.oncuechange) { this.oncuechange.call(this, event); }
            break;
          }
        }
      }
    }

    this.polling_id = window.requestAnimationFrame(this.polling_handler);
  }

  public readonly cues: TextTrackCueList = this.all;
  public get activeCues(): TextTrackCueList {
    const in_range_cues = new HighResMetadataTextTrackCueList(... this.all.filter((cue) => {
      return (cue.startTime <= this.media.currentTime && this.media.currentTime <= cue.endTime);
    }))

    in_range_cues.sort((a, b) => {
      if (a.startTime === b.startTime) {
        return -(a.endTime - b.endTime);
      } else {
        return (a.startTime - b.startTime);
      }
    })

    this.active = in_range_cues;
    return this.active;
  }

  public getCueById(id: string) {
    return this.all.getCueById(id);
  }

  public addCue(cue: TextTrackCue) {
    this.all.addCue(cue);
  }
  public removeCue(cue: TextTrackCue) {
    this.all.removeCue(cue);
  }

  public oncuechange: ((this: TextTrack, ev: Event) => any) | null = null;

  public readonly id: string = "";
  public readonly kind: TextTrackKind = "metadata";
  public readonly label: string = "";
  public readonly language: string = "ja-JP";
  public readonly mode: TextTrackMode = "hidden";
  public readonly inBandMetadataTrackDispatchType: string = "";
  public readonly sourceBuffer = null;

  // for ie11 (EventTarget を継承できないため)
  private listeners: ((this: TextTrack, ev: Event) => any)[] = [];
  public addEventListener(type: 'cuechange', listener: (this: TextTrack, ev: Event) => any) {
    this.listeners.push(listener);
  }
  public removeEventListener(type: 'cuechange', listener: (this: TextTrack, ev: Event) => any) {
    const index = this.listeners.findIndex((cb) => cb === listener);
    if (index < 0) { return; }
    this.listeners.splice(index, 1);
  }
  public dispatchEvent(ev: Event): boolean {
    if (ev.type !== 'cuechange') { return true; }
    this.listeners.forEach((listener) => listener.call(this, ev));
    return true;
  }
}

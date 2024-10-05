export default class DummyCue implements TextTrackCue {
  public startTime: number;
  public endTime: number;

  public id: string = '';
  public pauseOnExit: boolean = false;

  public onenter: ((this: TextTrackCue, ev: Event) => any) | null = null;
  public onexit: ((this: TextTrackCue, ev: Event) => any) | null = null ;

  public readonly track: TextTrack | null = null;

  public constructor(startTime: number, endTime: number) {
    this.startTime = startTime;
    this.endTime = endTime;
  }

  // for ie11 (EventTarget を継承できないため)
  public addEventListener<K extends keyof TextTrackCueEventMap>(type: K, listener: (this: TextTrackCue, ev: TextTrackCueEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void {}
  public removeEventListener<K extends keyof TextTrackCueEventMap>(type: K, listener: (this: TextTrackCue, ev: TextTrackCueEventMap[K]) => any, options?: boolean | EventListenerOptions): void {}
  public dispatchEvent(ev: Event): boolean {
    return false;
  }
}

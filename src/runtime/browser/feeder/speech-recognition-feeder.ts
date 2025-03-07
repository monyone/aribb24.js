import { ARIBB24ActivePositionReturnToken, ARIBB24ActivePositionSetToken, ARIBB24CharacterCompositionDotDesignationToken, ARIBB24CharacterToken, ARIBB24ClearScreenToken, ARIBB24ColorControlBackgroundToken, ARIBB24MiddleSizeToken, ARIBB24NormalSizeToken, ARIBB24PalletControlToken, ARIBB24SetDisplayFormatToken, ARIBB24SetDisplayPositionToken, ARIBB24SetHorizontalSpacingToken, ARIBB24SetVerticalSpacingToken, ARIBB24SetWritingFormatToken, ARIBB24WhiteForegroundToken } from '../../../lib/tokenizer/token';
import ARIBB24JapaneseInitialParserState from '../../../lib/parser/state/ARIB';

import Feeder, { FeederPresentationData } from './feeder';

export default class SpeechRecognitionFeeder implements Feeder {
  private media: HTMLMediaElement | null = null;
  private track: MediaStreamTrack | null = null;
  private recognition: any;
  private recognitionTime: number | null = null;
  private interim: string = '';
  private privious: string = '';

  private readonly endedHandler = this.capture.bind(this);
  private readonly clearHandler = this.clear.bind(this);
  private readonly recognitionEndHandler = this.recognitionEnd.bind(this);
  private readonly recognitionResultHandler = this.recognitionResult.bind(this);

  public constructor(lang = 'ja-JP') {
    this.recognition = new ((globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition)();
    this.recognition.lang = lang;
    this.recognition.interimResults = true;
    this.recognition.mode = 'ondevice-only';
    this.recognition.addEventListener('end', this.recognitionEndHandler);
    this.recognition.addEventListener('error', this.clearHandler);
    this.recognition.addEventListener('result', this.recognitionResultHandler);
  }

  public attachMedia(media: HTMLVideoElement): void {
    this.detachMedia();
    this.media = media;
    this.media.addEventListener('ended', this.endedHandler);
    if (this.media.readyState >= HTMLMediaElement.HAVE_METADATA) {
      this.capture();
    } else {
      this.media.addEventListener('loadedmetadata', this.endedHandler, { once: true });
    }
  }

  public detachMedia(): void {
    if (this.media == null) { return; }
    this.media.removeEventListener('ended', this.endedHandler);
    this.media = null
  }

  private abort() {
    this.recognition.abort();
  }

  private recognitionEnd() {
    if (this.track == null) { return; }
    if (this.interim !== '') {
      this.privious = this.interim;
      this.interim = '';
    }
    this.recognition.start(this.track);
  }

  private recognitionResult(event: any) {
    if (this.media == null) { return; }
    const results = event.results as SpeechRecognitionResultList;
    this.interim = Array.from(results).map(result => result[0].transcript).join('');
    this.recognitionTime = this.media.currentTime;
  }

  private capture() {
    if (this.media == null) { return; }
    const stream = (this.media as any).captureStream();
    this.track = stream.getAudioTracks()[0];
    this.recognition.start(this.track);
  }

  public clear(): void {
    this.recognitionTime = null;
    this.privious = '';
    this.interim = '';
  }

  public onAttach(): void {
    this.clear();
  }

  public onDetach(): void {
    this.clear();
  }

  public onSeeking(): void {
    this.abort();
    this.clear();
  }

  public destroy(): void {
    this.abort();
    this.recognition.removeEventListener('end', this.recognitionEndHandler);
    this.recognition.removeEventListener('error', this.clearHandler);
    this.recognition.removeEventListener('result', this.recognitionResultHandler);
    this.clear();
  }

  public prepare(_: number): void {}
  public content(_: number): FeederPresentationData | null {
    if (this.media == null) { return null; }
    if (this.recognitionTime == null) { return null; }

    const line = this.privious + (this.privious !== '' ? '\n' : '') + this.interim;
    const lines = [''];
    for (const ch of line) {
      if (lines[lines.length - 1].length >= 18) {
        lines.push('');
      }

      if (ch == '\n') {
        lines.push('');
      } else {
        lines[lines.length - 1] += ch;
      }
    }

    const firstLine = (lines.length >= 2 ? lines[lines.length - 2] : '').trim();
    const secondLine = (lines.length >= 1 ? lines[lines.length - 1] : '').trim();


    const tokens = [
      ARIBB24ClearScreenToken.from(),
      ARIBB24SetWritingFormatToken.from(7),
      ARIBB24SetDisplayFormatToken.from(780, 480),
      ARIBB24SetDisplayPositionToken.from(118, 29),
      ARIBB24SetHorizontalSpacingToken.from(4),
      ARIBB24SetVerticalSpacingToken.from(24),
      ARIBB24CharacterCompositionDotDesignationToken.from(36, 36),
      ARIBB24MiddleSizeToken.from(),
      ARIBB24ActivePositionSetToken.from(0, 6),
      ARIBB24WhiteForegroundToken.from(),
      ARIBB24PalletControlToken.from(4),
      ARIBB24ColorControlBackgroundToken.from(1),
      ARIBB24NormalSizeToken.from(),
      ... Array.from(firstLine).map((ch) => ARIBB24CharacterToken.from(ch)),
      ... firstLine !== '' ? [ARIBB24ActivePositionReturnToken.from()] : [],
      ... Array.from(secondLine).map((ch) => ARIBB24CharacterToken.from(ch)),
    ]

    return {
      pts: this.recognitionTime,
      duration: Number.POSITIVE_INFINITY,
      state: ARIBB24JapaneseInitialParserState,
      info: { association: 'ARIB', language: 'und' },
      data: tokens
    };
  }
}

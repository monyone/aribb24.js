import { ARIBB24FeederTokenizedData } from "../feeder/feeder";

export default interface ARIBB24Renderer {
  render(render: ARIBB24FeederTokenizedData): void;
  clear(): void;
  destroy(): void;

  onattach(element: HTMLElement): void;
  ondetach(element: HTMLElement): void;
  onseeking(): void;
}

import { AribToken } from "../../tokenizer/token";

export type ARIBB24FeederOption = {
  timeshift: number
};

export type ARIBB24FeederRawData = {
  pts: number;
  data: ArrayBuffer;
};
export type ARIBB24FeederTokenizedData = {
  pts: number;
  data: AribToken[];
};

export default interface ARIBB24Feeder {
  content(time: number): ARIBB24FeederTokenizedData | null;
  onattach(): void;
  ondetach(): void;
  onseeking(): void;
}

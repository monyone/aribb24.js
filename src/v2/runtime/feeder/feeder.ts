import { ARIBB24Token } from "../../tokenizer/token";

export type ARIBB24FeederOption = {
  timeshift: number
};

export type ARIBB24FeederRawData = {
  pts: number;
  data: ArrayBuffer;
};
export type ARIBB24FeederTokenizedData = {
  pts: number;
  duration: number;
  data: ARIBB24Token[];
};

export default interface ARIBB24Feeder {
  content(time: number): ARIBB24FeederTokenizedData | null;
  onAttach(): void;
  onDetach(): void;
  onSeeking(): void;
}

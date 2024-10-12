import { ARIBB24Token } from "../../tokenizer/token";

export type FeederOption = {
  timeshift: number
};

export type FeederRawData = {
  pts: number;
  data: ArrayBuffer;
};
export type FeederTokenizedData = {
  pts: number;
  duration: number;
  data: ARIBB24Token[];
};

export default interface Feeder {
  content(time: number): FeederTokenizedData | null;
  onAttach(): void;
  onDetach(): void;
  onSeeking(): void;
}

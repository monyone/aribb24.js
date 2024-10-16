import { ARIBB24ParserState } from "../../parser/parser";
import aribInitialState from "../../parser/state/ARIB";
import sbtvdInitialState from "../../parser/state/SBTVD"
import datagroup, { CaptionLanguageInformation } from "../../tokenizer/b24/datagroup";
import ARIBJapaneseJIS8Tokenizer from "../../tokenizer/b24/jis8/ARIB/index";
import ARIBBrazilianJIS8Tokenizer from "../../tokenizer/b24/jis8/SBTVD/index";
import ARIBB24Tokenizer from "../../tokenizer/b24/tokenizer";
import { ARIBB24Token } from "../../tokenizer/token";

export type FeederOption = {
  timeshift: number;
  recieve: {
    association: 'ARIB' | 'SBTVD' | null; // null is AutoDetect
    type: 'Caption' | 'Superimpose';
    language: number | string | [string, number];
  },
  tokenizer: {
    pua: boolean;
  };
};
export const FeederOption = {
  from (option?: Partial<FeederOption>): FeederOption {
    return {
      timeshift: 0,
      ... option,
      recieve: {
        association: null,
        type: 'Caption',
        language: 0,
        ... option?.recieve,
      },
      tokenizer: {
        pua: false,
        ... option?.tokenizer
      },
    };
  }
}

export const getTokenizeInformation = (language: string, option: FeederOption): [CaptionLanguageInformation['association'], ARIBB24Tokenizer, ARIBB24ParserState] | null => {
  switch (option.recieve.association) {
    case 'ARIB': return ['ARIB', new ARIBJapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), aribInitialState];
    case 'SBTVD': return ['SBTVD', new ARIBBrazilianJIS8Tokenizer(), sbtvdInitialState];
  }

  switch (language) {
    case 'jpn':
    case 'eng':
      return ['ARIB', new ARIBJapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), aribInitialState];
    case 'spa':
    case 'por':
      return ['SBTVD', new ARIBBrazilianJIS8Tokenizer(), sbtvdInitialState];
  }

  // Otherwise, Treat as ARIB-B24 JIS8
  return ['UNKNOWN', new ARIBJapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), aribInitialState];
}

export type FeederDecodingData = {
  pts: number;
  caption: Exclude<ReturnType<typeof datagroup>, null>;
};
export type FeederPresentationData = {
  pts: number;
  duration: number;
  state: ARIBB24ParserState;
  info: CaptionLanguageInformation,
  data: ARIBB24Token[];
};

export default interface Feeder {
  prepare(time: number): void;
  content(time: number): FeederPresentationData | null;
  clear(): void;
  destroy(): void;
  onAttach(): void;
  onDetach(): void;
  onSeeking(): void;
}

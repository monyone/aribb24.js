import { ARIBB24ParserState, initialState, latenInitialState } from "../../parser/index";
import { CaptionLanguageInformation } from "../../tokenizer/b24/datagroup";
import ARIBJapaneseJIS8Tokenizer from "../../tokenizer/b24/jis8/ARIB/index";
import ARIBBrazilianJIS8Tokenizer from "../../tokenizer/b24/jis8/SBTVD/index";
import ARIBB24Tokenizer from "../../tokenizer/b24/tokenizer";
import { ARIBB24Token } from "../../tokenizer/token";

export type FeederOption = {
  timeshift: number;
  recieve: {
    association: 'ARIB' | 'SBTVD' | null; // null is AutoDetect
    type: 'Caption' | 'Superimpose';
    language: number | string;
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
    case 'ARIB': return ['ARIB', new ARIBJapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), initialState];
    case 'SBTVD': return ['SBTVD', new ARIBBrazilianJIS8Tokenizer(), latenInitialState];
  }

  switch (language) {
    case 'jpn':
    case 'eng':
      return ['ARIB', new ARIBJapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), initialState];
    case 'spa':
    case 'por':
      return ['SBTVD', new ARIBBrazilianJIS8Tokenizer(), latenInitialState];
  }

  // Treat as ARIB-B24 JIS8
  return ['UNKNOWN', new ARIBJapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), initialState];
}

export type FeederRawData = {
  pts: number;
  data: ArrayBuffer;
};
export type FeederTokenizedData = {
  pts: number;
  duration: number;
  state: ARIBB24ParserState;
  info: CaptionLanguageInformation,
  data: ARIBB24Token[];
};

export default interface Feeder {
  content(time: number): FeederTokenizedData | null;
  destroy(): void;
  onAttach(): void;
  onDetach(): void;
  onSeeking(): void;
}

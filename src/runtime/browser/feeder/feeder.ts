import { ARIBB24ParserState } from "../../../parser/parser";
import aribInitialState from "../../../parser/state/ARIB";
import sbtvdInitialState from "../../../parser/state/SBTVD"
import datagroup, { CaptionLanguageInformation } from "../../../tokenizer/b24/datagroup";
import ARIBB24JapaneseJIS8Tokenizer from "../../../tokenizer/b24/jis8/ARIB/index";
import ARIBB24BrazilianJIS8Tokenizer from "../../../tokenizer/b24/jis8/SBTVD/index";
import ARIBB24Tokenizer from "../../../tokenizer/b24/tokenizer";
import ARIBB24UTF8Tokenizer from "../../../tokenizer/b24/ucs/tokenizer";
import { ARIBB24Token } from "../../../tokenizer/token";
import { UnreachableError } from "../../../util/error";
import { ARIBB24BrowserToken } from "../types";

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

export const getTokenizeInformation = (language: string, TCS: number, option: FeederOption): [CaptionLanguageInformation['association'], ARIBB24Tokenizer, ARIBB24ParserState] | null => {
  if (TCS === 1) {
    return ['ARIB', new ARIBB24UTF8Tokenizer(), aribInitialState];
  } else if (TCS !== 0) {
    throw new UnreachableError('Undefined TCS');
  }

  switch (option.recieve.association) {
    case 'ARIB': return ['ARIB', new ARIBB24JapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), aribInitialState];
    case 'SBTVD': return ['SBTVD', new ARIBB24BrazilianJIS8Tokenizer(), sbtvdInitialState];
  }

  switch (language) {
    case 'jpn':
    case 'eng':
      return ['ARIB', new ARIBB24JapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), aribInitialState];
    case 'spa':
    case 'por':
      return ['SBTVD', new ARIBB24BrazilianJIS8Tokenizer(), sbtvdInitialState];
  }

  // Otherwise, Treat as ARIB-B24 JIS8
  return ['UNKNOWN', new ARIBB24JapaneseJIS8Tokenizer({ usePUA: option.tokenizer.pua }), aribInitialState];
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
  data: ARIBB24BrowserToken[];
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

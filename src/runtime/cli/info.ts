import { ARIBB24ParserState } from "../../lib/parser/parser";
import aribInitialState from "../../lib/parser/state/ARIB";
import sbtvdInitialState from "../../lib/parser/state/SBTVD";


import ARIBB24Tokenizer from "../../lib/tokenizer/b24/tokenizer";
import ARIBB24UTF8Tokenizer from "../../lib/tokenizer/b24/ucs/tokenizer";
import ARIBB24JapaneseJIS8Tokenizer from "../../lib/tokenizer/b24/jis8/ARIB";
import ARIBB24BrazilianJIS8Tokenizer from "../../lib/tokenizer/b24/jis8/SBTVD";
import { NotUsedDueToStandardError } from "../../util/error";

export type Association = 'ARIB' | 'SBTVD' | 'UNKNOWN';

export const getTokenizeInformation = (language: string, TCS: number, association: Association = 'UNKNOWN'): [Association, ARIBB24Tokenizer, ARIBB24ParserState] | null => {
  if (TCS === 1) {
    return ['ARIB', new ARIBB24UTF8Tokenizer(), aribInitialState];
  } else if (TCS !== 0) {
    throw new NotUsedDueToStandardError('Reserved TCS');
  }

  switch (association) {
    case 'ARIB': return ['ARIB', new ARIBB24JapaneseJIS8Tokenizer({ usePUA: false }), aribInitialState];
    case 'SBTVD': return ['SBTVD', new ARIBB24BrazilianJIS8Tokenizer(), sbtvdInitialState];
  }

  switch (language) {
    case 'jpn':
    case 'eng':
      return ['ARIB', new ARIBB24JapaneseJIS8Tokenizer({ usePUA: false }), aribInitialState];
    case 'spa':
    case 'por':
      return ['SBTVD', new ARIBB24BrazilianJIS8Tokenizer(), sbtvdInitialState];
  }

  // Otherwise, Treat as ARIB-B24 JIS8
  return ['UNKNOWN', new ARIBB24JapaneseJIS8Tokenizer({ usePUA: false }), aribInitialState];
}

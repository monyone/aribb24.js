import { ARIBB24Parser, ARIBB24CharacterParsedToken, ARIBB24ParserOption, ARIBB24ParserState, initialState, CHARACTER_SIZE, ARIBB24ClearScreenParsedToken, ARIBB24DRCSPrasedToken } from '@/lib/parser/parser';
import { replaceDRCS } from '@/lib/tokenizer/b24/tokenizer';
import { ARIBB24ActivePositionForwardToken, ARIBB24ActivePositionSetToken, ARIBB24CharacterCompositionDotDesignationToken, ARIBB24CharacterToken, ARIBB24ClearScreenToken, ARIBB24ColorControlBackgroundToken, ARIBB24FlashingControlToken, ARIBB24FlashingControlType, ARIBB24MiddleSizeToken, ARIBB24NormalSizeToken, ARIBB24PalletControlToken, ARIBB24SetDisplayFormatToken, ARIBB24SetDisplayPositionToken, ARIBB24SetHorizontalSpacingToken, ARIBB24SetVerticalSpacingToken, ARIBB24SetWritingFormatToken, ARIBB24WhiteForegroundToken } from '@/lib/tokenizer/token';
import md5 from '@/util/md5';
import { describe, test, expect } from 'vitest';

const initialStateMagnificated = (state: typeof initialState, option: ARIBB24ParserOption): ARIBB24ParserState => {
  return {
    ... initialState,
    plane: [initialState.plane[0] * option.magnification, initialState.plane[1] * option.magnification],
    area: [initialState.area[0] * option.magnification, initialState.area[1] * option.magnification],
    margin: [initialState.margin[0] * option.magnification, initialState.margin[1] * option.magnification],
    fontsize: [initialState.fontsize[0] * option.magnification, initialState.fontsize[1] * option.magnification],
    hspace: initialState.hspace * option.magnification,
    vspace: initialState.vspace * option.magnification,
    position: [initialState.position[0] * option.magnification, initialState.position[1] * option.magnification],
  };
}

describe("ARIB STD-B24 Parser", () => {

  test('Parse MSZ/SSZ', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    const tokens = [
      ARIBB24ClearScreenToken.from(),
      ARIBB24SetWritingFormatToken.from(7),
      ARIBB24SetDisplayFormatToken.from(840, 480),
      ARIBB24SetDisplayPositionToken.from(58, 29),
      ARIBB24SetHorizontalSpacingToken.from(4),
      ARIBB24SetVerticalSpacingToken.from(24),
      ARIBB24CharacterCompositionDotDesignationToken.from(36, 36),
      ARIBB24MiddleSizeToken.from(),
      ARIBB24ActivePositionSetToken.from(17, 7),
      ARIBB24WhiteForegroundToken.from(),
      ARIBB24PalletControlToken.from(4),
      ARIBB24ColorControlBackgroundToken.from(1),
      ARIBB24CharacterToken.from('('),
      ARIBB24NormalSizeToken.from(),
      ARIBB24CharacterToken.from('テ'),
      ARIBB24CharacterToken.from('ス'),
      ARIBB24CharacterToken.from('ト'),
      ARIBB24MiddleSizeToken.from(),
      ARIBB24CharacterToken.from(')')
    ];

    const expectedState = {
      plane: [960 * option.magnification, 540 * option.magnification],
      area: [840 * option.magnification, 480 * option.magnification],
      margin: [58 * option.magnification, 29 * option.magnification],
      fontsize: [36 * option.magnification, 36 * option.magnification],
      hspace: 4 * option.magnification,
      vspace: 24 * option.magnification,
    } as ARIBB24ParserState;

    expect(parser.parse(tokens)).toStrictEqual([
      ARIBB24ClearScreenParsedToken.from(0, initialStateMagnificated(initialState, option), { magnification: 2 }),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('('), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Middle,
          position: [340 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('テ'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [360 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('ス'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [400 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('ト'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [440 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from(')'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Middle,
          position: [480 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
    ]);
  });

  test('Parse Flashing', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    const tokens = [
      ARIBB24ClearScreenToken.from(),
      ARIBB24SetWritingFormatToken.from(7),
      ARIBB24SetDisplayFormatToken.from(840, 480),
      ARIBB24SetDisplayPositionToken.from(58, 29),
      ARIBB24SetHorizontalSpacingToken.from(4),
      ARIBB24SetVerticalSpacingToken.from(24),
      ARIBB24CharacterCompositionDotDesignationToken.from(36, 36),
      ARIBB24MiddleSizeToken.from(),
      ARIBB24ActivePositionSetToken.from(4, 7),
      ARIBB24WhiteForegroundToken.from(),
      ARIBB24PalletControlToken.from(4),
      ARIBB24ColorControlBackgroundToken.from(1),
      ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.NORMAL),
      ARIBB24CharacterToken.from('['),
      ARIBB24NormalSizeToken.from(),
      ARIBB24CharacterToken.from('携'),
      ARIBB24CharacterToken.from('帯'),
      ARIBB24MiddleSizeToken.from(),
      ARIBB24CharacterToken.from(']'),
      ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.STOP),
      ARIBB24ActivePositionForwardToken.from(),
      ARIBB24NormalSizeToken.from(),
      ARIBB24CharacterToken.from('ブ'),
      ARIBB24CharacterToken.from('ル'),
      ARIBB24CharacterToken.from('ブ'),
      ARIBB24CharacterToken.from('ル'),
    ];

    const expectedState = {
      plane: [960 * option.magnification, 540 * option.magnification],
      area: [840 * option.magnification, 480 * option.magnification],
      margin: [58 * option.magnification, 29 * option.magnification],
      fontsize: [36 * option.magnification, 36 * option.magnification],
      hspace: 4 * option.magnification,
      vspace: 24 * option.magnification,
    } as ARIBB24ParserState;

    expect(parser.parse(tokens)).toStrictEqual([
      ARIBB24ClearScreenParsedToken.from(0, initialStateMagnificated(initialState, option), { magnification: 2 }),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('['), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Middle,
          position: [80 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: ARIBB24FlashingControlType.NORMAL,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('携'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [100 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: ARIBB24FlashingControlType.NORMAL,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('帯'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [140 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: ARIBB24FlashingControlType.NORMAL,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from(']'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Middle,
          position: [180 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: ARIBB24FlashingControlType.NORMAL,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('ブ'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [220 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: ARIBB24FlashingControlType.STOP,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('ル'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [260 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: ARIBB24FlashingControlType.STOP,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('ブ'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [300 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: ARIBB24FlashingControlType.STOP,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        ARIBB24CharacterToken.from('ル'), {
          ... initialStateMagnificated(initialState, option),
          ... expectedState,
          size: CHARACTER_SIZE.Normal,
          position: [340 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: ARIBB24FlashingControlType.STOP,
        }, { magnification: option.magnification }
      ),
    ])
  })
});

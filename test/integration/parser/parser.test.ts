import { ARIBB24Parser, ARIBB24CharacterParsedToken, ARIBB24ParserOption, ARIBB24ParserState, initialState, CHARACTER_SIZE, ARIBB24ClearScreenParsedToken, ARIBB24DRCSPrasedToken } from '@/parser/parser';
import { replaceDRCS } from '@/tokenizer/b24/tokenizer';
import { ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, BlackForeground, BlueForeground, Character, CharacterCompositionDotDesignation, CharacterSizeControl, CharacterSizeControlType, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, CyanForeground, DRCS, FlashingControl, FlashingControlType, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, OrnamentControlHemming, OrnamentControlNone, PalletControl, RedForeground, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SmallSize, Space, StartLining, StopLining, TimeControlWait, WhiteForeground, YellowForeground } from '@/tokenizer/token';
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
      ClearScreen.from(),
      SetWritingFormat.from(7),
      SetDisplayFormat.from(840, 480),
      SetDisplayPosition.from(58, 29),
      SetHorizontalSpacing.from(4),
      SetVerticalSpacing.from(24),
      CharacterCompositionDotDesignation.from(36, 36),
      MiddleSize.from(),
      ActivePositionSet.from(17, 7),
      WhiteForeground.from(),
      PalletControl.from(4),
      ColorControlBackground.from(1),
      Character.from('('),
      NormalSize.from(),
      Character.from('テ'),
      Character.from('ス'),
      Character.from('ト'),
      MiddleSize.from(),
      Character.from(')')
    ];

    expect(parser.parse(tokens)).toStrictEqual([
      ARIBB24ClearScreenParsedToken.from(0, initialStateMagnificated(initialState, option), { magnification: 2 }),
      ARIBB24CharacterParsedToken.from(
        Character.from('('), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Middle,
          position: [340 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('テ'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [360 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('ス'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [400 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('ト'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [440 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from(')'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
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
      ClearScreen.from(),
      SetWritingFormat.from(7),
      SetDisplayFormat.from(840, 480),
      SetDisplayPosition.from(58, 29),
      SetHorizontalSpacing.from(4),
      SetVerticalSpacing.from(24),
      CharacterCompositionDotDesignation.from(36, 36),
      MiddleSize.from(),
      ActivePositionSet.from(4, 7),
      WhiteForeground.from(),
      PalletControl.from(4),
      ColorControlBackground.from(1),
      FlashingControl.from(FlashingControlType.NORMAL),
      Character.from('['),
      NormalSize.from(),
      Character.from('携'),
      Character.from('帯'),
      MiddleSize.from(),
      Character.from(']'),
      FlashingControl.from(FlashingControlType.STOP),
      ActivePositionForward.from(),
      NormalSize.from(),
      Character.from('ブ'),
      Character.from('ル'),
      Character.from('ブ'),
      Character.from('ル'),
    ];

    expect(parser.parse(tokens)).toStrictEqual([
      ARIBB24ClearScreenParsedToken.from(0, initialStateMagnificated(initialState, option), { magnification: 2 }),
      ARIBB24CharacterParsedToken.from(
        Character.from('['), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Middle,
          position: [80 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: FlashingControlType.NORMAL,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('携'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [100 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: FlashingControlType.NORMAL,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('帯'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [140 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: FlashingControlType.NORMAL,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from(']'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Middle,
          position: [180 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: FlashingControlType.NORMAL,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('ブ'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [220 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: FlashingControlType.STOP,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('ル'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [260 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: FlashingControlType.STOP,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('ブ'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [300 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: FlashingControlType.STOP,
        }, { magnification: option.magnification }
      ),
      ARIBB24CharacterParsedToken.from(
        Character.from('ル'), {
          ... initialStateMagnificated(initialState, option),
          plane: [960 * option.magnification, 540 * option.magnification],
          area: [840 * option.magnification, 480 * option.magnification],
          margin: [58 * option.magnification, 29 * option.magnification],
          fontsize: [36 * option.magnification, 36 * option.magnification],
          hspace: 4 * option.magnification,
          vspace: 24 * option.magnification,
          size: CHARACTER_SIZE.Normal,
          position: [340 * option.magnification, 479 * option.magnification],
          pallet: 4,
          foreground: 7,
          background: 65,
          flashing: FlashingControlType.STOP,
        }, { magnification: option.magnification }
      ),
    ])
  })
});

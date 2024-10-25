import { ARIBB24Parser, ARIBB24CharacterParsedToken, ARIBB24ParserOption, ARIBB24ParserState, initialState, CHARACTER_SIZE, ARIBB24ClearScreenParsedToken, ARIBB24DRCSPrasedToken } from '@/parser/parser';
import { replaceDRCS } from '@/tokenizer/b24/tokenizer';
import { ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, BlackForeground, BlueForeground, Character, CharacterCompositionDotDesignation, CharacterSizeControl, CharacterSizeControlType, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, CyanForeground, DRCS, FlashingControl, FlashingControlType, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, OrnamentControlHemming, OrnamentControlNone, PalletControl, RedForeground, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SmallSize, StartLining, StopLining, TimeControlWait, WhiteForeground, YellowForeground } from '@/tokenizer/token';
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

  test('Parse With Magnification', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.currentState()).toStrictEqual(initialStateMagnificated(initialState, option));
  });

  test('Parse ASCII', () => {
    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(Character.from('a'))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(Character.from('a'), initialStateMagnificated(initialState, option), { magnification: 1 }),
    ]);
  });

  test('Parse 2-bytes string', () => {
    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(Character.from('あ'))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(Character.from('あ'), initialStateMagnificated(initialState, option), { magnification: 1 }),
    ]);
  });

  test('Tokenize UTF-8 surrogate pair', () => {
    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(Character.from('叱'))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(Character.from('叱'), initialStateMagnificated(initialState, option), { magnification: 1 }),
    ]);
  });

  test('Tokenize UTF-8 combining character', () => {
    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(Character.from('👨‍👩'))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(Character.from('👨‍👩'), initialStateMagnificated(initialState, option), { magnification: 1 }),
    ]);
  });

  test('Tokenize UTF-8 DRCS', () => {
    const width = 36, height = 36, colors = 4, depth = 2;
    const binary = [];
    for (let index = 0; index < Math.floor(36 * 36 * 2 / 8); index++) {
      binary.push(0xFF);
    }

    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(DRCS.from(width, height, depth, Uint8Array.from(binary).buffer))).toStrictEqual([
      ARIBB24DRCSPrasedToken.from(DRCS.from(width, height, depth, Uint8Array.from(binary).buffer), initialStateMagnificated(initialState, option), { magnification: 1 }),
    ]);
  });

  test('Tokenize UTF-8 DRCS with Combine (ignore currently)', () => {
    const width = 36, height = 36, colors = 4, depth = 2;
    const binary = [];
    for (let index = 0; index < Math.floor(36 * 36 * 2 / 8); index++) {
      binary.push(0xFF);
    }

    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(DRCS.from(width, height, depth, Uint8Array.from(binary).buffer, '\u3099'))).toStrictEqual([
      ARIBB24DRCSPrasedToken.from(DRCS.from(width, height, depth, Uint8Array.from(binary).buffer), initialStateMagnificated(initialState, option), { magnification: 1 }),
      ARIBB24CharacterParsedToken.from(Character.from('　\u3099', true), initialStateMagnificated(initialState, option), { magnification: 1 }),
    ]);
  });

  test('Tokenize UTF-8 DRCS with ReplaceDRCS', () => {
    const width = 36, height = 36, colors = 4, depth = 2;
    const binary = [];
    for (let index = 0; index < Math.floor(36 * 36 * 2 / 8); index++) {
      binary.push(0xFF);
    }
    const replace = new Map([[md5(Uint8Array.from(binary).buffer), '〓']]);

    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parse(replaceDRCS([DRCS.from(width, height, depth, Uint8Array.from(binary).buffer, '\u3099')], replace))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(Character.from('〓\u3099'), initialStateMagnificated(initialState, option), { magnification: 1 }),
    ]);
  });

  test('Parse SetWritingFormat (SWF) 5 (1920x1080)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetWritingFormat.from(5));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      plane: [1920 * option.magnification, 1080 * option.magnification],
    });
  });

  test('Parse SetWritingFormat (SWF) 7 (960x540)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetWritingFormat.from(7));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      plane: [960 * option.magnification, 540 * option.magnification],
    });
  });

  test('Parse SetWritingFormat (SWF) 9 (720x480)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetWritingFormat.from(9));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      plane: [720 * option.magnification, 480 * option.magnification],
    });
  });

  test('Parse SetWritingFormat (SWF) 11 (1280x720)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetWritingFormat.from(11));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      plane: [1280 * option.magnification, 720 * option.magnification],
    });
  });

  test('Parse SetDisplayFormat (SDF)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetDisplayFormat.from(720, 480));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      area: [720 * option.magnification, 480 * option.magnification],
    });
  });

  test('Parse SetDisplayPosition (SDP)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetDisplayPosition.from(120, 60));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      margin: [120 * option.magnification, 60 * option.magnification],
    });
  });

  test('Parse CharacterCompositionDotDesignation (SSM)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CharacterCompositionDotDesignation.from(24, 24));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      fontsize: [24 * option.magnification, 24 * option.magnification],
    });
  });

  test('Parse SetHorizontalSpacing (SHS)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetHorizontalSpacing.from(2));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      hspace: 2 * option.magnification,
    });
  });

  test('Parse SetVerticalSpacing (SVS)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetVerticalSpacing.from(6));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      vspace: 6 * option.magnification,
    });
  });

  test('Parse ActivePositionBackward (APB) with Initial Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ActivePositionBackward.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [920 * option.magnification, 539 * option.magnification],
    });
  });

  test('Parse ActivePositionBackward (APB) with Custom Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser({ ... initialState, position: [480, 60] }, option);

    parser.parseToken(ActivePositionBackward.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [440 * option.magnification, 60 * option.magnification],
    });
  });

  test('Parse ActivePositionForward (APF) with Initial Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ActivePositionForward.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [40 * option.magnification, 59 * option.magnification],
    });
  });

  test('Parse ActivePositionForward (APF) with Custom Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser({ ... initialState, position: [380, 89] }, option);

    parser.parseToken(ActivePositionForward.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [420 * option.magnification, 89 * option.magnification],
    });
  });

  test('Parse ActivePositionDown (APD) with Initial Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ActivePositionDown.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [0 * option.magnification, 119 * option.magnification],
    });
  });

  test('Parse ActivePositionDown (APD) with Custon Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser({ ... initialState, position: [180, 199] }, option);

    parser.parseToken(ActivePositionDown.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [180 * option.magnification, 259 * option.magnification],
    });
  });

  test('Parse ActivePositionUp (APU) with Initial Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ActivePositionUp.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [0 * option.magnification, 539 * option.magnification],
    });
  });

  test('Parse ActivePositionUp (APU) with Custon Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser({ ... initialState, position: [390, 499] }, option);

    parser.parseToken(ActivePositionUp.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [390 * option.magnification, 439 * option.magnification],
    });
  });

  test('Parse ActivePositionReturn (APR) with Initial Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ActivePositionReturn.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [0 * option.magnification, 119 * option.magnification],
    });
  });

  test('Parse ActivePositionReturn (APR) with Custom Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser({ ... initialState, position: [120, 299] }, option);

    parser.parseToken(ActivePositionReturn.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [0 * option.magnification, 359 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Initial State', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ActivePositionSet.from(4, 4));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [160 * option.magnification, 299 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Custom Position', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser({ ... initialState, position: [120, 299] }, option);

    parser.parseToken(ActivePositionSet.from(3, 5));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [120 * option.magnification, 359 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Custom CharacterCompositionDotDesignation (SSM)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CharacterCompositionDotDesignation.from(24, 24)),
    parser.parseToken(ActivePositionSet.from(8, 9));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      fontsize: [24 * option.magnification, 24 * option.magnification],
      position: [224 * option.magnification, 479 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Custom SetHorizontalSpacing (SHS)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetHorizontalSpacing.from(2)),
    parser.parseToken(ActivePositionSet.from(7, 3));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      hspace: 2 * option.magnification,
      position: [266 * option.magnification, 239 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Custom SetHorizontalSpacing (SVS)', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SetVerticalSpacing.from(8)),
    parser.parseToken(ActivePositionSet.from(0, 5));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      vspace: 8 * option.magnification,
      position: [0 * option.magnification, 263 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with SmallSize', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SmallSize.from()),
    parser.parseToken(ActivePositionSet.from(1, 2));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Small,
      position: [20 * option.magnification, 89 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with MiddleSize', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(MiddleSize.from()),
    parser.parseToken(ActivePositionSet.from(3, 4));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Middle,
      position: [60 * option.magnification, 299 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with NormalSize', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(NormalSize.from()),
    parser.parseToken(ActivePositionSet.from(8, 1));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Normal,
      position: [320 * option.magnification, 119 * option.magnification],
    });
  });

  test('Parse SmallSize', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(SmallSize.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Small,
    });
  });

  test('Parse MiddleSize', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(MiddleSize.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Middle,
    });
  });

  test('Parse NormalSize', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(NormalSize.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Normal,
    });
  });

  test('Parse NormalSize', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(NormalSize.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: 'Normal',
    });
  });

  test('Parse CharacterSizeControl (SZX) Tiny', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CharacterSizeControl.from(CharacterSizeControlType.TINY));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Tiny,
    });
  });

  test('Parse CharacterSizeControl (SZX) Double Height', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.DoubleHeight,
    });
  });

  test('Parse CharacterSizeControl (SZX) Double Width', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_WIDTH));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.DoubleWidth,
    });
  });

  test('Parse CharacterSizeControl (SZX) Double Height and Width', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.DoubleHeightAndWidth,
    });
  });

  test('Parse CharacterSizeControl (SZX) Special 1', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_1));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Special1,
    });
  });

  test('Parse CharacterSizeControl (SZX) Special 2', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_2));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: CHARACTER_SIZE.Special2,
    });
  });

  test('Parse PalletControl', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(7));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 7,
    });
  });

  test('Parse BlackForeground (BKF) with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(BlackForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 0,
    });
  });

  test('Parse BlackForeground (BKF) with Custon Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(2));
    parser.parseToken(BlackForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 2,
      foreground: 32,
    });
  });

  test('Parse RedForeground (RDF) with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(RedForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 1,
    });
  });

  test('Parse RedForeground (RDF) with Custon Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(1));
    parser.parseToken(RedForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 1,
      foreground: 17,
    });
  });

  test('Parse GreenForeground (GRF) with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(GreenForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 2,
    });
  });

  test('Parse GreenForeground (GRF) with Custon Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(3));
    parser.parseToken(GreenForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 3,
      foreground: 50,
    });
  });

  test('Parse YellowForeground (YLF) with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(YellowForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 3,
    });
  });

  test('Parse YellowForeground (YLE) with Custon Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(4));
    parser.parseToken(YellowForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 4,
      foreground: 67,
    });
  });

  test('Parse BlueForeground (BLF) with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(BlueForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 4,
    });
  });

  test('Parse BlueForeground (BLF) with Custon Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(5));
    parser.parseToken(BlueForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 5,
      foreground: 84,
    });
  });

  test('Parse MagentaForeground (MGF) with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(MagentaForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 5,
    });
  });

  test('Parse MagentaForeground (MGF) with Custon Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(6));
    parser.parseToken(MagentaForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 6,
      foreground: 101,
    });
  });

  test('Parse CyanForeground (CYF) with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(CyanForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 6,
    });
  });

  test('Parse CyanForeground (CYF) with Custon Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(7));
    parser.parseToken(CyanForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 7,
      foreground: 118,
    });
  });

  test('Parse WhiteForeground (WHF) with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(WhiteForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 7,
    });
  });

  test('Parse WhiteForeground (WHF) with Custon Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(3));
    parser.parseToken(WhiteForeground.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 3,
      foreground: 55,
    });
  });

  test('Parse ColorControlForeground with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ColorControlForeground.from(8));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 8,
    });
  });

  test('Parse ColorControlForeground with Custom Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(1));
    parser.parseToken(ColorControlForeground.from(9));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 1,
      foreground: 25,
    });
  });

  test('Parse ColorControlHalfForeground with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ColorControlHalfForeground.from(10));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      halfforeground: 10,
    });
  });

  test('Parse ColorControlHalfForeground with Custom Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(2));
    parser.parseToken(ColorControlHalfForeground.from(11));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 2,
      halfforeground: 43,
    });
  });

  test('Parse ColorControlHalfBackground with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ColorControlHalfBackground.from(12));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      halfbackground: 12,
    });
  });

  test('Parse ColorControlHalfBackground with Custom Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(3));
    parser.parseToken(ColorControlHalfBackground.from(13));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 3,
      halfbackground: 61,
    });
  });

  test('Parse ColorControlBackground with Initial Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ColorControlBackground.from(14));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      background: 14,
    });
  });

  test('Parse ColorControlBackground with Custom Pallet', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(PalletControl.from(4));
    parser.parseToken(ColorControlBackground.from(15));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 4,
      background: 79,
    });
  });

  test('Parse StartLining', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(StartLining.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      underline: true
    });
  });

  test('Parse StopLining', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(StopLining.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      underline: false
    });
  });

  test('Parse HilightingCharacterBlock Highlights None', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(HilightingCharacterBlock.from(0x00));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      highlight: 0x00,
    });
  });

  test('Parse HilightingCharacterBlock Highlights ALL', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(HilightingCharacterBlock.from(0x0F));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      highlight: 0x0F,
    });
  });

  test('Parse OrnamentControlNone None ornament', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(OrnamentControlNone.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      ornament: null,
    });
  });

  test('Parse OrnamentControl None', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(OrnamentControlNone.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      ornament: null,
    });
  });

  test('Parse OrnamentControl Hemming Black', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(OrnamentControlHemming.from(0));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      ornament: 0,
    });
  });

  test('Parse FlashingControl STOP', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(FlashingControl.from(FlashingControlType.STOP));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      flashing: FlashingControlType.STOP,
    });
  });

  test('Parse FlashingControl NORMAL', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(FlashingControl.from(FlashingControlType.NORMAL));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      flashing: FlashingControlType.NORMAL,
    });
  });

  test('Parse FlashingControl INVERTED', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(FlashingControl.from(FlashingControlType.INVERTED));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      flashing: FlashingControlType.INVERTED,
    });
  });

  test('Parse TimeControlWait', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(TimeControlWait.from(10));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      elapsed_time: 10,
    });
  });


  test('Parse Multiple TimeControlWait', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(TimeControlWait.from(15));
    parser.parseToken(TimeControlWait.from(20));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      elapsed_time: 35,
    });
  });

  test('Parse ClearScreen with Initial State', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    const tokens = parser.parseToken(ClearScreen.from());

    expect(parser.currentState()).toStrictEqual(initialStateMagnificated(initialState, option));
    expect(tokens).toStrictEqual([
      ARIBB24ClearScreenParsedToken.from(0, initialStateMagnificated(initialState, option), option)
    ]);
  });

  test('Parse ClearScreen with Time Elapsed', () => {
    const option: ARIBB24ParserOption = { magnification: 2 };
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(TimeControlWait.from(5));
    const tokens = parser.parseToken(ClearScreen.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      elapsed_time: 5,
    });
    expect(tokens).toStrictEqual([
      ARIBB24ClearScreenParsedToken.from(5, { ... initialStateMagnificated(initialState, option), elapsed_time: 5 }, option)
    ]);
  });
});

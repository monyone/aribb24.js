import { ARIBB24Parser, ARIBB24CharacterParsedToken, ARIBB24ParserOption, ARIBB24ParserState, initialState, ARIBB24_CHARACTER_SIZE, ARIBB24ClearScreenParsedToken, ARIBB24DRCSParsedToken } from '@/lib//parser/parser';
import { replaceDRCS } from '@/lib/tokenizer/b24/tokenizer';
import { ARIBB24ActivePositionBackwardToken, ARIBB24ActivePositionDownToken, ARIBB24ActivePositionForwardToken, ARIBB24ActivePositionReturnToken, ARIBB24ActivePositionSetToken, ARIBB24ActivePositionUpToken, ARIBB24BlackForegroundToken, ARIBB24BlueForegroundToken, ARIBB24CharacterCompositionDotDesignationToken, ARIBB24CharacterSizeControlToken, ARIBB24CharacterSizeControlType, ARIBB24CharacterToken, ARIBB24ClearScreenToken, ARIBB24ColorControlBackgroundToken, ARIBB24ColorControlForegroundToken, ARIBB24ColorControlHalfBackgroundToken, ARIBB24ColorControlHalfForegroundToken, ARIBB24CyanForegroundToken, ARIBB24DRCSToken, ARIBB24FlashingControlToken, ARIBB24FlashingControlType, ARIBB24GreenForegroundToken, ARIBB24HilightingCharacterBlockToken, ARIBB24MagentaForegroundToken, ARIBB24MiddleSizeToken, ARIBB24NormalSizeToken, ARIBB24OrnamentControlHemmingToken, ARIBB24OrnamentControlNoneToken, ARIBB24PalletControlToken, ARIBB24RedForegroundToken, ARIBB24SetDisplayFormatToken, ARIBB24SetDisplayPositionToken, ARIBB24SetHorizontalSpacingToken, ARIBB24SetVerticalSpacingToken, ARIBB24SetWritingFormatToken, ARIBB24SmallSizeToken, ARIBB24StartLiningToken, ARIBB24StopLiningToken, ARIBB24TimeControlWaitToken, ARIBB24WhiteForegroundToken, ARIBB24YellowForegroundToken } from '@/lib/tokenizer/token';
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
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.currentState()).toStrictEqual(initialStateMagnificated(initialState, option));
  });

  test('Parse ASCII', () => {
    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(ARIBB24CharacterToken.from('a'))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(ARIBB24CharacterToken.from('a'), initialStateMagnificated(initialState, option), option),
    ]);
  });

  test('Parse 2-bytes string', () => {
    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(ARIBB24CharacterToken.from('あ'))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(ARIBB24CharacterToken.from('あ'), initialStateMagnificated(initialState, option), option),
    ]);
  });

  test('Tokenize UTF-8 surrogate pair', () => {
    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(ARIBB24CharacterToken.from('𠮟'))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(ARIBB24CharacterToken.from('𠮟'), initialStateMagnificated(initialState, option), option),
    ]);
  });

  test('Tokenize UTF-8 combining character', () => {
    const option: ARIBB24ParserOption = { magnification: 1 };
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parseToken(ARIBB24CharacterToken.from('👨‍👩'))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(ARIBB24CharacterToken.from('👨‍👩'), initialStateMagnificated(initialState, option), option),
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

    expect(parser.parseToken(ARIBB24DRCSToken.from(width, height, depth, Uint8Array.from(binary).buffer))).toStrictEqual([
      ARIBB24DRCSParsedToken.from(ARIBB24DRCSToken.from(width, height, depth, Uint8Array.from(binary).buffer), initialStateMagnificated(initialState, option), option),
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

    expect(parser.parseToken(ARIBB24DRCSToken.from(width, height, depth, Uint8Array.from(binary).buffer, '\u3099'))).toStrictEqual([
      ARIBB24DRCSParsedToken.from(ARIBB24DRCSToken.from(width, height, depth, Uint8Array.from(binary).buffer), initialStateMagnificated(initialState, option), option),
      ARIBB24CharacterParsedToken.from(ARIBB24CharacterToken.from('　\u3099', true), initialStateMagnificated(initialState, option), option),
    ]);
  });

  test('Tokenize UTF-8 DRCS with ReplaceDRCS', () => {
    const width = 36, height = 36, colors = 4, depth = 2;
    const binary = [];
    for (let index = 0; index < Math.floor(36 * 36 * 2 / 8); index++) {
      binary.push(0xFF);
    }
    const replace = new Map([[md5(Uint8Array.from(binary).buffer), '〓']]);

    const option = { magnification: 1 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    expect(parser.parse(replaceDRCS([ARIBB24DRCSToken.from(width, height, depth, Uint8Array.from(binary).buffer, '\u3099')], replace))).toStrictEqual([
      ARIBB24CharacterParsedToken.from(ARIBB24CharacterToken.from('〓\u3099'), initialStateMagnificated(initialState, option), option),
    ]);
  });

  test('Parse SetWritingFormat (SWF) 5 (1920x1080)', () => {
    const option = { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetWritingFormatToken.from(5));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      plane: [1920 * option.magnification, 1080 * option.magnification],
    });
  });

  test('Parse SetWritingFormat (SWF) 7 (960x540)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetWritingFormatToken.from(7));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      plane: [960 * option.magnification, 540 * option.magnification],
    });
  });

  test('Parse SetWritingFormat (SWF) 9 (720x480)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetWritingFormatToken.from(9));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      plane: [720 * option.magnification, 480 * option.magnification],
    });
  });

  test('Parse SetWritingFormat (SWF) 11 (1280x720)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetWritingFormatToken.from(11));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      plane: [1280 * option.magnification, 720 * option.magnification],
    });
  });

  test('Parse SetDisplayFormat (SDF)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetDisplayFormatToken.from(720, 480));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      area: [720 * option.magnification, 480 * option.magnification],
    });
  });

  test('Parse SetDisplayPosition (SDP)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetDisplayPositionToken.from(120, 60));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      margin: [120 * option.magnification, 60 * option.magnification],
    });
  });

  test('Parse CharacterCompositionDotDesignation (SSM)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CharacterCompositionDotDesignationToken.from(24, 24));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      fontsize: [24 * option.magnification, 24 * option.magnification],
    });
  });

  test('Parse SetHorizontalSpacing (SHS)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetHorizontalSpacingToken.from(2));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      hspace: 2 * option.magnification,
    });
  });

  test('Parse SetVerticalSpacing (SVS)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetVerticalSpacingToken.from(6));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      vspace: 6 * option.magnification,
    });
  });

  test('Parse ActivePositionBackward (APB) with Initial Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ActivePositionBackwardToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [920 * option.magnification, 539 * option.magnification],
    });
  });

  test('Parse ActivePositionBackward (APB) with Custom Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser({ ... initialState, position: [480, 60] }, option);

    parser.parseToken(ARIBB24ActivePositionBackwardToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [440 * option.magnification, 60 * option.magnification],
    });
  });

  test('Parse ActivePositionForward (APF) with Initial Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ActivePositionForwardToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [40 * option.magnification, 59 * option.magnification],
    });
  });

  test('Parse ActivePositionForward (APF) with Custom Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser({ ... initialState, position: [380, 89] }, option);

    parser.parseToken(ARIBB24ActivePositionForwardToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [420 * option.magnification, 89 * option.magnification],
    });
  });

  test('Parse ActivePositionDown (APD) with Initial Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ActivePositionDownToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [0 * option.magnification, 119 * option.magnification],
    });
  });

  test('Parse ActivePositionDown (APD) with Custon Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser({ ... initialState, position: [180, 199] }, option);

    parser.parseToken(ARIBB24ActivePositionDownToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [180 * option.magnification, 259 * option.magnification],
    });
  });

  test('Parse ActivePositionUp (APU) with Initial Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ActivePositionUpToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [0 * option.magnification, 539 * option.magnification],
    });
  });

  test('Parse ActivePositionUp (APU) with Custon Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser({ ... initialState, position: [390, 499] }, option);

    parser.parseToken(ARIBB24ActivePositionUpToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [390 * option.magnification, 439 * option.magnification],
    });
  });

  test('Parse ActivePositionReturn (APR) with Initial Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ActivePositionReturnToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [0 * option.magnification, 119 * option.magnification],
    });
  });

  test('Parse ActivePositionReturn (APR) with Custom Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser({ ... initialState, position: [120, 299] }, option);

    parser.parseToken(ARIBB24ActivePositionReturnToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [0 * option.magnification, 359 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Initial State', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ActivePositionSetToken.from(4, 4));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [160 * option.magnification, 299 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Custom Position', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser({ ... initialState, position: [120, 299] }, option);

    parser.parseToken(ARIBB24ActivePositionSetToken.from(3, 5));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      position: [120 * option.magnification, 359 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Custom CharacterCompositionDotDesignation (SSM)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CharacterCompositionDotDesignationToken.from(24, 24)),
    parser.parseToken(ARIBB24ActivePositionSetToken.from(8, 9));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      fontsize: [24 * option.magnification, 24 * option.magnification],
      position: [224 * option.magnification, 479 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Custom SetHorizontalSpacing (SHS)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetHorizontalSpacingToken.from(2)),
    parser.parseToken(ARIBB24ActivePositionSetToken.from(7, 3));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      hspace: 2 * option.magnification,
      position: [266 * option.magnification, 239 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with Custom SetHorizontalSpacing (SVS)', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SetVerticalSpacingToken.from(8)),
    parser.parseToken(ARIBB24ActivePositionSetToken.from(0, 5));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      vspace: 8 * option.magnification,
      position: [0 * option.magnification, 263 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with SmallSize', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SmallSizeToken.from()),
    parser.parseToken(ARIBB24ActivePositionSetToken.from(1, 2));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Small,
      position: [20 * option.magnification, 89 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with MiddleSize', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24MiddleSizeToken.from()),
    parser.parseToken(ARIBB24ActivePositionSetToken.from(3, 4));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Middle,
      position: [60 * option.magnification, 299 * option.magnification],
    });
  });

  test('Parse ActivePositionSet (APS) with NormalSize', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24NormalSizeToken.from()),
    parser.parseToken(ARIBB24ActivePositionSetToken.from(8, 1));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Normal,
      position: [320 * option.magnification, 119 * option.magnification],
    });
  });

  test('Parse SmallSize', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24SmallSizeToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Small,
    });
  });

  test('Parse MiddleSize', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24MiddleSizeToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Middle,
    });
  });

  test('Parse NormalSize', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24NormalSizeToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Normal,
    });
  });

  test('Parse CharacterSizeControl (SZX) Tiny', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.TINY));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Tiny,
    });
  });

  test('Parse CharacterSizeControl (SZX) Double Height', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.DoubleHeight,
    });
  });

  test('Parse CharacterSizeControl (SZX) Double Width', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_WIDTH));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.DoubleWidth,
    });
  });

  test('Parse CharacterSizeControl (SZX) Double Height and Width', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.DoubleHeightAndWidth,
    });
  });

  test('Parse CharacterSizeControl (SZX) Special 1', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_1));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Special1,
    });
  });

  test('Parse CharacterSizeControl (SZX) Special 2', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CharacterSizeControlToken.from(ARIBB24CharacterSizeControlType.SPECIAL_2));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      size: ARIBB24_CHARACTER_SIZE.Special2,
    });
  });

  test('Parse PalletControl', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(7));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 7,
    });
  });

  test('Parse BlackForeground (BKF) with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24BlackForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 0,
    });
  });

  test('Parse BlackForeground (BKF) with Custon Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(2));
    parser.parseToken(ARIBB24BlackForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 2,
      foreground: 32,
    });
  });

  test('Parse RedForeground (RDF) with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24RedForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 1,
    });
  });

  test('Parse RedForeground (RDF) with Custon Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(1));
    parser.parseToken(ARIBB24RedForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 1,
      foreground: 17,
    });
  });

  test('Parse GreenForeground (GRF) with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24GreenForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 2,
    });
  });

  test('Parse GreenForeground (GRF) with Custon Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(3));
    parser.parseToken(ARIBB24GreenForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 3,
      foreground: 50,
    });
  });

  test('Parse YellowForeground (YLF) with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24YellowForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 3,
    });
  });

  test('Parse YellowForeground (YLE) with Custon Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(4));
    parser.parseToken(ARIBB24YellowForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 4,
      foreground: 67,
    });
  });

  test('Parse BlueForeground (BLF) with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24BlueForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 4,
    });
  });

  test('Parse BlueForeground (BLF) with Custon Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(5));
    parser.parseToken(ARIBB24BlueForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 5,
      foreground: 84,
    });
  });

  test('Parse MagentaForeground (MGF) with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24MagentaForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 5,
    });
  });

  test('Parse MagentaForeground (MGF) with Custon Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(6));
    parser.parseToken(ARIBB24MagentaForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 6,
      foreground: 101,
    });
  });

  test('Parse CyanForeground (CYF) with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24CyanForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 6,
    });
  });

  test('Parse CyanForeground (CYF) with Custon Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(7));
    parser.parseToken(ARIBB24CyanForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 7,
      foreground: 118,
    });
  });

  test('Parse WhiteForeground (WHF) with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24WhiteForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 7,
    });
  });

  test('Parse WhiteForeground (WHF) with Custon Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(3));
    parser.parseToken(ARIBB24WhiteForegroundToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 3,
      foreground: 55,
    });
  });

  test('Parse ColorControlForeground with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ColorControlForegroundToken.from(8));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      foreground: 8,
    });
  });

  test('Parse ColorControlForeground with Custom Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(1));
    parser.parseToken(ARIBB24ColorControlForegroundToken.from(9));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 1,
      foreground: 25,
    });
  });

  test('Parse ColorControlHalfForeground with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ColorControlHalfForegroundToken.from(10));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      halfforeground: 10,
    });
  });

  test('Parse ColorControlHalfForeground with Custom Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(2));
    parser.parseToken(ARIBB24ColorControlHalfForegroundToken.from(11));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 2,
      halfforeground: 43,
    });
  });

  test('Parse ColorControlHalfBackground with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ColorControlHalfBackgroundToken.from(12));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      halfbackground: 12,
    });
  });

  test('Parse ColorControlHalfBackground with Custom Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(3));
    parser.parseToken(ARIBB24ColorControlHalfBackgroundToken.from(13));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 3,
      halfbackground: 61,
    });
  });

  test('Parse ColorControlBackground with Initial Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24ColorControlBackgroundToken.from(14));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      background: 14,
    });
  });

  test('Parse ColorControlBackground with Custom Pallet', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24PalletControlToken.from(4));
    parser.parseToken(ARIBB24ColorControlBackgroundToken.from(15));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      pallet: 4,
      background: 79,
    });
  });

  test('Parse StartLining', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24StartLiningToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      underline: true
    });
  });

  test('Parse StopLining', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24StopLiningToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      underline: false
    });
  });

  test('Parse HilightingCharacterBlock Highlights None', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24HilightingCharacterBlockToken.from(0x00));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      highlight: 0x00,
    });
  });

  test('Parse HilightingCharacterBlock Highlights ALL', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24HilightingCharacterBlockToken.from(0x0F));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      highlight: 0x0F,
    });
  });

  test('Parse OrnamentControlNone None ornament', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24OrnamentControlNoneToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      ornament: null,
    });
  });

  test('Parse OrnamentControl Hemming Black', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24OrnamentControlHemmingToken.from(0));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      ornament: 0,
    });
  });

  test('Parse FlashingControl STOP', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.STOP));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      flashing: ARIBB24FlashingControlType.STOP,
    });
  });

  test('Parse FlashingControl NORMAL', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.NORMAL));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      flashing: ARIBB24FlashingControlType.NORMAL,
    });
  });

  test('Parse FlashingControl INVERTED', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.INVERTED));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      flashing: ARIBB24FlashingControlType.INVERTED,
    });
  });

  test('Parse TimeControlWait', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24TimeControlWaitToken.from(10));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      elapsed_time: 10,
    });
  });


  test('Parse Multiple TimeControlWait', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24TimeControlWaitToken.from(15));
    parser.parseToken(ARIBB24TimeControlWaitToken.from(20));

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      elapsed_time: 35,
    });
  });

  test('Parse ClearScreen with Initial State', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    const tokens = parser.parseToken(ARIBB24ClearScreenToken.from());

    expect(parser.currentState()).toStrictEqual(initialStateMagnificated(initialState, option));
    expect(tokens).toStrictEqual([
      ARIBB24ClearScreenParsedToken.from(0, initialStateMagnificated(initialState, option), option)
    ]);
  });

  test('Parse ClearScreen with Time Elapsed', () => {
    const option= { magnification: 2 } as const satisfies ARIBB24ParserOption;
    const parser = new ARIBB24Parser(initialState, option);

    parser.parseToken(ARIBB24TimeControlWaitToken.from(5));
    const tokens = parser.parseToken(ARIBB24ClearScreenToken.from());

    expect(parser.currentState()).toStrictEqual({
      ... initialStateMagnificated(initialState, option),
      elapsed_time: 5,
    });
    expect(tokens).toStrictEqual([
      ARIBB24ClearScreenParsedToken.from(5, { ... initialStateMagnificated(initialState, option), elapsed_time: 5 }, option)
    ]);
  });
});

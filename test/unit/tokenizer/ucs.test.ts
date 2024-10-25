import { describe, test, expect } from 'vitest';
import ARIBB24UTF8Tokenizer from '@/tokenizer/b24/ucs/tokenizer';
import { ActiveCoordinatePositionSet, ActivePositionBackward, ActivePositionDown, ActivePositionForward, ActivePositionReturn, ActivePositionSet, ActivePositionUp, Bell, BlackForeground, BlueForeground, BuiltinSoundReplay, Cancel, Character, CharacterCompositionDotDesignation, CharacterSizeControl, CharacterSizeControlType, ClearScreen, ColorControlBackground, ColorControlForeground, ColorControlHalfBackground, ColorControlHalfForeground, ConcealmentMode, ConcealmentModeType, CyanForeground, Delete, DRCS, FlashingControl, FlashingControlType, GreenForeground, HilightingCharacterBlock, MagentaForeground, MiddleSize, NormalSize, Null, OrnamentControlHemming, OrnamentControlHollow, OrnamentControlNone, OrnamentControlShade, OrnamentControlType, PalletControl, ParameterizedActivePositionForward, PatternPolarityControl, PatternPolarityControlType, RasterColourCommand, RecordSeparator, RedForeground, RepeatCharacter, ReplacingConcealmentMode, ReplacingConcealmentModeType, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, SingleConcealmentMode, SingleConcealmentModeType, SmallSize, Space, StartLining, StopLining, TimeControlMode, TimeControlModeType, TimeControlWait, UnitSeparator, WhiteForeground, WritingModeModification, WritingModeModificationType, YellowForeground } from '@/tokenizer/token';
import { CONTROL_CODES, CSI_CODE, replaceDRCS } from '@/tokenizer/b24/tokenizer';
import { NotImplementedError, NotUsedDueToStandardError, UnreachableError } from '@/util/error';
import md5 from '@/util/md5';

const generateBinary = (... operation: (number | string)[]): ArrayBuffer => {
  const encoder = new TextEncoder();
  const inject = operation.map((elem) => {
    if (typeof(elem) === 'number') {
      return Uint8Array.from([elem]);
    } else{
      return new Uint8Array(encoder.encode(elem));
    }
  });

  const length = inject.reduce((sum, array) => sum + array.byteLength, 0);
  const uint8 = new Uint8Array(length);
  for (let i = 0, offset = 0; i < inject.length; offset += inject[i].byteLength, i++) {
    uint8.set(inject[i], offset);
  }
  return uint8.buffer;
}

const generateCSI = (F: number, ... values: number[]): number[] => {
  const ops = [F];

  let sp: 0x20 | 0x3b = 0x20;
  for (let value of values.toReversed()) {
    ops.unshift(sp);
    while (value !== 0) {
      ops.unshift(0x30 | (value % 10));
      value = Math.floor(value / 10);
    }

    sp = 0x3b;
  }
  ops.unshift(CONTROL_CODES.CSI);

  return ops;
}

const generateDRCSUnit = (code: number, width: number, height: number, colors: number, binary?: number[]): ArrayBuffer => {
  if (binary == null) {
    binary = [];
    const bits = [0, 1, 6, 2, 7, 5, 4, 3][(colors * 0b00011101) >> 5];
    for (let index = 0; index < Math.floor(width * height * bits / 8); index++) {
      binary.push(0xFF);
    }
  }

  return Uint8Array.from([
    1, // Number Of Code
    (code & 0xFF00) >> 8, // Character Code
    (code & 0x00FF) >> 0, // Character Code
    1, // Number Of Font
    0, // mode
    colors - 2, // depth - 2,
    width, // width,
    height, // height
    ... binary,
  ]).buffer;
}

describe("ARIB STD-B24 UCS Tokenizer", () => {

  test('Tokenize UTF-8 ASCII', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('a'))).toStrictEqual([
      Character.from('a'),
    ]);
  });

  test('Tokenize UTF-8 Japanese', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('あ'))).toStrictEqual([
      Character.from('あ'),
    ]);
  });

  test('Tokenize UTF-8 surrogate pair', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('叱'))).toStrictEqual([
      Character.from('叱'),
    ]);
  });

  test('Tokenize UTF-8 combining character', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary('👨‍👩'))).toStrictEqual([
      Character.from('👨‍👩'),
    ]);
  });

  test('Tokenize UTF-8 DRCS', () => {
    const width = 36, heihgt = 36, colors = 4;
    const binary = [];
    for (let index = 0; index < Math.floor(36 * 36 * 2 / 8); index++) {
      binary.push(0xFF);
    }

    const tokenizer = new ARIBB24UTF8Tokenizer();
    tokenizer.processDRCS(2, generateDRCSUnit(0xec00, width, heihgt, colors, binary));

    expect(tokenizer.tokenizeStatement(generateBinary('\uec00'))).toStrictEqual([
      DRCS.from(36, 36, 2, Uint8Array.from(binary).buffer)
    ]);
  });

  test('Tokenize UTF-8 DRCS with Combine (ignore currently)', () => {
    const width = 36, heihgt = 36, colors = 4;
    const binary = [];
    for (let index = 0; index < Math.floor(36 * 36 * 2 / 8); index++) {
      binary.push(0xFF);
    }

    const tokenizer = new ARIBB24UTF8Tokenizer();
    tokenizer.processDRCS(2, generateDRCSUnit(0xec00, width, heihgt, colors, binary));

    expect(tokenizer.tokenizeStatement(generateBinary('\uec00', '\u3099'))).toStrictEqual([
      DRCS.from(36, 36, 2, Uint8Array.from(binary).buffer, '\u3099')
    ]);
  });

  test('Tokenize UTF-8 DRCS with ReplaceDRCS', () => {
    const width = 36, heihgt = 36, colors = 4;
    const binary = [];
    for (let index = 0; index < Math.floor(36 * 36 * 2 / 8); index++) {
      binary.push(0xFF);
    }
    const replace = new Map([[md5(Uint8Array.from(binary).buffer), '〓']]);

    const tokenizer = new ARIBB24UTF8Tokenizer();
    tokenizer.processDRCS(2, generateDRCSUnit(0xec00, width, heihgt, colors, binary));

    expect(replaceDRCS(tokenizer.tokenizeStatement(generateBinary('\uec00', '\u3099')), replace)).toStrictEqual([
      Character.from('〓\u3099')
    ]);
  });

  test('Tokenize SS2 throw NotUsedDueToStandardError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.SS2))).toThrowError(NotUsedDueToStandardError);
  });

  test('Tokenize SS3 throw NotUsedDueToStandardError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.SS3))).toThrowError(NotUsedDueToStandardError);
  });

  test('Tokenize LS0 throw NotUsedDueToStandardError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.LS0))).toThrowError(NotUsedDueToStandardError);
  });

  test('Tokenize Tokenize LS1 throw NotUsedDueToStandardError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.LS1))).toThrowError(NotUsedDueToStandardError);
  });

  test('Tokenize ESC throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.ESC))).toThrowError(NotImplementedError);
  });

  test('Tokenize NULL', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.NUL))).toStrictEqual([
      Null.from()
    ]);
  });

  test('Tokenize BEL', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.BEL))).toStrictEqual([
      Bell.from()
    ]);
  });

  test('Tokenize APB', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APB))).toStrictEqual([
      ActivePositionBackward.from()
    ]);
  });

  test('Tokenize APF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APF))).toStrictEqual([
      ActivePositionForward.from()
    ]);
  });

  test('Tokenize APD', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APD))).toStrictEqual([
      ActivePositionDown.from()
    ]);
  });

  test('Tokenize APU', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APU))).toStrictEqual([
      ActivePositionUp.from()
    ]);
  });

  test('Tokenize CS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.CS))).toStrictEqual([
      ClearScreen.from()
    ]);
  });

  test('Tokenize APR', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APR))).toStrictEqual([
      ActivePositionReturn.from()
    ]);
  });

  test('Tokenize PAPF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.PAPF, 5))).toStrictEqual([
      ParameterizedActivePositionForward.from(5)
    ]);
  });

  test('Tokenize CAN', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.CAN))).toStrictEqual([
      Cancel.from()
    ]);
  });

  test('Tokenize APS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.APS, 1, 3))).toStrictEqual([
      ActivePositionSet.from(3, 1)
    ]);
  });

  test('Tokenize RS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.RS))).toStrictEqual([
      RecordSeparator.from()
    ]);
  });

  test('Tokenize US', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.US))).toStrictEqual([
      UnitSeparator.from()
    ]);
  });

  test('Tokenize SP', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.SP))).toStrictEqual([
      Space.from()
    ]);
  });

  test('Tokenize DEL', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(CONTROL_CODES.DEL))).toStrictEqual([
      Delete.from()
    ]);
  });

  test('Tokenize BKF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.BKF))).toStrictEqual([
      BlackForeground.from()
    ]);
  });

  test('Tokenize RDF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.RDF))).toStrictEqual([
      RedForeground.from()
    ]);
  });

  test('Tokenize GRF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.GRF))).toStrictEqual([
      GreenForeground.from()
    ]);
  });

  test('Tokenize YLF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.YLF))).toStrictEqual([
      YellowForeground.from()
    ]);
  });

  test('Tokenize BLF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.BLF))).toStrictEqual([
      BlueForeground.from()
    ]);
  });

  test('Tokenize MGF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.MGF))).toStrictEqual([
      MagentaForeground.from()
    ]);
  });

  test('Tokenize CNF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CNF))).toStrictEqual([
      CyanForeground.from()
    ]);
  });

  test('Tokenize WHF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.WHF))).toStrictEqual([
      WhiteForeground.from()
    ]);
  });

  test('Tokenize SSZ', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.SSZ))).toStrictEqual([
      SmallSize.from()
    ]);
  });

  test('Tokenize MSZ', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.MSZ))).toStrictEqual([
      MiddleSize.from()
    ]);
  });

  test('Tokenize NSZ', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.NSZ))).toStrictEqual([
      NormalSize.from()
    ]);
  });

  test('Tokenize SZX Tiny', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.SZX, 0x60))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.TINY)
    ]);
  });

  test('Tokenize SZX Double Height', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.SZX, 0x41))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT)
    ]);
  });

  test('Tokenize SZX Double Width', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.SZX, 0x44))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_WIDTH)
    ]);
  });

  test('Tokenize SZX Double Width and Width', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.SZX, 0x45))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH)
    ]);
  });

  test('Tokenize SZX Special1', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.SZX, 0x6b))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_1)
    ]);
  });

  test('Tokenize SZX Special2', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.SZX, 0x64))).toStrictEqual([
      CharacterSizeControl.from(CharacterSizeControlType.SPECIAL_2)
    ]);
  });

  test('Tokenize COL Foreground', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    // SBDTV used transparent space
    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.COL, 0x48))).toStrictEqual([
      ColorControlForeground.from(8)
    ]);
  });

  test('Tokenize COL BackGround', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    // SBDTV used black background
    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.COL, 0x50))).toStrictEqual([
      ColorControlBackground.from(0)
    ]);
  });

  test('Tokenize COL HalfForeground', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.COL, 0x61))).toStrictEqual([
      ColorControlHalfForeground.from(1)
    ]);
  });

  test('Tokenize COL HalfBackground', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.COL, 0x72))).toStrictEqual([
      ColorControlHalfBackground.from(2)
    ]);
  });

  test('Tokenize COL Pallet', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.COL, 0x20, 0x45))).toStrictEqual([
      PalletControl.from(5)
    ]);
  });

  test('Tokenize FLC Normal', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.FLC, 0x40))).toStrictEqual([
      FlashingControl.from(FlashingControlType.NORMAL)
    ]);
  });

  test('Tokenize FLC Inverted', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.FLC, 0x47))).toStrictEqual([
      FlashingControl.from(FlashingControlType.INVERTED)
    ]);
  });

  test('Tokenize FLC Stop', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.FLC, 0x4F))).toStrictEqual([
      FlashingControl.from(FlashingControlType.STOP)
    ]);
  });

  test('Tokenize CDC Signle Start', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x40))).toStrictEqual([
      SingleConcealmentMode.from(SingleConcealmentModeType.START)
    ]);
  });

  test('Tokenize CDC Replacing Start', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x40))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.START)
    ]);
  });

  test('Tokenize CDC Replacing First', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x41))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FIRST)
    ]);
  });

  test('Tokenize CDC Replacing Second', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x42))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SECOND)
    ]);
  });

  test('Tokenize CDC Replacing Third', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x43))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.THIRD)
    ]);
  });

  test('Tokenize CDC Replacing Fourth', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x44))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FOURTH)
    ]);
  });

  test('Tokenize CDC Replacing Fifth', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x45))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.FIFTH)
    ]);
  });

  test('Tokenize CDC Replacing Sixth', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x46))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SIXTH)
    ]);
  });

  test('Tokenize CDC Replacing Seventh', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x47))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.SEVENTH)
    ]);
  });

  test('Tokenize CDC Replacing Eighth', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x48))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.EIGHTH)
    ]);
  });

  test('Tokenize CDC Replacing Ninth', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x49))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.NINTH)
    ]);
  });

  test('Tokenize CDC Replacing Tenth', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x20, 0x4A))).toStrictEqual([
      ReplacingConcealmentMode.from(ReplacingConcealmentModeType.TENTH)
    ]);
  });

  test('Tokenize CDC Stop', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.CDC, 0x4F))).toStrictEqual([
      ConcealmentMode.from(ConcealmentModeType.STOP)
    ]);
  });

  test('Tokenize POL Normal', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.POL, 0x40))).toStrictEqual([
      PatternPolarityControl.from(PatternPolarityControlType.NORMAL)
    ]);
  });

  test('Tokenize POL Inverted1', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.POL, 0x41))).toStrictEqual([
      PatternPolarityControl.from(PatternPolarityControlType.INVERTED_1)
    ]);
  });

  test('Tokenize POL Inverted2', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.POL, 0x42))).toStrictEqual([
      PatternPolarityControl.from(PatternPolarityControlType.INVERTED_2)
    ]);
  });

  test('Tokenize WMM Both', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.WMM, 0x40))).toStrictEqual([
      WritingModeModification.from(WritingModeModificationType.BOTH)
    ]);
  });

  test('Tokenize WMM Foreground', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.WMM, 0x44))).toStrictEqual([
      WritingModeModification.from(WritingModeModificationType.FOREGROUND)
    ]);
  });

  test('Tokenize WMM Background', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.WMM, 0x45))).toStrictEqual([
      WritingModeModification.from(WritingModeModificationType.BACKGROUND)
    ]);
  });

  test('Tokenize MACRO throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.MACRO))).toThrowError(NotImplementedError);
  });

  test('Tokenize HLC', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.HLC, 0x4F))).toStrictEqual([
      HilightingCharacterBlock.from(0x0F)
    ]);
  });

  test('Tokenize RPC', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.RPC, 0x7F))).toStrictEqual([
      RepeatCharacter.from(0x3F)
    ]);
  });

  test('Tokenize SPL', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.SPL))).toStrictEqual([
      StopLining.from()
    ]);
  });

  test('Tokenize STL', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.STL))).toStrictEqual([
      StartLining.from()
    ]);
  });

  test('Tokenize Time Wait', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.TIME, 0x20, 0x7F))).toStrictEqual([
      TimeControlWait.from(0x3F / 10)
    ]);
  });

  test('Tokenize Time TMD Mode Free', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.TIME, 0x28, 0x40))).toStrictEqual([
      TimeControlMode.from(TimeControlModeType.FREE)
    ]);
  });

  test('Tokenize Time TMD Mode Real', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.TIME, 0x28, 0x41))).toStrictEqual([
      TimeControlMode.from(TimeControlModeType.REAL)
    ]);
  });

  test('Tokenize Time TMD Mode Offset', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.TIME, 0x28, 0x42))).toStrictEqual([
      TimeControlMode.from(TimeControlModeType.OFFSET)
    ]);
  });

  test('Tokenize Time TMD Mode Unique', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.TIME, 0x28, 0x43))).toStrictEqual([
      TimeControlMode.from(TimeControlModeType.UNIQUE)
    ]);
  });

  test('Tokenize Time Specify throw NotUsedDueToStandardError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, CONTROL_CODES.TIME, 0x29))).toThrowError(NotUsedDueToStandardError);
  });

  test('Tokenize CSI GSM throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.GSM)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI SWF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.SWF, 7)))).toStrictEqual([
      SetWritingFormat.from(7)
    ]);
  });

  test('Tokenize CSI CCC throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.CCC)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI SDF', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.SDF, 680, 480)))).toStrictEqual([
      SetDisplayFormat.from(680, 480),
    ]);
  });

  test('Tokenize CSI SSM', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.SSM, 24, 24)))).toStrictEqual([
      CharacterCompositionDotDesignation.from(24, 24),
    ]);
  });

  test('Tokenize CSI SHS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.SHS, 1)))).toStrictEqual([
      SetHorizontalSpacing.from(1)
    ]);
  });

  test('Tokenize CSI SVS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.SVS, 1)))).toStrictEqual([
      SetVerticalSpacing.from(1)
    ]);
  });

  test('Tokenize CSI PLD throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.PLD)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI PLU throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.PLU)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI GAA throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.GAA)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI SRC throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.SRC)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI SDP', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.SDP, 100, 100)))).toStrictEqual([
      SetDisplayPosition.from(100, 100)
    ]);
  });

  test('Tokenize CSI ACPS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.ACPS, 700, 400)))).toStrictEqual([
      ActiveCoordinatePositionSet.from(700, 400)
    ]);
  });

  test('Tokenize CSI TCC', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.TCC)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI ORN NoneOrnament without CLMA', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.ORN, 0)))).toStrictEqual([
      OrnamentControlNone.from(),
    ]);
  });

  test('Tokenize CSI ORN HemmingOrnament', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.ORN, 1, 0x7F)))).toStrictEqual([
      OrnamentControlHemming.from(0x7F),
    ]);
  });

  test('Tokenize CSI ORN ShadeOrament', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.ORN, 2, 0x7F)))).toStrictEqual([
      OrnamentControlShade.from(0x7F)
    ]);
  });

  test('Tokenize CSI ORN HollowOrament', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.ORN, 3)))).toStrictEqual([
      OrnamentControlHollow.from()
    ]);
  });

  test('Tokenize CSI MDF throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.MDF)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI CFS throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.CFS)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI XCS throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.XCS)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI PRA', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.PRA, 0)))).toStrictEqual([
      BuiltinSoundReplay.from(0),
    ]);
  });

  test('Tokenize CSI ACS throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.ACS)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI UED throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.UED)))).toThrowError(NotImplementedError);
  });

  test('Tokenize CSI RCS', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.RCS, 0)))).toStrictEqual([
      RasterColourCommand.from(0),
    ]);
  });

  test('Tokenize CSI SCS throw NotImplementedError', () => {
    const tokenizer = new ARIBB24UTF8Tokenizer();

    expect(() => tokenizer.tokenizeStatement(generateBinary(0xC2, ... generateCSI(CSI_CODE.SCS)))).toThrowError(NotImplementedError);
  });
});

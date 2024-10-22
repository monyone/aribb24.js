export type Character = {
  tag: 'Character';
  character: string;
  non_spacing: boolean;
};
export const Character = {
  from(character: string, non_spacing: boolean): Character {
    return { tag: 'Character', character, non_spacing };
  }
};

export type Mosaic = {
  tag: 'Mosaic';
  // TODO: ここはなんか符号を入れるべき
};
export const Mosaic = {
  from(): Mosaic {
    return { tag: 'Mosaic' };
  }
};

export type DRCS = {
  tag: 'DRCS';
  width: number;
  height: number;
  depth: number;
  binary: ArrayBuffer;
};
export const DRCS = {
  from(width: number, height: number, depth: number, binary: ArrayBuffer): DRCS {
    return { tag: 'DRCS', width, height, depth, binary };
  }
};

export type Bitmap = {
  tag: 'Bitmap';
  x_position: number;
  y_position: number;
  flc_colors: number[];
  binary: ArrayBuffer;
};
export const Bitmap = {
  from(x_position: number, y_position: number, flc_colors: number[], binary: ArrayBuffer): Bitmap {
    return { tag: 'Bitmap', x_position, y_position, flc_colors, binary };
  }
};

export type Null = { // NUL
  tag: 'Null';
};
export const Null = {
  from(): Null {
    return { tag: 'Null' };
  }
};

export type Bell = { // BEL
  tag: 'Bell';
};
export const Bell = {
  from(): Bell {
    return { tag: 'Bell' };
  }
};

export type ActivePositionBackward = { // APB
  tag: 'ActivePositionBackward';
};
export const ActivePositionBackward = {
  from(): ActivePositionBackward {
    return { tag: 'ActivePositionBackward' };
  }
};

export type ActivePositionForward = { // APF
  tag: 'ActivePositionForward';
};
export const ActivePositionForward = {
  from(): ActivePositionForward {
    return { tag: 'ActivePositionForward' };
  }
};

export type ActivePositionDown = { // APD
  tag: 'ActivePositionDown';
};
export const ActivePositionDown = {
  from(): ActivePositionDown {
    return { tag: 'ActivePositionDown' };
  }
};

export type ActivePositionUp = { // APU
  tag: 'ActivePositionUp';
};
export const ActivePositionUp = {
  from(): ActivePositionUp {
    return { tag: 'ActivePositionUp' };
  }
};

export type ClearScreen = { // CS
  tag: 'ClearScreen';
};
export const ClearScreen = {
  from(): ClearScreen {
    return { tag: 'ClearScreen' };
  }
};

export type ActivePositionReturn = { // APR
  tag: 'ActivePositionReturn';
};
export const ActivePositionReturn = {
  from(): ActivePositionReturn {
    return { tag: 'ActivePositionReturn' };
  }
};

export type ParameterizedActivePositionForward = { // PAPF
  tag: 'ParameterizedActivePositionForward';
  x: number;
};
export const ParameterizedActivePositionForward = {
  from(x: number): ParameterizedActivePositionForward {
    return { tag: 'ParameterizedActivePositionForward', x };
  }
};

export type Cancel = { // CAN
  tag: 'Cancel';
};
export const Cancel = {
  from(): Cancel {
    return { tag: 'Cancel' };
  }
};

export type ActivePositionSet = { // APS
  tag: 'ActivePositionSet';
  x: number;
  y: number;
}
export const ActivePositionSet = {
  from(x: number, y: number): ActivePositionSet {
    return { tag: 'ActivePositionSet', x, y };
  }
};

export type RecordSeparator = {
  tag: 'RecordSeparator';
};
export const RecordSeparator = {
  from(): RecordSeparator {
    return { tag: 'RecordSeparator' };
  }
};

export type UnitSeparator = {
  tag: 'UnitSeparator';
};
export const UnitSeparator = {
  from(): UnitSeparator {
    return { tag: 'UnitSeparator' };
  }
};

export type Space = { // SP
  tag: 'Space';
}
export const Space = {
  from(): Space {
    return { tag: 'Space' };
  }
};

export type Delete = { // DEL
  tag: 'Delete';
};
export const Delete = {
  from(): Delete {
    return { tag: 'Delete' };
  }
};

export type BlackForeground = { // BKF
  tag: 'BlackForeground';
};
export const BlackForeground = {
  from(): BlackForeground {
    return { tag: 'BlackForeground' };
  }
};

export type RedForeground = { // RDF
  tag: 'RedForeground';
};
export const RedForeground = {
  from(): RedForeground {
    return { tag: 'RedForeground' };
  }
};

export type GreenForeground = { // GRF
  tag: 'GreenForeground';
};
export const GreenForeground = {
  from(): GreenForeground {
    return { tag: 'GreenForeground' };
  }
};

export type YellowForeground = { // YLF
  tag: 'YellowForeground';
};
export const YellowForeground = {
  from(): YellowForeground {
    return { tag: 'YellowForeground' };
  }
};

export type BlueForeground = { // BLF
  tag: 'BlueForeground';
};
export const BlueForeground = {
  from(): BlueForeground {
    return { tag: 'BlueForeground' };
  }
};

export type MagentaForeground = { // MGF
  tag: 'MagentaForeground';
};
export const MagentaForeground = {
  from(): MagentaForeground {
    return { tag: 'MagentaForeground' };
  }
};

export type CyanForeground = { // CNF
  tag: 'CyanForeground';
};
export const CyanForeground = {
  from(): CyanForeground {
    return { tag: 'CyanForeground' };
  }
};

export type WhiteForeground = { // WHF
  tag: 'WhiteForeground';
};
export const WhiteForeground = {
  from(): WhiteForeground {
    return { tag: 'WhiteForeground' };
  }
};

export type SmallSize = { // SSZ
  tag: 'SmallSize';
};
export const SmallSize = {
  from(): SmallSize {
    return { tag: 'SmallSize' };
  }
};

export type MiddleSize = { // MSZ
  tag: 'MiddleSize';
};
export const MiddleSize = {
  from(): MiddleSize {
    return { tag: 'MiddleSize' };
  }
};

export type NormalSize = { // NSZ
  tag: 'NormalSize';
};
export const NormalSize = {
  from(): NormalSize {
    return { tag: 'NormalSize' };
  }
};

export const CharacterSizeControlType = {
  TINY: 0x60,
  DOUBLE_HEIGHT: 0x41,
  DOUBLE_WIDTH: 0x44,
  DOUBLE_HEIGHT_AND_WIDTH: 0x45,
  SPECIAL_1: 0x6b,
  SPECIAL_2: 0x64,
} as const;
export type CharacterSizeControl = {
  tag: 'CharacterSizeControl';
  type: (typeof CharacterSizeControlType)[keyof typeof CharacterSizeControlType];
};
export const CharacterSizeControl = {
  from(type: (typeof CharacterSizeControlType)[keyof typeof CharacterSizeControlType]): CharacterSizeControl {
    return { tag: 'CharacterSizeControl', type };
  }
};

export type ColorControlForeground = {
  tag: 'ColorControlForeground';
  color: number; // 8 ~ 15
};
export const ColorControlForeground = {
  from(color: number): ColorControlForeground {
    return { tag: 'ColorControlForeground', color };
  }
};

export type ColorControlBackground = {
  tag: 'ColorControlBackground';
  color: number; // 0 ~ 15
};
export const ColorControlBackground = {
  from(color: number): ColorControlBackground {
    return { tag: 'ColorControlBackground', color };
  }
};

export type ColorControlHalfForeground = {
  tag: 'ColorControlHalfForeground';
  color: number; // 0 ~ 15
};
export const ColorControlHalfForeground = {
  from(color: number): ColorControlHalfForeground {
    return { tag: 'ColorControlHalfForeground', color };
  }
};

export type ColorControlHalfBackground = {
  tag: 'ColorControlHalfBackground';
  color: number; // 0 ~ 15
};
export const ColorControlHalfBackground = {
  from(color: number): ColorControlHalfBackground {
    return { tag: 'ColorControlHalfBackground', color };
  }
};

export type PalletControl = {
  tag: 'PalletControl';
  pallet: number;
};
export const PalletControl = {
  from(pallet: number): PalletControl {
    return { tag: 'PalletControl', pallet };
  }
};

export const FlashingControlType = {
  NORMAL: 0x40,
  INVERTED: 0x47,
  STOP: 0x4F,
} as const;
export type FlashingControl = {
  tag: 'FlashingControl';
  type: (typeof FlashingControlType)[keyof typeof FlashingControlType];
}
export const FlashingControl = {
  from(type: (typeof FlashingControlType)[keyof typeof FlashingControlType]): FlashingControl {
    return { tag: 'FlashingControl', type };
  }
};


export const ConcealmentModeType = {
  STOP: 0x4F,
} as const;
export type ConcealmentMode = {
  tag: 'ConcealmentMode';
  type: (typeof ConcealmentModeType)[keyof typeof ConcealmentModeType];
};
export const ConcealmentMode = {
  from(type: (typeof ConcealmentModeType)[keyof typeof ConcealmentModeType]): ConcealmentMode {
    return { tag: 'ConcealmentMode', type };
  }
};

export const SingleConcealmentModeType = {
  START: 0x40,
} as const;
export type SingleConcealmentMode = {
  tag: 'SingleConcealmentMode';
  type: (typeof SingleConcealmentModeType)[keyof typeof SingleConcealmentModeType];
};
export const SingleConcealmentMode = {
  from(type: (typeof SingleConcealmentModeType)[keyof typeof SingleConcealmentModeType]): SingleConcealmentMode {
    return { tag: 'SingleConcealmentMode', type };
  }
};

export const ReplacingConcealmentModeType = {
  START: 0x40,
  FIRST: 0x41,
  SECOND: 0x42,
  THIRD: 0x43,
  FOURTH: 0x44,
  FIFTH: 0x45,
  SIXTH: 0x46,
  SEVENTH: 0x47,
  EIGHTH: 0x48,
  NINTH: 0x49,
  TENTH: 0x4a,
} as const;
export type ReplacingConcealmentMode = {
  tag: 'ReplacingConcealmentMode';
  type: (typeof ReplacingConcealmentModeType)[keyof typeof ReplacingConcealmentModeType];
};
export const ReplacingConcealmentMode = {
  from(type: (typeof ReplacingConcealmentModeType)[keyof typeof ReplacingConcealmentModeType]): ReplacingConcealmentMode {
    return { tag: 'ReplacingConcealmentMode', type };
  }
};

export const PatternPolarityControlType = {
  NORMAL: 0x40,
  INVERTED_1: 0x41,
  INVERTED_2: 0x42,
} as const;
export type PatternPolarityControl = {
  tag: 'PatternPolarityControl';
  type: (typeof PatternPolarityControlType)[keyof typeof PatternPolarityControlType]
};
export const PatternPolarityControl = {
  from(type: (typeof PatternPolarityControlType)[keyof typeof PatternPolarityControlType]): PatternPolarityControl {
    return { tag: 'PatternPolarityControl', type};
  }
};

export const WritingModeModificationType = {
  BOTH: 0x40,
  FOREGROUND: 0x44,
  BACKGROUND: 0x45
} as const;
export type WritingModeModification = {
  tag: 'WritingModeModification';
  type: (typeof WritingModeModificationType)[keyof typeof WritingModeModificationType];
};
export const WritingModeModification = {
  from(type: (typeof WritingModeModificationType)[keyof typeof WritingModeModificationType]): WritingModeModification {
    return { tag: 'WritingModeModification', type };
  }
};

// TODO: MACRO

export type HilightingCharacterBlock = {
  tag: 'HilightingCharacterBlock';
  enclosure: number;
};
export const HilightingCharacterBlock = {
  from(enclosure: number): HilightingCharacterBlock {
    return { tag: 'HilightingCharacterBlock', enclosure };
  }
};

export type RepeatCharacter = {
  tag: 'RepeatCharacter';
  repeat: number;
};
export const RepeatCharacter = {
  from(repeat: number): RepeatCharacter {
    return { tag: 'RepeatCharacter', repeat };
  }
};

export type StartLining = {
  tag: 'StartLining';
}
export const StartLining = {
  from(): StartLining {
    return { tag: 'StartLining' };
  }
};

export type StopLining = {
  tag: 'StopLining';
}
export const StopLining = {
  from(): StopLining {
    return { tag: 'StopLining' };
  }
};

export type TimeControlWait = {
  tag: 'TimeControlWait';
  seconds: number;
};
export const TimeControlWait = {
  from(seconds: number): TimeControlWait {
    return { tag: 'TimeControlWait', seconds };
  }
};

export const TimeControlModeType = {
  FREE: 0x40,
  REAL: 0x41,
  OFFSET: 0x42,
  UNIQUE: 0x43,
} as const;
export type TimeControlMode = {
  tag: 'TimeControlMode';
  type: (typeof TimeControlModeType)[keyof typeof TimeControlModeType];
}
export const TimeControlMode = {
  from(type: (typeof TimeControlModeType)[keyof typeof TimeControlModeType]): TimeControlMode {
    return { tag: 'TimeControlMode', type };
  }
};

export type SetWritingFormat = {
  tag: 'SetWritingFormat';
  format: number;
};
export const SetWritingFormat = {
  from(format: number): SetWritingFormat {
    return { tag: 'SetWritingFormat', format };
  }
};

export type SetDisplayFormat = {
  tag: 'SetDisplayFormat';
  horizontal: number;
  vertical: number;
};
export const SetDisplayFormat = {
  from(horizontal: number, vertical: number): SetDisplayFormat {
    return { tag: 'SetDisplayFormat', horizontal, vertical };
  }
};

export type SetDisplayPosition = {
  tag: 'SetDisplayPosition';
  horizontal: number;
  vertical: number;
};
export const SetDisplayPosition = {
  from(horizontal: number, vertical: number): SetDisplayPosition {
    return { tag: 'SetDisplayPosition', horizontal, vertical };
  }
};

export type CharacterCompositionDotDesignation = {
  tag: 'CharacterCompositionDotDesignation';
  horizontal: number;
  vertical: number;
};
export const CharacterCompositionDotDesignation = {
  from(horizontal: number, vertical: number): CharacterCompositionDotDesignation {
    return { tag: 'CharacterCompositionDotDesignation', horizontal, vertical };
  }
};

export type SetHorizontalSpacing = {
  tag: 'SetHorizontalSpacing';
  spacing: number;
};
export const SetHorizontalSpacing = {
  from(spacing: number): SetHorizontalSpacing {
    return { tag: 'SetHorizontalSpacing', spacing };
  }
};

export type SetVerticalSpacing = {
  tag: 'SetVerticalSpacing';
  spacing: number;
};
export const SetVerticalSpacing = {
  from(spacing: number): SetVerticalSpacing {
    return { tag: 'SetVerticalSpacing', spacing };
  }
};

export type ActiveCoordinatePositionSet = {
  tag: 'ActiveCoordinatePositionSet';
  x: number;
  y: number;
};
export const ActiveCoordinatePositionSet = {
  from(x: number, y: number): ActiveCoordinatePositionSet {
    return { tag: 'ActiveCoordinatePositionSet', x, y };
  }
};

export const OrnamentControlType = {
  NONE: 0x00,
  HEMMING: 0x01,
  SHADE: 0x02,
  HOLLOW: 0x03,
} as const;

export type OrnamentControl = {
  tag: 'OrnamentControl';
  type: (typeof OrnamentControlType)[keyof typeof OrnamentControlType]
  ornament: number;
};
export const OrnamentControl = {
  from(type: (typeof OrnamentControlType)[keyof typeof OrnamentControlType], ornament: number): OrnamentControl {
    return { tag: 'OrnamentControl', type, ornament };
  }
};

export type BuiltinSoundReplay = {
  tag: 'BuiltinSoundReplay';
  sound: number;
};
export const BuiltinSoundReplay = {
  from(sound: number): BuiltinSoundReplay {
    return { tag: 'BuiltinSoundReplay', sound };
  }
};

export type RasterColourCommand = {
  tag: 'RasterColourCommand';
  color: number;
};
export const RasterColourCommand = {
  from(color: number): RasterColourCommand {
    return { tag: 'RasterColourCommand', color };
  }
};

export type ARIBB24Token =
  // ビットマップ
  Bitmap |
  // 文字
  Character |
  Mosaic |
  DRCS |
  // 制御符号 (C0)
  Null |
  Bell |
  ActivePositionBackward |
  ActivePositionForward |
  ActivePositionDown |
  ActivePositionUp |
  ClearScreen |
  ActivePositionReturn |
  ParameterizedActivePositionForward |
  Cancel |
  ActivePositionSet |
  RecordSeparator |
  UnitSeparator |
  Space |
  // 制御符号 (C1)
  Delete |
  BlackForeground |
  RedForeground |
  GreenForeground |
  YellowForeground |
  BlueForeground |
  MagentaForeground |
  CyanForeground |
  WhiteForeground |
  SmallSize |
  MiddleSize |
  NormalSize |
  CharacterSizeControl |
  ColorControlForeground |
  ColorControlBackground |
  ColorControlHalfForeground |
  ColorControlHalfBackground |
  PalletControl |
  FlashingControl |
  ConcealmentMode |
  SingleConcealmentMode |
  ReplacingConcealmentMode |
  PatternPolarityControl |
  WritingModeModification |
  HilightingCharacterBlock |
  RepeatCharacter |
  StartLining |
  StopLining |
  TimeControlWait |
  TimeControlMode |
  // 制御符号 (CSI)
  SetWritingFormat |
  SetDisplayFormat |
  SetDisplayPosition |
  CharacterCompositionDotDesignation |
  SetHorizontalSpacing |
  SetVerticalSpacing |
  ActiveCoordinatePositionSet |
  OrnamentControl |
  BuiltinSoundReplay |
  RasterColourCommand;


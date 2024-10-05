export type Character = {
  tag: 'Character';
  character: string;
};
export const Character = {
  from(character: string): Character {
    return ({ tag: 'Character', character });
  }
}

export type Mosaic = {
  tag: 'Mosaic';
  // TODO: ここはなんか符号を入れるべき
};
export const Mosaic = {
  from(): Mosaic {
    return ({ tag: 'Mosaic' });
  }
}

export type Drcs = {
  tag: 'Drcs';
  drcs: Uint8Array;
};
export const Drcs = {
  from(drcs: Uint8Array): Drcs {
    return ({ tag: 'Drcs', drcs });
  }
}

export type Null = { // NUL
  tag: 'Null';
};
export const Null = {
  from(): Null {
    return ({ tag: 'Null' });
  }
}

export type Bell = { // BEL
  tag: 'Bell';
};
export const Bell = {
  from(): Bell {
    return ({ tag: 'Bell' });
  }
}

export type ActivePositionBackward = { // APB
  tag: 'ActivePositionBackward';
};
export const ActivePositionBackward = {
  from(): ActivePositionBackward {
    return ({ tag: 'ActivePositionBackward' });
  }
}

export type ActivePositionForward = { // APF
  tag: 'ActivePositionForward';
};
export const ActivePositionForward = {
  from(): ActivePositionForward {
    return ({ tag: 'ActivePositionForward' });
  }
}

export type ActivePositionDown = { // APD
  tag: 'ActivePositionDown';
};
export const ActivePositionDown = {
  from(): ActivePositionDown {
    return ({ tag: 'ActivePositionDown' });
  }
}

export type ActivePositionUp = { // APU
  tag: 'ActivePositionUp';
};
export const ActivePositionUp = {
  from(): ActivePositionUp {
    return ({ tag: 'ActivePositionUp' });
  }
}

export type ClearScreen = { // CS
  tag: 'ClearScreen';
};
export const ClearScreen = {
  from(): ClearScreen {
    return ({ tag: 'ClearScreen' });
  }
}

export type ActivePositionReturn = { // APR
  tag: 'ActivePositionReturn';
};
export const ActivePositionReturn = {
  from(): ActivePositionReturn {
    return ({ tag: 'ActivePositionReturn' });
  }
}

export type ParameterizedActivePositionForward = { // PAPF
  tag: 'ParameterizedActivePositionForward';
  x: number;
}
export const ParameterizedActivePositionForward = {
  from(x: number): ParameterizedActivePositionForward {
    return ({ tag: 'ParameterizedActivePositionForward', x });
  }
}

export type Cancel = { // CAN
  tag: 'Cancel';
};
export const Cancel = {
  from(): Cancel {
    return ({ tag: 'Cancel' });
  }
}

export type ActivePositionSet = { // APS
  tag: 'ActivePositionSet';
  x: number;
  y: number;
}
export const ActivePositionSet = {
  from(x: number, y: number): ActivePositionSet {
    return ({ tag: 'ActivePositionSet', x, y });
  }
}

export type Space = { // SP
  tag: 'Space';
}
export const Space = {
  from(): Space {
    return ({ tag: 'Space' });
  }
}

export type Delete = { // DEL
  tag: 'Delete';
};
export const Delete = {
  from(): Delete {
    return ({ tag: 'Delete' });
  }
}

export type BlackForeground = { // BKF
  tag: 'BlackForeground';
};
export const BlackForeground = {
  from(): BlackForeground {
    return ({ tag: 'BlackForeground' });
  }
}

export type RedForeground = { // RDF
  tag: 'RedForeground';
};
export const RedForeground = {
  from(): RedForeground {
    return ({ tag: 'RedForeground' });
  }
}

export type GreenForeground = { // GRF
  tag: 'GreenForeground';
};
export const GreenForeground = {
  from(): GreenForeground {
    return ({ tag: 'GreenForeground' });
  }
}

export type YellowForeground = { // YLF
  tag: 'YellowForeground';
};
export const YellowForeground = {
  from(): YellowForeground {
    return ({ tag: 'YellowForeground' });
  }
}

export type BlueForeground = { // BLF
  tag: 'BlueForeground';
};
export const BlueForeground = {
  from(): BlueForeground {
    return ({ tag: 'BlueForeground' });
  }
}

export type MagentaForeground = { // MGF
  tag: 'MagentaForeground';
};
export const MagentaForeground = {
  from(): MagentaForeground {
    return ({ tag: 'MagentaForeground' });
  }
}

export type CyanForeground = { // CNF
  tag: 'CyanForeground';
};
export const CyanForeground = {
  from(): CyanForeground {
    return ({ tag: 'CyanForeground' });
  }
}

export type WhiteForeground = { // WHF
  tag: 'WhiteForeground';
};
export const WhiteForeground = {
  from(): WhiteForeground {
    return ({ tag: 'WhiteForeground' });
  }
}

export type ColorControlForeground = {
  tag: 'ColorControlForeground';
  color: number; // 8 ~ 15
};
export const ColorControlForeground = {
  from(color: number): ColorControlForeground {
    return ({ tag: 'ColorControlForeground', color });
  }
}

export type ColorControlBackground = {
  tag: 'ColorControlBackground';
  color: number; // 0 ~ 15
};
export const ColorControlBackground = {
  from(color: number): ColorControlBackground {
    return ({ tag: 'ColorControlBackground', color });
  }
}

export type ColorControlHalfForeground = {
  tag: 'ColorControlHalfForeground';
  color: number; // 0 ~ 15
};
export const ColorControlHalfForeground = {
  from(color: number): ColorControlHalfForeground {
    return ({ tag: 'ColorControlHalfForeground', color });
  }
}

export type ColorControlHalfBackground = {
  tag: 'ColorControlHalfBackground';
  color: number; // 0 ~ 15
};
export const ColorControlHalfBackground = {
  from(color: number): ColorControlHalfBackground {
    return ({ tag: 'ColorControlHalfBackground', color });
  }
}

export type PalletControl = {
  tag: 'PalletControl';
  pallet: number;
};
export const PalletControl = {
  from(pallet: number): PalletControl {
    return ({ tag: 'PalletControl' , pallet });
  }
}

export type PatternPolarityControlNormal = {
  tag: 'PatternPolarityControlNormal';
};
export const PatternPolarityControlNormal = {
  from(): PatternPolarityControlNormal {
    return ({ tag: 'PatternPolarityControlNormal' });
  }
}

export type PatternPolarityControlInverted1 = {
  tag: 'PatternPolarityControlInverted1';
};
export const PatternPolarityControlInverted1 = {
  from(): PatternPolarityControlInverted1 {
    return ({ tag: 'PatternPolarityControlInverted1' });
  }
}

export type PatternPolarityControlInverted2 = {
  tag: 'PatternPolarityControlInverted2';
};
export const PatternPolarityControlInverted2 = {
  from(): PatternPolarityControlInverted2 {
    return ({ tag: 'PatternPolarityControlInverted2' });
  }
}

export type SmallSize = { // SSZ
  tag: 'SmallSize';
};
export const SmallSize = {
  from(): SmallSize {
    return ({ tag: 'SmallSize' });
  }
}

export type MiddleSize = { // MSZ
  tag: 'MiddleSize';
};
export const MiddleSize = {
  from(): MiddleSize {
    return ({ tag: 'MiddleSize' });
  }
}

export type NormalSize = { // NSZ
  tag: 'NormalSize';
};
export const NormalSize = {
  from(): NormalSize {
    return ({ tag: 'NormalSize' });
  }
}

export type TinySize = { // SZX
  tag: 'TinySize';
};
export const TinySize = {
  from(): TinySize {
    return ({ tag: 'TinySize' });
  }
}

export type DoubleHeightSize = { // SZX
  tag: 'DoubleHeightSize';
};
export const DoubleHeightSize = {
  from(): DoubleHeightSize {
    return ({ tag: 'DoubleHeightSize' });
  }
}

export type DoubleWidthSize = { // SZX
  tag: 'DoubleWidthSize';
};
export const DoubleWidthSize = {
  from(): DoubleWidthSize {
    return ({ tag: 'DoubleWidthSize' });
  }
}

export type DoubleHeightAndWidthSize = { // SZX
  tag: 'DoubleHeightAndWidthSize';
};
export const DoubleHeightAndWidthSize = {
  from(): DoubleHeightAndWidthSize {
    return ({ tag: 'DoubleHeightAndWidthSize' });
  }
}

export type Special1Size = { // SZX
  tag: 'Special1Size';
};
export const Special1Size = {
  from(): Special1Size {
    return ({ tag: 'Special1Size' });
  }
}

export type Special2Size = { // SZX
  tag: 'Special2Size';
};
export const Special2Size = {
  from(): Special2Size {
    return ({ tag: 'Special2Size' });
  }
}

export type FlashingControlNormal = { // FLC
  tag: 'FlashingControlNormal';
}
export const FlashingControlNormal = {
  from(): FlashingControlNormal {
    return ({ tag: 'FlashingControlNormal' });
  }
}

export type FlashingControlInverted = { // FLC
  tag: 'FlashingControlInverted';
}
export const FlashingControlInverted = {
  from(): FlashingControlInverted {
    return ({ tag: 'FlashingControlInverted' });
  }
}

export type FlashingControlStop = { // FLC
  tag: 'FlashingControlStop';
}
export const FlashingControlStop = {
  from(): FlashingControlStop {
    return ({ tag: 'FlashingControlStop' });
  }
}

export type AribToken =
  // 文字
  Character |
  Mosaic |
  Drcs |
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
  ColorControlForeground |
  ColorControlBackground |
  ColorControlHalfForeground |
  ColorControlHalfBackground |
  PalletControl |
  PatternPolarityControlNormal |
  PatternPolarityControlInverted1 |
  PatternPolarityControlInverted2 |
  SmallSize |
  MiddleSize |
  NormalSize |
  TinySize |
  DoubleHeightSize |
  DoubleWidthSize |
  DoubleHeightAndWidthSize |
  Special1Size |
  Special2Size |
  FlashingControlNormal |
  FlashingControlInverted |
  FlashingControlStop;

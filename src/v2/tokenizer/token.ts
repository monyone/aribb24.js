export type Character = {
  tag: 'Character';
  character: string;
};
export const Character = {
  new(character: string): Character {
    return ({ tag: 'Character', character });
  }
}

export type Mosaic = {
  tag: 'Mosaic';
  // TODO: ここはなんか符号を入れるべき
};
export const Mosaic = {
  new(): Mosaic {
    return ({ tag: 'Mosaic' });
  }
}

export type Drcs = {
  tag: 'Drcs';
  drcs: Uint8Array;
};
export const Drcs = {
  new(drcs: Uint8Array): Drcs {
    return ({ tag: 'Drcs', drcs });
  }
}

export type Null = { // NUL
  tag: 'Null';
};
export const Null = {
  new(): Null {
    return ({ tag: 'Null' });
  }
}

export type Bell = { // BEL
  tag: 'Bell';
};
export const Bell = {
  new(): Bell {
    return ({ tag: 'Bell' });
  }
}

export type ActivePositionBackward = { // APB
  tag: 'ActivePositionBackward';
};
export const ActivePositionBackward = {
  new(): ActivePositionBackward {
    return ({ tag: 'ActivePositionBackward' });
  }
}

export type ActivePositionForward = { // APF
  tag: 'ActivePositionForward';
};
export const ActivePositionForward = {
  new(): ActivePositionForward {
    return ({ tag: 'ActivePositionForward' });
  }
}

export type ActivePositionDown = { // APD
  tag: 'ActivePositionDown';
};
export const ActivePositionDown = {
  new(): ActivePositionDown {
    return ({ tag: 'ActivePositionDown' });
  }
}

export type ActivePositionUp = { // APU
  tag: 'ActivePositionUp';
};
export const ActivePositionUp = {
  new(): ActivePositionUp {
    return ({ tag: 'ActivePositionUp' });
  }
}

export type ClearScreen = { // CS
  tag: 'ClearScreen';
};
export const ClearScreen = {
  new(): ClearScreen {
    return ({ tag: 'ClearScreen' });
  }
}

export type ActivePositionReturn = { // APR
  tag: 'ActivePositionReturn';
};
export const ActivePositionReturn = {
  new(): ActivePositionReturn {
    return ({ tag: 'ActivePositionReturn' });
  }
}

export type ParameterizedActivePositionForward = { // PAPF
  tag: 'ParameterizedActivePositionForward';
  x: number;
}
export const ParameterizedActivePositionForward = {
  new(x: number): ParameterizedActivePositionForward {
    return ({ tag: 'ParameterizedActivePositionForward', x });
  }
}

export type Cancel = { // CAN
  tag: 'Cancel';
};
export const Cancel = {
  new(): Cancel {
    return ({ tag: 'Cancel' });
  }
}

export type ActivePositionSet = { // APS
  tag: 'ActivePositionSet';
  x: number;
  y: number;
}
export const ActivePositionSet = {
  new(x: number, y: number): ActivePositionSet {
    return ({ tag: 'ActivePositionSet', x, y });
  }
}

export type Space = { // SP
  tag: 'Space';
}
export const Space = {
  new(): Space {
    return ({ tag: 'Space' });
  }
}

export type Delete = { // DEL
  tag: 'Delete';
};
export const Delete = {
  new(): Delete {
    return ({ tag: 'Delete' });
  }
}

export type BlackForeground = { // BKF
  tag: 'BlackForeground';
};
export const BlackForeground = {
  new(): BlackForeground {
    return ({ tag: 'BlackForeground' });
  }
}

export type RedForeground = { // RDF
  tag: 'RedForeground';
};
export const RedForeground = {
  new(): RedForeground {
    return ({ tag: 'RedForeground' });
  }
}

export type GreenForeground = { // GRF
  tag: 'GreenForeground';
};
export const GreenForeground = {
  new(): GreenForeground {
    return ({ tag: 'GreenForeground' });
  }
}

export type YellowForeground = { // YLF
  tag: 'YellowForeground';
};
export const YellowForeground = {
  new(): YellowForeground {
    return ({ tag: 'YellowForeground' });
  }
}

export type BlueForeground = { // BLF
  tag: 'BlueForeground';
};
export const BlueForeground = {
  new(): BlueForeground {
    return ({ tag: 'BlueForeground' });
  }
}

export type MagentaForeground = { // MGF
  tag: 'MagentaForeground';
};
export const MagentaForeground = {
  new(): MagentaForeground {
    return ({ tag: 'MagentaForeground' });
  }
}

export type CyanForeground = { // CNF
  tag: 'CyanForeground';
};
export const CyanForeground = {
  new(): CyanForeground {
    return ({ tag: 'CyanForeground' });
  }
}

export type WhiteForeground = { // WHF
  tag: 'WhiteForeground';
};
export const WhiteForeground = {
  new(): WhiteForeground {
    return ({ tag: 'WhiteForeground' });
  }
}

export type ColorControlForeground = {
  tag: 'ColorControlForeground';
  color: number; // 8 ~ 15
};
export const ColorControlForeground = {
  new(color: number): ColorControlForeground {
    return ({ tag: 'ColorControlForeground', color });
  }
}

export type ColorControlBackground = {
  tag: 'ColorControlBackground';
  color: number; // 0 ~ 15
};
export const ColorControlBackground = {
  new(color: number): ColorControlBackground {
    return ({ tag: 'ColorControlBackground', color });
  }
}

export type ColorControlHalfForeground = {
  tag: 'ColorControlHalfForeground';
  color: number; // 0 ~ 15
};
export const ColorControlHalfForeground = {
  new(color: number): ColorControlHalfForeground {
    return ({ tag: 'ColorControlHalfForeground', color });
  }
}

export type ColorControlHalfBackground = {
  tag: 'ColorControlHalfBackground';
  color: number; // 0 ~ 15
};
export const ColorControlHalfBackground = {
  new(color: number): ColorControlHalfBackground {
    return ({ tag: 'ColorControlHalfBackground', color });
  }
}

export type PalletControl = {
  tag: 'PalletControl';
  pallet: number;
};
export const PalletControl = {
  new(pallet: number): PalletControl {
    return ({ tag: 'PalletControl' , pallet });
  }
}

export type PatternPolarityControlNormal = {
  tag: 'PatternPolarityControlNormal';
};
export const PatternPolarityControlNormal = {
  new(): PatternPolarityControlNormal {
    return ({ tag: 'PatternPolarityControlNormal' });
  }
}

export type PatternPolarityControlInverted1 = {
  tag: 'PatternPolarityControlInverted1';
};
export const PatternPolarityControlInverted1 = {
  new(): PatternPolarityControlInverted1 {
    return ({ tag: 'PatternPolarityControlInverted1' });
  }
}

export type PatternPolarityControlInverted2 = {
  tag: 'PatternPolarityControlInverted2';
};
export const PatternPolarityControlInverted2 = {
  new(): PatternPolarityControlInverted2 {
    return ({ tag: 'PatternPolarityControlInverted2' });
  }
}

export type SmallSize = { // SSZ
  tag: 'SmallSize';
};
export const SmallSize = {
  new(): SmallSize {
    return ({ tag: 'SmallSize' });
  }
}

export type MiddleSize = { // MSZ
  tag: 'MiddleSize';
};
export const MiddleSize = {
  new(): MiddleSize {
    return ({ tag: 'MiddleSize' });
  }
}

export type NormalSize = { // NSZ
  tag: 'NormalSize';
};
export const NormalSize = {
  new(): NormalSize {
    return ({ tag: 'NormalSize' });
  }
}

export type TinySize = { // SZX
  tag: 'TinySize';
};
export const TinySize = {
  new(): TinySize {
    return ({ tag: 'TinySize' });
  }
}

export type DoubleHeightSize = { // SZX
  tag: 'DoubleHeightSize';
};
export const DoubleHeightSize = {
  new(): DoubleHeightSize {
    return ({ tag: 'DoubleHeightSize' });
  }
}

export type DoubleWidthSize = { // SZX
  tag: 'DoubleWidthSize';
};
export const DoubleWidthSize = {
  new(): DoubleWidthSize {
    return ({ tag: 'DoubleWidthSize' });
  }
}

export type DoubleHeightAndWidthSize = { // SZX
  tag: 'DoubleHeightAndWidthSize';
};
export const DoubleHeightAndWidthSize = {
  new(): DoubleHeightAndWidthSize {
    return ({ tag: 'DoubleHeightAndWidthSize' });
  }
}

export type Special1Size = { // SZX
  tag: 'Special1Size';
};
export const Special1Size = {
  new(): Special1Size {
    return ({ tag: 'Special1Size' });
  }
}

export type Special2Size = { // SZX
  tag: 'Special2Size';
};
export const Special2Size = {
  new(): Special2Size {
    return ({ tag: 'Special2Size' });
  }
}

export type FlashingControlNormal = { // FLC
  tag: 'FlashingControlNormal';
}
export type FlashingControlInverted = { // FLC
  tag: 'FlashingControlInverted';
}
export type FlashingControlStop = { // FLC
  tag: 'FlashingControlStop';
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

export type ARIBB24CharacterToken = {
  tag: 'Character';
  character: string;
  non_spacing: boolean;
};
export const ARIBB24CharacterToken = {
  from(character: string, non_spacing: boolean = false): ARIBB24CharacterToken {
    return { tag: 'Character', character, non_spacing };
  }
};

export type ARIBB24MosaicToken = {
  tag: 'Mosaic';
  // TODO: ここはなんか符号を入れるべき
};
export const ARIBB24MosaicToken = {
  from(): ARIBB24MosaicToken {
    return { tag: 'Mosaic' };
  }
};

export type ARIBB24DRCSToken = {
  tag: 'DRCS';
  width: number;
  height: number;
  depth: number;
  binary: ArrayBuffer;
  combining: string;
};
export const ARIBB24DRCSToken = {
  from(width: number, height: number, depth: number, binary: ArrayBuffer, combining: string = ''): ARIBB24DRCSToken {
    return { tag: 'DRCS', width, height, depth, binary, combining };
  }
};

export type ARIBB24BitmapToken = {
  tag: 'Bitmap';
  x_position: number;
  y_position: number;
  flc_colors: number[];
  binary: ArrayBuffer;
};
export const ARIBB24BitmapToken = {
  from(x_position: number, y_position: number, flc_colors: number[], binary: ArrayBuffer): ARIBB24BitmapToken {
    return { tag: 'Bitmap', x_position, y_position, flc_colors, binary };
  }
};

export type ARIBB24NullToken = { // NUL
  tag: 'Null';
};
export const ARIBB24NullToken = {
  from(): ARIBB24NullToken {
    return { tag: 'Null' };
  }
};

export type ARIBB24BellToken = { // BEL
  tag: 'Bell';
};
export const ARIBB24BellToken = {
  from(): ARIBB24BellToken {
    return { tag: 'Bell' };
  }
};

export type ARIBB24ActivePositionBackwardToken = { // APB
  tag: 'ActivePositionBackward';
};
export const ARIBB24ActivePositionBackwardToken = {
  from(): ARIBB24ActivePositionBackwardToken {
    return { tag: 'ActivePositionBackward' };
  }
};

export type ARIBB24ActivePositionForwardToken = { // APF
  tag: 'ActivePositionForward';
};
export const ARIBB24ActivePositionForwardToken = {
  from(): ARIBB24ActivePositionForwardToken {
    return { tag: 'ActivePositionForward' };
  }
};

export type ARIBB24ActivePositionDownToken = { // APD
  tag: 'ActivePositionDown';
};
export const ARIBB24ActivePositionDownToken = {
  from(): ARIBB24ActivePositionDownToken {
    return { tag: 'ActivePositionDown' };
  }
};

export type ARIBB24ActivePositionUpToken = { // APU
  tag: 'ActivePositionUp';
};
export const ARIBB24ActivePositionUpToken = {
  from(): ARIBB24ActivePositionUpToken {
    return { tag: 'ActivePositionUp' };
  }
};

export type ARIBB24ClearScreenToken = { // CS
  tag: 'ClearScreen';
};
export const ARIBB24ClearScreenToken = {
  from(): ARIBB24ClearScreenToken {
    return { tag: 'ClearScreen' };
  }
};

export type ARIBB24ActivePositionReturnToken = { // APR
  tag: 'ActivePositionReturn';
};
export const ARIBB24ActivePositionReturnToken = {
  from(): ARIBB24ActivePositionReturnToken {
    return { tag: 'ActivePositionReturn' };
  }
};

export type ARIBB24ParameterizedActivePositionForwardToken = { // PAPF
  tag: 'ParameterizedActivePositionForward';
  x: number;
};
export const ARIBB24ParameterizedActivePositionForwardToken = {
  from(x: number): ARIBB24ParameterizedActivePositionForwardToken {
    return { tag: 'ParameterizedActivePositionForward', x };
  }
};

export type ARIBB24CancelToken = { // CAN
  tag: 'Cancel';
};
export const ARIBB24CancelToken = {
  from(): ARIBB24CancelToken {
    return { tag: 'Cancel' };
  }
};

export type ARIBB24ActivePositionSetToken = { // APS
  tag: 'ActivePositionSet';
  x: number;
  y: number;
}
export const ARIBB24ActivePositionSetToken = {
  from(x: number, y: number): ARIBB24ActivePositionSetToken {
    return { tag: 'ActivePositionSet', x, y };
  }
};

export type ARIBB24RecordSeparatorToken = {
  tag: 'RecordSeparator';
};
export const ARIBB24RecordSeparatorToken = {
  from(): ARIBB24RecordSeparatorToken {
    return { tag: 'RecordSeparator' };
  }
};

export type ARIBB24UnitSeparatorToken = {
  tag: 'UnitSeparator';
};
export const ARIBB24UnitSeparatorToken = {
  from(): ARIBB24UnitSeparatorToken {
    return { tag: 'UnitSeparator' };
  }
};

export type ARIBB24SpaceToken = { // SP
  tag: 'Space';
}
export const ARIBB24SpaceToken = {
  from(): ARIBB24SpaceToken {
    return { tag: 'Space' };
  }
};

export type ARIBB24DeleteToken = { // DEL
  tag: 'Delete';
};
export const ARIBB24DeleteToken = {
  from(): ARIBB24DeleteToken {
    return { tag: 'Delete' };
  }
};

export type ARIBB24BlackForegroundToken = { // BKF
  tag: 'BlackForeground';
};
export const ARIBB24BlackForegroundToken = {
  from(): ARIBB24BlackForegroundToken {
    return { tag: 'BlackForeground' };
  }
};

export type ARIBB24RedForegroundToken = { // RDF
  tag: 'RedForeground';
};
export const ARIBB24RedForegroundToken = {
  from(): ARIBB24RedForegroundToken {
    return { tag: 'RedForeground' };
  }
};

export type ARIBB24GreenForegroundToken = { // GRF
  tag: 'GreenForeground';
};
export const ARIBB24GreenForegroundToken = {
  from(): ARIBB24GreenForegroundToken {
    return { tag: 'GreenForeground' };
  }
};

export type ARIBB24YellowForegroundToken = { // YLF
  tag: 'YellowForeground';
};
export const ARIBB24YellowForegroundToken = {
  from(): ARIBB24YellowForegroundToken {
    return { tag: 'YellowForeground' };
  }
};

export type ARIBB24BlueForegroundToken = { // BLF
  tag: 'BlueForeground';
};
export const ARIBB24BlueForegroundToken = {
  from(): ARIBB24BlueForegroundToken {
    return { tag: 'BlueForeground' };
  }
};

export type ARIBB24MagentaForegroundToken = { // MGF
  tag: 'MagentaForeground';
};
export const ARIBB24MagentaForegroundToken = {
  from(): ARIBB24MagentaForegroundToken {
    return { tag: 'MagentaForeground' };
  }
};

export type ARIBB24CyanForegroundToken = { // CNF
  tag: 'CyanForeground';
};
export const ARIBB24CyanForegroundToken = {
  from(): ARIBB24CyanForegroundToken {
    return { tag: 'CyanForeground' };
  }
};

export type ARIBB24WhiteForegroundToken = { // WHF
  tag: 'WhiteForeground';
};
export const ARIBB24WhiteForegroundToken = {
  from(): ARIBB24WhiteForegroundToken {
    return { tag: 'WhiteForeground' };
  }
};

export type ARIBB24SmallSizeToken = { // SSZ
  tag: 'SmallSize';
};
export const ARIBB24SmallSizeToken = {
  from(): ARIBB24SmallSizeToken {
    return { tag: 'SmallSize' };
  }
};

export type ARIBB24MiddleSizeToken = { // MSZ
  tag: 'MiddleSize';
};
export const ARIBB24MiddleSizeToken = {
  from(): ARIBB24MiddleSizeToken {
    return { tag: 'MiddleSize' };
  }
};

export type ARIBB24NormalSizeToken = { // NSZ
  tag: 'NormalSize';
};
export const ARIBB24NormalSizeToken = {
  from(): ARIBB24NormalSizeToken {
    return { tag: 'NormalSize' };
  }
};

export const ARIBB24CharacterSizeControlType = {
  TINY: 0x60,
  DOUBLE_HEIGHT: 0x41,
  DOUBLE_WIDTH: 0x44,
  DOUBLE_HEIGHT_AND_WIDTH: 0x45,
  SPECIAL_1: 0x6b,
  SPECIAL_2: 0x64,
} as const;
export type ARIBB24CharacterSizeControlToken = {
  tag: 'CharacterSizeControl';
  type: (typeof ARIBB24CharacterSizeControlType)[keyof typeof ARIBB24CharacterSizeControlType];
};
export const ARIBB24CharacterSizeControlToken = {
  from(type: (typeof ARIBB24CharacterSizeControlType)[keyof typeof ARIBB24CharacterSizeControlType]): ARIBB24CharacterSizeControlToken {
    return { tag: 'CharacterSizeControl', type };
  }
};

export type ARIBB24ColorControlForegroundToken = {
  tag: 'ColorControlForeground';
  color: number; // 8 ~ 15
};
export const ARIBB24ColorControlForegroundToken = {
  from(color: number): ARIBB24ColorControlForegroundToken {
    return { tag: 'ColorControlForeground', color };
  }
};

export type ARIBB24ColorControlBackgroundToken = {
  tag: 'ColorControlBackground';
  color: number; // 0 ~ 15
};
export const ARIBB24ColorControlBackgroundToken = {
  from(color: number): ARIBB24ColorControlBackgroundToken {
    return { tag: 'ColorControlBackground', color };
  }
};

export type ARIBB24ColorControlHalfForegroundToken = {
  tag: 'ColorControlHalfForeground';
  color: number; // 0 ~ 15
};
export const ARIBB24ColorControlHalfForegroundToken = {
  from(color: number): ARIBB24ColorControlHalfForegroundToken {
    return { tag: 'ColorControlHalfForeground', color };
  }
};

export type ARIBB24ColorControlHalfBackgroundToken = {
  tag: 'ColorControlHalfBackground';
  color: number; // 0 ~ 15
};
export const ARIBB24ColorControlHalfBackgroundToken = {
  from(color: number): ARIBB24ColorControlHalfBackgroundToken {
    return { tag: 'ColorControlHalfBackground', color };
  }
};

export type ARIBB24PalletControlToken = {
  tag: 'PalletControl';
  pallet: number;
};
export const ARIBB24PalletControlToken = {
  from(pallet: number): ARIBB24PalletControlToken {
    return { tag: 'PalletControl', pallet };
  }
};

export const ARIBB24FlashingControlType = {
  NORMAL: 0x40,
  INVERTED: 0x47,
  STOP: 0x4F,
} as const;
export type ARIBB24FlashingControlToken = {
  tag: 'FlashingControl';
  type: (typeof ARIBB24FlashingControlType)[keyof typeof ARIBB24FlashingControlType];
}
export const ARIBB24FlashingControlToken = {
  from(type: (typeof ARIBB24FlashingControlType)[keyof typeof ARIBB24FlashingControlType]): ARIBB24FlashingControlToken {
    return { tag: 'FlashingControl', type };
  }
};


export const ARIBB24ConcealmentModeType = {
  STOP: 0x4F,
} as const;
export type ARIBB24ConcealmentModeToken = {
  tag: 'ConcealmentMode';
  type: (typeof ARIBB24ConcealmentModeType)[keyof typeof ARIBB24ConcealmentModeType];
};
export const ARIBB24ConcealmentModeToken = {
  from(type: (typeof ARIBB24ConcealmentModeType)[keyof typeof ARIBB24ConcealmentModeType]): ARIBB24ConcealmentModeToken {
    return { tag: 'ConcealmentMode', type };
  }
};

export const ARIBB24SingleConcealmentModeType = {
  START: 0x40,
} as const;
export type ARIBB24SingleConcealmentModeToken = {
  tag: 'SingleConcealmentMode';
  type: (typeof ARIBB24SingleConcealmentModeType)[keyof typeof ARIBB24SingleConcealmentModeType];
};
export const ARIBB24SingleConcealmentModeToken = {
  from(type: (typeof ARIBB24SingleConcealmentModeType)[keyof typeof ARIBB24SingleConcealmentModeType]): ARIBB24SingleConcealmentModeToken {
    return { tag: 'SingleConcealmentMode', type };
  }
};

export const ARIBB24ReplacingConcealmentModeType = {
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
export type ARIBB24ReplacingConcealmentModeToken = {
  tag: 'ReplacingConcealmentMode';
  type: (typeof ARIBB24ReplacingConcealmentModeType)[keyof typeof ARIBB24ReplacingConcealmentModeType];
};
export const ARIBB24ReplacingConcealmentModeToken = {
  from(type: (typeof ARIBB24ReplacingConcealmentModeType)[keyof typeof ARIBB24ReplacingConcealmentModeType]): ARIBB24ReplacingConcealmentModeToken {
    return { tag: 'ReplacingConcealmentMode', type };
  }
};

export const ARIBB24PatternPolarityControlType = {
  NORMAL: 0x40,
  INVERTED_1: 0x41,
  INVERTED_2: 0x42,
} as const;
export type ARIBB24PatternPolarityControlToken = {
  tag: 'PatternPolarityControl';
  type: (typeof ARIBB24PatternPolarityControlType)[keyof typeof ARIBB24PatternPolarityControlType]
};
export const ARIBB24PatternPolarityControlToken = {
  from(type: (typeof ARIBB24PatternPolarityControlType)[keyof typeof ARIBB24PatternPolarityControlType]): ARIBB24PatternPolarityControlToken {
    return { tag: 'PatternPolarityControl', type};
  }
};

export const ARIBB24WritingModeModificationType = {
  BOTH: 0x40,
  FOREGROUND: 0x44,
  BACKGROUND: 0x45
} as const;
export type ARIBB24WritingModeModificationToken = {
  tag: 'WritingModeModification';
  type: (typeof ARIBB24WritingModeModificationType)[keyof typeof ARIBB24WritingModeModificationType];
};
export const ARIBB24WritingModeModificationToken = {
  from(type: (typeof ARIBB24WritingModeModificationType)[keyof typeof ARIBB24WritingModeModificationType]): ARIBB24WritingModeModificationToken {
    return { tag: 'WritingModeModification', type };
  }
};

// TODO: MACRO

export type ARIBB24HilightingCharacterBlockToken = {
  tag: 'HilightingCharacterBlock';
  enclosure: number;
};
export const ARIBB24HilightingCharacterBlockToken = {
  from(enclosure: number): ARIBB24HilightingCharacterBlockToken {
    return { tag: 'HilightingCharacterBlock', enclosure };
  }
};

export type ARIBB24RepeatCharacterToken = {
  tag: 'RepeatCharacter';
  repeat: number;
};
export const ARIBB24RepeatCharacterToken = {
  from(repeat: number): ARIBB24RepeatCharacterToken {
    return { tag: 'RepeatCharacter', repeat };
  }
};

export type ARIBB24StartLiningToken = {
  tag: 'StartLining';
}
export const ARIBB24StartLiningToken = {
  from(): ARIBB24StartLiningToken {
    return { tag: 'StartLining' };
  }
};

export type ARIBB24StopLiningToken = {
  tag: 'StopLining';
}
export const ARIBB24StopLiningToken = {
  from(): ARIBB24StopLiningToken {
    return { tag: 'StopLining' };
  }
};

export type ARIBB24TimeControlWaitToken = {
  tag: 'TimeControlWait';
  seconds: number;
};
export const ARIBB24TimeControlWaitToken = {
  from(seconds: number): ARIBB24TimeControlWaitToken {
    return { tag: 'TimeControlWait', seconds };
  }
};

export const ARIBB24TimeControlModeType = {
  FREE: 0x40,
  REAL: 0x41,
  OFFSET: 0x42,
  UNIQUE: 0x43,
} as const;
export type ARIBB24TimeControlModeToken = {
  tag: 'TimeControlMode';
  type: (typeof ARIBB24TimeControlModeType)[keyof typeof ARIBB24TimeControlModeType];
}
export const ARIBB24TimeControlModeToken = {
  from(type: (typeof ARIBB24TimeControlModeType)[keyof typeof ARIBB24TimeControlModeType]): ARIBB24TimeControlModeToken {
    return { tag: 'TimeControlMode', type };
  }
};

export type ARIBB24SetWritingFormatToken = {
  tag: 'SetWritingFormat';
  format: number;
};
export const ARIBB24SetWritingFormatToken = {
  from(format: number): ARIBB24SetWritingFormatToken {
    return { tag: 'SetWritingFormat', format };
  }
};

export type ARIBB24SetDisplayFormatToken = {
  tag: 'SetDisplayFormat';
  horizontal: number;
  vertical: number;
};
export const ARIBB24SetDisplayFormatToken = {
  from(horizontal: number, vertical: number): ARIBB24SetDisplayFormatToken {
    return { tag: 'SetDisplayFormat', horizontal, vertical };
  }
};

export type ARIBB24SetDisplayPositionToken = {
  tag: 'SetDisplayPosition';
  horizontal: number;
  vertical: number;
};
export const ARIBB24SetDisplayPositionToken = {
  from(horizontal: number, vertical: number): ARIBB24SetDisplayPositionToken {
    return { tag: 'SetDisplayPosition', horizontal, vertical };
  }
};

export type ARIBB24CharacterCompositionDotDesignationToken = {
  tag: 'CharacterCompositionDotDesignation';
  horizontal: number;
  vertical: number;
};
export const ARIBB24CharacterCompositionDotDesignationToken = {
  from(horizontal: number, vertical: number): ARIBB24CharacterCompositionDotDesignationToken {
    return { tag: 'CharacterCompositionDotDesignation', horizontal, vertical };
  }
};

export type ARIBB24SetHorizontalSpacingToken = {
  tag: 'SetHorizontalSpacing';
  spacing: number;
};
export const ARIBB24SetHorizontalSpacingToken = {
  from(spacing: number): ARIBB24SetHorizontalSpacingToken {
    return { tag: 'SetHorizontalSpacing', spacing };
  }
};

export type ARIBB24SetVerticalSpacingToken = {
  tag: 'SetVerticalSpacing';
  spacing: number;
};
export const ARIBB24SetVerticalSpacingToken = {
  from(spacing: number): ARIBB24SetVerticalSpacingToken {
    return { tag: 'SetVerticalSpacing', spacing };
  }
};

export type ARIBB24ActiveCoordinatePositionSetToken = {
  tag: 'ActiveCoordinatePositionSet';
  x: number;
  y: number;
};
export const ARIBB24ActiveCoordinatePositionSetToken = {
  from(x: number, y: number): ARIBB24ActiveCoordinatePositionSetToken {
    return { tag: 'ActiveCoordinatePositionSet', x, y };
  }
};

export const ARIBB24OrnamentControlType = {
  NONE: 0x00,
  HEMMING: 0x01,
  SHADE: 0x02,
  HOLLOW: 0x03,
} as const;

export type ARIBB24OrnamentControlNoneToken = {
  tag: 'OrnamentControlNone';
};
export const ARIBB24OrnamentControlNoneToken = {
  from(): ARIBB24OrnamentControlNoneToken {
    return { tag: 'OrnamentControlNone' };
  }
};

export type ARIBB24OrnamentControlHemmingToken = {
  tag: 'OrnamentControlHemming';
  color: number;
};
export const ARIBB24OrnamentControlHemmingToken = {
  from(color: number): ARIBB24OrnamentControlHemmingToken {
    return { tag: 'OrnamentControlHemming', color};
  }
};

export type ARIBB24OrnamentControlShadeToken = {
  tag: 'OrnamentControlShade';
  color: number;
};
export const ARIBB24OrnamentControlShadeToken = {
  from(color: number): ARIBB24OrnamentControlShadeToken {
    return { tag: 'OrnamentControlShade', color};
  }
};

export type ARIBB24OrnamentControlHollowToken = {
  tag: 'OrnamentControlHollow';
};
export const ARIBB24OrnamentControlHollowToken = {
  from(): ARIBB24OrnamentControlHollowToken {
    return { tag: 'OrnamentControlHollow'};
  }
};

export type ARIBB24BuiltinSoundReplayToken = {
  tag: 'BuiltinSoundReplay';
  sound: number;
};
export const ARIBB24BuiltinSoundReplayToken = {
  from(sound: number): ARIBB24BuiltinSoundReplayToken {
    return { tag: 'BuiltinSoundReplay', sound };
  }
};

export type ARIBB24RasterColourCommandToken = {
  tag: 'RasterColourCommand';
  color: number;
};
export const ARIBB24RasterColourCommandToken = {
  from(color: number): ARIBB24RasterColourCommandToken {
    return { tag: 'RasterColourCommand', color };
  }
};

export type ARIBB24Token =
  // ビットマップ
  ARIBB24BitmapToken |
  // 文字
  ARIBB24CharacterToken |
  ARIBB24MosaicToken |
  ARIBB24DRCSToken |
  // 制御符号 (C0)
  ARIBB24NullToken |
  ARIBB24BellToken |
  ARIBB24ActivePositionBackwardToken |
  ARIBB24ActivePositionForwardToken |
  ARIBB24ActivePositionDownToken |
  ARIBB24ActivePositionUpToken |
  ARIBB24ClearScreenToken |
  ARIBB24ActivePositionReturnToken |
  ARIBB24ParameterizedActivePositionForwardToken |
  ARIBB24CancelToken |
  ARIBB24ActivePositionSetToken |
  ARIBB24RecordSeparatorToken |
  ARIBB24UnitSeparatorToken |
  ARIBB24SpaceToken |
  // 制御符号 (C1)
  ARIBB24DeleteToken |
  ARIBB24BlackForegroundToken |
  ARIBB24RedForegroundToken |
  ARIBB24GreenForegroundToken |
  ARIBB24YellowForegroundToken |
  ARIBB24BlueForegroundToken |
  ARIBB24MagentaForegroundToken |
  ARIBB24CyanForegroundToken |
  ARIBB24WhiteForegroundToken |
  ARIBB24SmallSizeToken |
  ARIBB24MiddleSizeToken |
  ARIBB24NormalSizeToken |
  ARIBB24CharacterSizeControlToken |
  ARIBB24ColorControlForegroundToken |
  ARIBB24ColorControlBackgroundToken |
  ARIBB24ColorControlHalfForegroundToken |
  ARIBB24ColorControlHalfBackgroundToken |
  ARIBB24PalletControlToken |
  ARIBB24FlashingControlToken |
  ARIBB24ConcealmentModeToken |
  ARIBB24SingleConcealmentModeToken |
  ARIBB24ReplacingConcealmentModeToken |
  ARIBB24PatternPolarityControlToken |
  ARIBB24WritingModeModificationToken |
  ARIBB24HilightingCharacterBlockToken |
  ARIBB24RepeatCharacterToken |
  ARIBB24StartLiningToken |
  ARIBB24StopLiningToken |
  ARIBB24TimeControlWaitToken |
  ARIBB24TimeControlModeToken |
  // 制御符号 (CSI)
  ARIBB24SetWritingFormatToken |
  ARIBB24SetDisplayFormatToken |
  ARIBB24SetDisplayPositionToken |
  ARIBB24CharacterCompositionDotDesignationToken |
  ARIBB24SetHorizontalSpacingToken |
  ARIBB24SetVerticalSpacingToken |
  ARIBB24ActiveCoordinatePositionSetToken |
  ARIBB24OrnamentControlNoneToken |
  ARIBB24OrnamentControlHemmingToken |
  ARIBB24OrnamentControlShadeToken |
  ARIBB24OrnamentControlHollowToken |
  ARIBB24BuiltinSoundReplayToken |
  ARIBB24RasterColourCommandToken;


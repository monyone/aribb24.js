import { ARIBB24Token, ARIBB24CharacterToken, ARIBB24CharacterSizeControlType, ARIBB24ClearScreenToken, ARIBB24DRCSToken, ARIBB24FlashingControlType, ARIBB24OrnamentControlType } from "../tokenizer/token";
import { ExhaustivenessError } from "../../util/error";

export const ARIBB24_CHARACTER_SIZE = {
  Small: 'Small',
  Middle: 'Middle',
  Normal: 'Normal',
  Tiny: 'Tiny',
  DoubleHeight: 'DoubleHeight',
  DoubleWidth: 'DoubleWidth',
  DoubleHeightAndWidth: 'DoubleHeightAndWidth',
  Special1: 'Special1',
  Special2: 'Special2',
} as const;

export const ARIBB24_CHARACTER_SIZE_MAP = new Map<(typeof ARIBB24_CHARACTER_SIZE)[keyof typeof ARIBB24_CHARACTER_SIZE], [number, number]>([
  [ARIBB24_CHARACTER_SIZE.Small, [0.5, 0.5]],
  [ARIBB24_CHARACTER_SIZE.Middle, [0.5, 1]],
  [ARIBB24_CHARACTER_SIZE.Normal, [1, 1]],
  [ARIBB24_CHARACTER_SIZE.Tiny, [1/4, 1/6]],
  [ARIBB24_CHARACTER_SIZE.DoubleHeight, [1, 2]],
  [ARIBB24_CHARACTER_SIZE.DoubleWidth, [2, 1]],
  [ARIBB24_CHARACTER_SIZE.DoubleHeightAndWidth, [2, 2]],
  [ARIBB24_CHARACTER_SIZE.Special1, [Number.NaN, Number.NaN]], // TODO
  [ARIBB24_CHARACTER_SIZE.Special2, [Number.NaN, Number.NaN]], // TODO
]);

export type ARIBB24ParserState = {
  // spacing
  plane: [number, number];
  area: [number, number];
  margin: [number, number];
  fontsize: [number, number]
  hspace: number;
  vspace: number;
  // render
  position: [number, number],
  size: (typeof ARIBB24_CHARACTER_SIZE)[keyof typeof ARIBB24_CHARACTER_SIZE];
  // color
  pallet: number;
  foreground: number;
  background: number;
  halfforeground: number;
  halfbackground: number;
  // decoration
  underline: boolean;
  highlight: number;
  ornament: number | null;
  flashing: (typeof ARIBB24FlashingControlType)[keyof typeof ARIBB24FlashingControlType];
  // time
  elapsed_time: number;
};

export type ARIBB24ParserOption = {
  magnification: number;
}
export const ARIBB24ParserOption = {
  from(option?: Partial<ARIBB24ParserOption>): ARIBB24ParserOption {
    return {
      magnification: 2,
      ... option
    };
  }
}

export const initialState: Readonly<ARIBB24ParserState> = {
  // display
  plane: [960, 540],
  area: [960, 540],
  margin: [0, 0],
  fontsize: [36, 36],
  hspace: 4,
  vspace: 24,
  // pos
  position: [0, 59],
  // size
  size: ARIBB24_CHARACTER_SIZE.Normal,
  // color
  pallet: 0,
  foreground: 7,
  halfforeground: 0,
  halfbackground: 0,
  background: 8,
  // decoration
  underline: false,
  highlight: 0,
  ornament: null,
  flashing: ARIBB24FlashingControlType.STOP,
  // time
  elapsed_time: 0,
} as const;

export type ARIBB24CommonParsedToken = {
  state: ARIBB24ParserState;
  option: ARIBB24ParserOption;
}

export type ARIBB24ClearScreenParsedToken = ARIBB24CommonParsedToken & {
  tag: 'ClearScreen';
  time: number;
};
export const ARIBB24ClearScreenParsedToken = {
  from(time: number, state: ARIBB24ParserState, option: ARIBB24ParserOption): ARIBB24ClearScreenParsedToken {
    return {
      tag: 'ClearScreen',
      state: structuredClone(state),
      option: structuredClone(option),
      time
    };
  }
}
export type ARIBB24CharacterParsedToken = ARIBB24CommonParsedToken & Omit<ARIBB24CharacterToken, 'tag'> & {
  tag: 'Character'
};
export const ARIBB24CharacterParsedToken = {
  from({ character, non_spacing }: Omit<ARIBB24CharacterToken, 'tag'>, state: ARIBB24ParserState, option: ARIBB24ParserOption): ARIBB24CharacterParsedToken {
    return {
      tag: 'Character',
      state: structuredClone(state),
      option: structuredClone(option),
      character,
      non_spacing
    };
  }
}
export type ARIBB24DRCSParsedToken = ARIBB24CommonParsedToken & Omit<ARIBB24DRCSToken, 'tag' | 'combining'> & {
  tag: 'DRCS';
};
export const ARIBB24DRCSParsedToken = {
  from({ width, height, depth, binary }: Omit<ARIBB24DRCSToken, 'tag' | 'combining'>, state: ARIBB24ParserState, option: ARIBB24ParserOption): ARIBB24DRCSParsedToken {
    return {
      tag: 'DRCS',
      state: structuredClone(state),
      option: structuredClone(option),
      width,
      height,
      depth,
      binary
    };
  }
}
export type ARIBB24ParsedToken = ARIBB24ClearScreenParsedToken | ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken;

export class ARIBB24Parser {
  private state: ARIBB24ParserState;
  private option: ARIBB24ParserOption;
  private non_spacings: ARIBB24CharacterParsedToken[] = [];

  public constructor(state: Readonly<ARIBB24ParserState> = initialState, option?: ARIBB24ParserOption) {
    this.state = structuredClone(state);
    this.option = ARIBB24ParserOption.from(option);
    // magnification
    this.state.plane = [this.state.plane[0] * this.option.magnification, this.state.plane[1] * this.option.magnification];
    this.state.area = [this.state.area[0] * this.option.magnification, this.state.area[1] * this.option.magnification];
    this.state.margin = [this.state.margin[0] * this.option.magnification, this.state.margin[1] * this.option.magnification];
    this.state.fontsize = [this.state.fontsize[0] * this.option.magnification, this.state.fontsize[1] * this.option.magnification];
    this.state.hspace = this.state.hspace * this.option.magnification;
    this.state.vspace = this.state.vspace * this.option.magnification;
    this.state.position = [this.state.position[0] * this.option.magnification, this.state.position[1] * this.option.magnification];
  }

  public static box(state: ARIBB24ParserState): [number, number] {
    return [
      Math.floor((state.fontsize[0] + state.hspace) * ARIBB24_CHARACTER_SIZE_MAP.get(state.size)![0]),
      Math.floor((state.fontsize[1] + state.vspace) * ARIBB24_CHARACTER_SIZE_MAP.get(state.size)![1])
    ];
  }
  public static offset(state: ARIBB24ParserState): [number, number] {
    return [
      Math.floor(state.hspace * ARIBB24_CHARACTER_SIZE_MAP.get(state.size)![0] / 2),
      Math.floor(state.vspace * ARIBB24_CHARACTER_SIZE_MAP.get(state.size)![1] / 2)
    ];
  }
  public static scale(state: ARIBB24ParserState): [number, number] {
    return ARIBB24_CHARACTER_SIZE_MAP.get(state.size)!;
  }

  private move_absolute_dot(x: number, y: number) {
    this.state.position[0] = x - this.state.margin[0];
    this.state.position[1] = y - this.state.margin[1];
  }

  private move_absolute_pos(x: number, y: number) {
    this.state.position[0] = x * ARIBB24Parser.box(this.state)[0];
    this.state.position[1] = (y + 1) * ARIBB24Parser.box(this.state)[1] - 1 * this.option.magnification;
  }

  private move_newline() {
    this.state.position[0] = 0;
    this.move_relative_pos(0, 1);
  }

  private move_relative_pos(x: number, y: number) {
    while (x < 0){
      this.state.position[0] -= ARIBB24Parser.box(this.state)[0];
      x++;
      while (this.state.position[0] < 0) {
        this.state.position[0] += this.state.area[0];
        y--;
      }
    }
    while (x > 0){
      this.state.position[0] += ARIBB24Parser.box(this.state)[0];
      x--;
      while (this.state.position[0] >= this.state.area[0]) {
        this.state.position[0] -= this.state.area[0];
        y++;
      }
    }
    while (y < 0){
      this.state.position[1] -= ARIBB24Parser.box(this.state)[1];
      y++;
    }
    while (y > 0){
      this.state.position[1] += ARIBB24Parser.box(this.state)[1];
      y--;
    }

    while (this.state.position[1] >= this.state.area[1]) {
      this.state.position[1] -= this.state.area[1];
    }
    while (this.state.position[1] < 0) {
      this.state.position[1] += this.state.area[1];
    }
  }

  public currentState(): ARIBB24ParserState {
    return structuredClone(this.state);
  }

  public currentOption(): ARIBB24ParserOption {
    return structuredClone(this.option);
  }

  public parseToken(token: ARIBB24Token): ARIBB24ParsedToken[] {
    switch (token.tag) {
      // character
      case 'Character':
        if (!token.non_spacing) {
          const result = [ARIBB24CharacterParsedToken.from(token, this.state, this.option), ... this.non_spacings];
          this.non_spacings = [];
          this.move_relative_pos(1, 0);
          return result;
        } else {
          this.non_spacings.push(ARIBB24CharacterParsedToken.from(token, this.state, this.option));
        }
        break;
      case 'DRCS':
        const result = [
          ARIBB24DRCSParsedToken.from(token, this.state, this.option),
          ... (token.combining === '' ? [] : [ARIBB24CharacterParsedToken.from(ARIBB24CharacterToken.from('　' + token.combining, true), this.state, this.option)]),
          ... this.non_spacings
        ];
        this.non_spacings = [];
        this.move_relative_pos(1, 0);
        return result;
      case 'Space': {
        const result = [ARIBB24CharacterParsedToken.from(ARIBB24CharacterToken.from('　'), this.state, this.option), ... this.non_spacings];
        this.non_spacings = [];
        this.move_relative_pos(1, 0);
        return result;
      }
      // display
      case 'SetWritingFormat': // SWF
        switch (token.format) {
          // horizontal
          case 0:
          case 2:
          case 4:
            break;
          case 5:
            this.state.plane = [1920 * this.option.magnification, 1080 * this.option.magnification];
            break;
          case 7:
            this.state.plane = [960 * this.option.magnification, 540 * this.option.magnification];
            break;
          case 9:
            this.state.plane = [720 * this.option.magnification, 480 * this.option.magnification];
            break;
          case 11:
            this.state.plane = [1280 * this.option.magnification, 720 * this.option.magnification];
            break;
          // vertical
          default:
            break;
        }
        break;
      case 'SetDisplayFormat': // SDF
        this.state.area = [token.horizontal * this.option.magnification, token.vertical * this.option.magnification];
        break;
      case 'SetDisplayPosition': // SDP
        this.state.margin = [token.horizontal * this.option.magnification, token.vertical * this.option.magnification];
        break;
      case 'CharacterCompositionDotDesignation': // SSM
        this.state.fontsize = [token.horizontal * this.option.magnification, token.vertical * this.option.magnification];
        break;
      case 'SetHorizontalSpacing': // SHS
        this.state.hspace = token.spacing * this.option.magnification;
        break;
      case 'SetVerticalSpacing': // SVS
        this.state.vspace = token.spacing * this.option.magnification;
        break;
      // pos
      case 'ActivePositionBackward': // APB
        this.move_relative_pos(-1, 0);
        break;
      case 'ActivePositionForward': // APF
        this.move_relative_pos(1, 0);
        break;
      case 'ActivePositionDown': // APD
        this.move_relative_pos(0, 1);
        break;
      case 'ActivePositionUp': // APU
        this.move_relative_pos(0, -1);
        break;
      case 'ActivePositionReturn': // APR
        this.move_newline();
        break;
      case 'ParameterizedActivePositionForward': // PAPF
        this.move_relative_pos(token.x, 0);
        break;
      case 'ActivePositionSet': // APS
        this.move_absolute_pos(token.x, token.y);
        break;
      case 'ActiveCoordinatePositionSet': // ACPS
        this.move_absolute_dot(token.x * this.option.magnification, token.y * this.option.magnification);
        break;
      // size
      case 'SmallSize':
        this.state.size = ARIBB24_CHARACTER_SIZE.Small;
        break;
      case 'MiddleSize':
        this.state.size = ARIBB24_CHARACTER_SIZE.Middle;
        break;
      case 'NormalSize':
        this.state.size = ARIBB24_CHARACTER_SIZE.Normal;
        break;
      case 'CharacterSizeControl':
        switch (token.type) {
          case ARIBB24CharacterSizeControlType.TINY:
            this.state.size = ARIBB24_CHARACTER_SIZE.Tiny;
            break;
          case ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT:
            this.state.size = ARIBB24_CHARACTER_SIZE.DoubleHeight;
            break;
          case ARIBB24CharacterSizeControlType.DOUBLE_WIDTH:
            this.state.size = ARIBB24_CHARACTER_SIZE.DoubleWidth;
            break;
          case ARIBB24CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH:
            this.state.size = ARIBB24_CHARACTER_SIZE.DoubleHeightAndWidth;
            break;
          case ARIBB24CharacterSizeControlType.SPECIAL_1:
            this.state.size = ARIBB24_CHARACTER_SIZE.Special1;
            break;
          case ARIBB24CharacterSizeControlType.SPECIAL_2:
            this.state.size = ARIBB24_CHARACTER_SIZE.Special2;
            break;
          default:
            throw new ExhaustivenessError(token, `Unexcepted Size Type in STD-B24 ARIB Caption Content`);
        }
        break;
      // pallet
      case 'PalletControl':
        this.state.pallet = token.pallet;
        break;
      case 'BlackForeground':
        this.state.foreground = (this.state.pallet << 4) | 0x00;
        break;
      case 'RedForeground':
        this.state.foreground = (this.state.pallet << 4) | 0x01;
        break;
      case 'GreenForeground':
        this.state.foreground = (this.state.pallet << 4) | 0x02;
        break;
      case 'YellowForeground':
        this.state.foreground = (this.state.pallet << 4) | 0x03;
        break;
      case 'BlueForeground':
        this.state.foreground = (this.state.pallet << 4) | 0x04;
        break;
      case 'MagentaForeground':
        this.state.foreground = (this.state.pallet << 4) | 0x05;
        break;
      case 'CyanForeground':
        this.state.foreground = (this.state.pallet << 4) | 0x06;
        break;
      case 'WhiteForeground':
        this.state.foreground = (this.state.pallet << 4) | 0x07;
        break;
      case 'ColorControlForeground':
        this.state.foreground = (this.state.pallet << 4) | token.color;
        break;
      case 'ColorControlHalfForeground':
        this.state.halfforeground = (this.state.pallet << 4) | token.color;
        break;
      case 'ColorControlHalfBackground':
        this.state.halfbackground = (this.state.pallet << 4) | token.color;
        break;
      case 'ColorControlBackground':
        this.state.background = (this.state.pallet << 4) | token.color;
        break;
      // decoration
      case 'StartLining':
        this.state.underline = true;
        break;
      case 'StopLining':
        this.state.underline = false;
        break;
      case 'HilightingCharacterBlock':
        this.state.highlight = token.enclosure;
        break;
      case 'OrnamentControlNone':
        this.state.ornament = null;
        break;
      case 'OrnamentControlHemming': {
        const lower = Math.floor(token.color / 100);
        const upper = token.color % 100;
        this.state.ornament = (upper << 4) | lower;
        break;
      }
      case 'FlashingControl':
        this.state.flashing = token.type;
        break;
      // time
      case 'ClearScreen':
        return [ARIBB24ClearScreenParsedToken.from(this.state.elapsed_time, this.state, this.option)];
      case 'TimeControlWait':
        this.state.elapsed_time += token.seconds;
        break;
    }

    return [];
  }

  public parse(tokens: ARIBB24Token[]): ARIBB24ParsedToken[] {
    return tokens.flatMap(this.parseToken.bind(this));
  }
}

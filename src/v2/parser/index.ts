import { ARIBB24Token, Character, CharacterSizeControlType, DRCS, OrnamentControlType } from "../tokenizer/token";

const CHARACTER_SIZE = {
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

const CHARACTER_SIZE_MAP = new Map<(typeof CHARACTER_SIZE)[keyof typeof CHARACTER_SIZE], [number, number]>([
  [CHARACTER_SIZE.Small, [0.5, 0.5]],
  [CHARACTER_SIZE.Middle, [0.5, 1]],
  [CHARACTER_SIZE.Normal, [1, 1]],
  [CHARACTER_SIZE.Tiny, [1/4, 1/6]],
  [CHARACTER_SIZE.DoubleHeight, [1, 2]],
  [CHARACTER_SIZE.DoubleWidth, [2, 1]],
  [CHARACTER_SIZE.DoubleHeightAndWidth, [2, 2]],
  [CHARACTER_SIZE.Special1, [Number.NaN, Number.NaN]], // TODO
  [CHARACTER_SIZE.Special2, [Number.NaN, Number.NaN]], // TODO
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
  size: (typeof CHARACTER_SIZE)[keyof typeof CHARACTER_SIZE];
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
  // time
  elapsed_time: number;
  end_time: number | null;
};

export type ARIBB24ParserOption = {
  magnification: number;
}
const ARIBB24ParserStateOption = {
  from(option?: Partial<ARIBB24ParserOption>): ARIBB24ParserOption {
    return {
      magnification: 2,
      ... option
    };
  }
}

export const initialState: ARIBB24ParserState = {
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
  size: CHARACTER_SIZE.Normal,
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
  // time
  elapsed_time: 0,
  end_time: null,
};

export type ARIBB24ClearScreenParsedToken = {
  tag: 'ClearScreen';
  time: number;
  state: ARIBB24ParserState;
};
export type ARIBB24CharacterParsedToken = {
  tag: 'Character';
  character: Character;
  state: ARIBB24ParserState;
};
export type ARIBB24DRCSPrasedToken = {
  tag: 'DRCS';
  drcs: DRCS;
  state: ARIBB24ParserState;
};
export type ARIBB24PRAParsedToken = {
  tag: 'PRA';
  pra: number;
  state: ARIBB24ParserState;
};
export type ARIBB24ParsedToken = ARIBB24ClearScreenParsedToken | ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken | ARIBB24PRAParsedToken;

export class ARIBB24Parser {
  private state: ARIBB24ParserState;
  private option: ARIBB24ParserOption;

  public constructor(state: ARIBB24ParserState = initialState, option?: ARIBB24ParserOption) {
    this.state = structuredClone(state);
    this.option = ARIBB24ParserStateOption.from(option);
    // magnification
    this.state.plane = [this.state.plane[0] * this.option.magnification, this.state.plane[1] * this.option.magnification];
    this.state.area = [this.state.area[0] * this.option.magnification, this.state.area[1] * this.option.magnification];
    this.state.margin = [this.state.margin[0] * this.option.magnification, this.state.margin[1] * this.option.magnification];
    this.state.fontsize = [this.state.fontsize[0] * this.option.magnification, this.state.fontsize[1] * this.option.magnification];
    this.state.hspace = this.state.hspace * this.option.magnification;
    this.state.vspace = this.state.vspace * this.option.magnification;
    this.state.position = [this.state.position[0] * this.option.magnification, this.state.position[1] * this.option.magnification];
  }

  public static width(state: ARIBB24ParserState): number {
    return (state.fontsize[0] + state.hspace) * CHARACTER_SIZE_MAP.get(state.size)![0];
  }
  public static height(state: ARIBB24ParserState): number {
    return (state.fontsize[1] + state.vspace) * CHARACTER_SIZE_MAP.get(state.size)![1];
  }
  public static width_maginification(state: ARIBB24ParserState): number {
    return CHARACTER_SIZE_MAP.get(state.size)![0];
  }
  public static height_maginification(state: ARIBB24ParserState): number {
    return CHARACTER_SIZE_MAP.get(state.size)![1];
  }

  private move_absolute_dot(x: number, y: number) {
    this.state.position[0] = x - this.state.margin[0];
    this.state.position[1] = y - this.state.margin[1];
  }

  private move_absolute_pos(x: number, y: number) {
    this.state.position[0] = x * ARIBB24Parser.width(this.state);
    this.state.position[1] = (y + 1) * ARIBB24Parser.height(this.state) - 1;
  }

  private move_newline() {
    this.state.position[0] = 0;
    this.move_relative_pos(0, 1);
  }

  private move_relative_pos(x: number, y: number) {
    while (x < 0){
      this.state.position[0] -= ARIBB24Parser.width(this.state);
      x++;
      while (this.state.position[0] < 0) {
        this.state.position[0] += this.state.area[0];
        y--;
      }
    }
    while (x > 0){
      this.state.position[0] += ARIBB24Parser.width(this.state);
      x--;
      while (this.state.position[0] >= this.state.area[0]) {
        this.state.position[0] -= this.state.area[0];
        y++;
      }
    }
    while (y < 0){
      this.state.position[1] -= ARIBB24Parser.height(this.state);
      y++;
    }
    while (y > 0){
      this.state.position[1] += ARIBB24Parser.height(this.state);
      y--;
    }
  }

  public parse(tokens: ARIBB24Token[]): ARIBB24ParsedToken[] {
    const result: ARIBB24ParsedToken[] = [];

    for (const token of tokens) {
      switch (token.tag) {
        // character
        case 'Character':
          result.push({
            tag: 'Character',
            character: token,
            state: structuredClone(this.state),
          });
          this.move_relative_pos(1, 0);
          break;
        case 'DRCS':
          result.push({
            tag: 'DRCS',
            drcs: token,
            state: structuredClone(this.state),
          });
          this.move_relative_pos(1, 0);
          break;
        // display
        case 'SetWritingFormat': // SWF
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
          this.state.size = CHARACTER_SIZE.Small;
          break;
        case 'MiddleSize':
          this.state.size = CHARACTER_SIZE.Middle;
          break;
        case 'NormalSize':
          this.state.size = CHARACTER_SIZE.Normal;
          break;
        case 'CharacterSizeControl':
          switch (token.type) {
            case CharacterSizeControlType.TINY:
              this.state.size = CHARACTER_SIZE.Tiny;
              break;
            case CharacterSizeControlType.DOUBLE_HEIGHT:
              this.state.size = CHARACTER_SIZE.DoubleHeight;
              break;
            case CharacterSizeControlType.DOUBLE_WIDTH:
              this.state.size = CHARACTER_SIZE.DoubleWidth;
              break;
            case CharacterSizeControlType.DOUBLE_HEIGHT_AND_WIDTH:
              this.state.size = CHARACTER_SIZE.DoubleHeightAndWidth;
              break;
            case CharacterSizeControlType.SPECIAL_1:
              this.state.size = CHARACTER_SIZE.Special1;
              break;
            case CharacterSizeControlType.SPECIAL_2:
              this.state.size = CHARACTER_SIZE.Special2;
              break;
            default:
              const exhaustive: never = token;
              throw new Error(`Undefined Size Type in STD-B24 ARIB Caption (${exhaustive})`);
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
        case 'OrnamentControl':
          switch (token.type) {
            case OrnamentControlType.NONE:
              this.state.ornament = null;
              break;
            case OrnamentControlType.HEMMING: {
              const lower = Math.floor(token.ornament / 100);
              const upper = token.ornament % 100;
              this.state.ornament = (upper << 4) | lower;
              break;
            }
          }
        // time
        case 'ClearScreen':
          result.push({
            tag: 'ClearScreen',
            time: this.state.elapsed_time,
            state: structuredClone(this.state),
          });
          break;
        case 'TimeControlWait':
          this.state.elapsed_time += token.seconds;
          break;
      }
    }

    return result;
  }
}

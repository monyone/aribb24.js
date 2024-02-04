import Decoder, { AribDecoderResult, AribRegion, AribChar } from "./decoder";
import { ALPHABETS, G_SET_BY_ALPHABET, G_DRCS_BY_ALPHABET, ALPHABET_ENTRY, G_DRCS_BY_F, JIS8, ESC, G_SET_BY_F, CSI } from "../constants/jis8";
import KANJI_MAPPING from '../constants/mapping/kanji'
import ADDITIONAL_SYMBOLS_PUA_MAPPING from '../constants/mapping/additional-symbols-pua'
import ADDITIONAL_SYMBOLS_UNICODE_MAPPING from '../constants/mapping/additional-symbols-unicode'
import ASCII_MAPPING from '../constants/mapping/ascii'
import HIRAGANA_MAPPING from '../constants/mapping/hiragana'
import KATAKANA_MAPPING from '../constants/mapping/katakana'
import md5 from "../utils/md5";

type AribJis8State = {
  GL: number,
  GR: number,
  G_BACK:[ALPHABET_ENTRY, ALPHABET_ENTRY, ALPHABET_ENTRY, ALPHABET_ENTRY];
  DRCS: Map<ALPHABETS, Map<number, Uint8Array>>,

  swf: [number, number],
  sdf: [number, number],
  sdp: [number, number],
  ssm: [number, number],
  shs: number,
  svs: number,

  position: [number, number],
  text_size: [number, number]

  pallet: number,
  fg_index: number,
  bg_index: number,
  hlc: number,
  stl: boolean,
  orn_index: number | null

  style_changed: boolean,
  elapsed_time: number,
  end_time: number | null,
}

export type AribJis8Option = {
  scale: number,
  use_pua: boolean,
  drcs_replacement: Map<string, string>,
}

type AribJis8Initializer = (option: AribJis8Option) => AribJis8State;

export const AribProfileAInitializer: AribJis8Initializer = (option: AribJis8Option) => {
  return {
    GL: 0,
    GR: 2,
    G_BACK: [
      G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)!,
      G_SET_BY_ALPHABET.get(ALPHABETS.ASCII)!,
      G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA)!,
      G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
    ],
    DRCS: new Map([
      [ALPHABETS.DRCS_0, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_1, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_2, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_3, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_4, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_5, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_6, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_7, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_8, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_9, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_10, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_11, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_12, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_13, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_14, new Map<number, Uint8Array>()],
      [ALPHABETS.DRCS_15, new Map<number, Uint8Array>()],
    ]),

    swf: [960 * option.scale, 720 * option.scale],
    sdf: [960 * option.scale, 720 * option.scale],
    sdp: [0, 0],
    ssm: [36 * option.scale, 36 * option.scale],
    shs: 4 * option.scale,
    svs: 24 * option.scale,

    position: [0, (60 * option.scale) - 1],
    text_size: [1, 1],

    pallet: 0,
    fg_index: 0x07,
    bg_index: 0x08,
    hlc: 0,
    stl: false,
    orn_index: null,

    style_changed: true,
    elapsed_time: 0,
    end_time: null
  };
};

export default class Jis8Decoder implements Decoder {
  private option: AribJis8Option;
  private state: AribJis8State;
  private regions: AribRegion[] = [];

  public constructor(option: Partial<AribJis8Option>, initializer: AribJis8Initializer = AribProfileAInitializer) {
    this.option = {
      scale: 1,
      use_pua: false,
      drcs_replacement: new Map<string, string>(),
      ... option
    },
    this.state = initializer(this.option);
  }

  private get x(): number {
    return this.state.position[0] + this.state.sdp[0];
  }
  private set x(x: number) {
    const nx = x - this.state.sdp[0];
    if (nx !== this.x) { this.state.style_changed = true; }
    this.state.position[0] = nx;
  }
  private get y(): number {
    return this.state.sdp[1] + this.state.position[1];
  }
  private set y(y: number) {
    const ny = y - this.state.sdp[1];
    if (ny !== this.y) { this.state.style_changed = true; }
    this.state.position[1] = ny;
  }
  private get screen_x(): number {
    return this.state.position[0];
  }
  private set screen_x(x: number) {
    this.x = x + this.state.sdp[0];
  }
  private get screen_y(): number {
    return this.state.position[1];
  }
  private set screen_y(y: number) {
    this.y = y + this.state.sdp[1];
  }
  private get screen_width(): number {
    return this.state.sdf[0];
  }
  private get screen_height(): number {
    return this.state.sdf[1];
  }
  private get kukaku_width(): number {
    return Math.floor((this.state.shs + this.state.ssm[0]) * this.state.text_size[0])
  }
  private get kukaku_height(): number {
    return Math.floor((this.state.svs + this.state.ssm[1]) * this.state.text_size[1])
  }
  private get char_x(): number {
    return this.x;
  }
  private get char_y(): number {
    return this.y - (this.kukaku_height - 1);
  }
  private set fg_index(index: number) {
    if (this.state.fg_index !== index) { this.state.style_changed = true; }
    this.state.fg_index = index;
  }
  private set bg_index(index: number) {
    if (this.state.bg_index !== index) { this.state.style_changed = true; }
    this.state.bg_index = index;
  }

  private move_absolute_dot(x: number, y: number): void{
    this.x = x;
    this.y = y;
  }
  private move_absolute_pos(x: number, y: number): void {
    this.screen_x = x * this.kukaku_width;
    this.screen_y = y * this.kukaku_height + (this.kukaku_height - 1);
  }
  private move_relative_pos(x: number, y: number){
    while (x < 0){
      this.screen_x -= this.kukaku_width;
      x++;
      if (this.x < 0) {
        this.screen_x = this.screen_width - this.kukaku_width;
        y--;
      }
    }
    while (x > 0){
      this.screen_x += this.kukaku_width;
      x--;
      if (this.screen_x >= this.screen_width) {
        this.screen_x = 0
        y++;
      }
    }
    while (y < 0){
      this.screen_y -= this.kukaku_height;
      y++
      if (this.screen_y < 0) {
        this.screen_y = this.screen_height - this.kukaku_height;
      }
    }
    while (y > 0){
      this.screen_y += this.kukaku_height;
      y--
      if (this.screen_y >= this.screen_height) {
        this.screen_y = 0;
      }
    }
  }
  private move_newline(){
    this.x = 0;
    this.move_relative_pos(0, 1);
  }

  private parseText(data: Uint8Array, begin: number, end: number): void {
    while (begin < end) {
      if (0x20 < data[begin] && data[begin] < 0x7F) {
        let key = 0
        const entry = this.state.G_BACK[this.state.GL]
        if(!entry){ return }

        for(let i = 0; i < entry.bytes; i++){
          key <<= 8
          key |= data[begin + i] & 0x7F
        }
        this.renderCharacter(key, entry)
        begin += entry.bytes
      } else if (0xA0 < data[begin] && data[begin] < 0xFF) {
        let key = 0
        const entry = this.state.G_BACK[this.state.GR]
        if(!entry){ return }

        for(let i = 0; i < entry.bytes; i++){
          key <<= 8
          key |= data[begin + i] & 0x7F
        }
        this.renderCharacter(key, entry)
        begin += entry.bytes
      } else if (data[begin] === JIS8.NUL) {
        begin += 1
      } else if (data[begin] === JIS8.BEL) {
        begin += 1
      } else if (data[begin] === JIS8.APB) {
        this.move_relative_pos(-1, 0)
        begin += 1
      } else if (data[begin] === JIS8.APF) {
        this.move_relative_pos(1, 0)
        begin += 1
      } else if (data[begin] === JIS8.APD) {
        this.move_relative_pos(0, 1)
        begin += 1
      } else if (data[begin] === JIS8.APU) {
        this.move_relative_pos(0, -1)
        begin += 1
      } else if (data[begin] === JIS8.CS) {
        if (this.state.elapsed_time > 0) {
          this.state.end_time = this.state.elapsed_time;
        }
        begin += 1
      } else if (data[begin] === JIS8.APR) {
        this.move_newline()
        begin += 1
      } else if (data[begin] === JIS8.LS1) {
        this.state.GL = 1
        begin += 1
      } else if (data[begin] === JIS8.LS0) {
        this.state.GL = 0
        begin += 1
      } else if (data[begin] === JIS8.PAPF) {
        const P1 = data[begin + 1] & 0x3F
        this.move_relative_pos(P1, 0)
        begin += 2
      } else if (data[begin] === JIS8.CAN) {
        begin += 1
      } else if (data[begin] === JIS8.SS2) {
        let key = 0
        const entry = this.state.G_BACK[2]
        if(!entry){ return }

        for(let i = 0; i < entry.bytes; i++){
          key <<= 8
          key |= data[(begin + 1) + i] & 0x7F
        }
        this.renderCharacter(key, entry)
        begin += 1 + entry.bytes
      } else if (data[begin] === JIS8.ESC) {
        if (data[begin + 1] === ESC.LS2){
          this.state.GL = 2
          begin += 2
        } else if(data[begin + 1] == ESC.LS3){
          this.state.GL = 3
          begin += 2
        }else if(data[begin + 1] == ESC.LS1R){
          this.state.GR = 1
          begin += 2
        }else if(data[begin + 1] == ESC.LS2R){
          this.state.GR = 2
          begin += 2
        }else if(data[begin + 1] == ESC.LS3R){
          this.state.GR = 3
          begin += 2
        }else if(0x28 <= data[begin + 1] && data[begin + 1] <= 0x2B){
          const GX = data[begin + 1] - 0x28
          if (data[begin + 2] === 0x20){
            this.state.G_BACK[GX] = G_DRCS_BY_F.get(data[begin + 3])!
            begin += 4
          }else{
            this.state.G_BACK[GX] = G_SET_BY_F.get(data[begin + 2])!
            begin += 3
          }
        }else if(data[begin + 1] === 0x24){
          if(0x28 <= data[begin + 2] && data[begin + 2] <= 0x2B){
            const GX = data[begin + 2] - 0x28
            if (data[begin + 3] === 0x20){
              this.state.G_BACK[GX] = G_DRCS_BY_F.get(data[begin + 4])!
              begin += 5
            }else{
              this.state.G_BACK[GX] = G_SET_BY_F.get(data[begin + 3])!
              begin += 4
            }
          }else{
            this.state.G_BACK[0] = G_SET_BY_F.get(data[begin + 2])!
            begin += 3
          }
        } else {
          return
        }
      } else if (data[begin] === JIS8.APS) {
        const P1 = data[begin + 1] & 0x3F
        const P2 = data[begin + 2] & 0x3F
        this.move_absolute_pos(P2, P1)
        begin += 3
      } else if (data[begin] === JIS8.SS3) {
        let key = 0
        const entry = this.state.G_BACK[3]
        if(!entry){ return }

        for(let i = 0; i < entry.bytes; i++){
          key <<= 8
          key |= data[(begin + 1) + i] & 0x7F
        }
        this.renderCharacter(key, entry)
        begin += 1 + entry.bytes
      } else if (data[begin] === JIS8.RS) {
        begin += 1
      } else if (data[begin] === JIS8.US) {
        begin += 1
      } else if (data[begin] === JIS8.SP) {
        const entry = G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)
        if(!entry){ return }

        this.renderCharacter(0x2121, entry)
        begin += 1
      } else if (data[begin] === JIS8.DEL) {
        begin += 1
      } else if (data[begin] === JIS8.BKF) {
        this.fg_index = this.state.pallet * 16 + 0;
        begin += 1
      } else if (data[begin] === JIS8.RDF) {
        this.fg_index = this.state.pallet * 16 + 1;
        begin += 1
      } else if (data[begin] === JIS8.GRF) {
        this.fg_index = this.state.pallet * 16 + 2;
        begin += 1
      } else if (data[begin] === JIS8.YLF) {
        this.fg_index = this.state.pallet * 16 + 3;
        begin += 1
      } else if (data[begin] === JIS8.BLF) {
        this.fg_index = this.state.pallet * 16 + 4;
        begin += 1
      } else if (data[begin] === JIS8.MGF) {
        this.fg_index = this.state.pallet * 16 + 5;
        begin += 1
      } else if (data[begin] === JIS8.CNF) {
        this.fg_index = this.state.pallet * 16 + 6;
        begin += 1
      } else if (data[begin] === JIS8.WHF) {
        this.fg_index = this.state.pallet * 16 + 7;
        begin += 1
      } else if (data[begin] === JIS8.SSZ) {
        this.state.text_size = [0.5, 0.5];
        begin += 1
      } else if (data[begin] === JIS8.MSZ) {
        this.state.text_size = [0.5, 1];
        begin += 1
      } else if (data[begin] === JIS8.NSZ) {
        this.state.text_size = [1, 1];
        begin += 1
      } else if (data[begin] === JIS8.SZX) {
        throw Error('Not Implemented');
      } else if (data[begin] === JIS8.COL) {
        const P1 = data[begin + 1]
        if(P1 == 0x20){
          const P2 = data[begin + 2] & 0x0F
          this.state.pallet = P2
          begin += 3
        }else{
          const color = P1 & 0x0F
          if((P1 & 0x70) == 0x40){
            this.fg_index = this.state.pallet * 16 + color;
          }else if((P1 & 0x70) == 0x50){
            this.bg_index = this.state.pallet * 16 + color;
          }else{
            throw Error('Not Implemeneted');
          }
          begin += 2
        }
      } else if (data[begin] === JIS8.FLC) {
        begin += 2
      } else if (data[begin] === JIS8.CDC) {
        throw Error('Not Implemeneted');
      } else if (data[begin] === JIS8.POL) {
        throw Error('Not Implemeneted');
      } else if (data[begin] === JIS8.WMM) {
        throw Error('Not Implemeneted');
      } else if (data[begin] === JIS8.MACRO) {
        throw Error('Not Implemeneted');
      } else if (data[begin] === JIS8.HLC) {
        this.state.hlc = data[begin + 1] & 0x0F;
        this.state.style_changed = true;
        begin += 2
      } else if (data[begin] === JIS8.RPC) {
        throw Error('Not Implemeneted');
      } else if (data[begin] === JIS8.SPL) {
        this.state.stl = false
        this.state.style_changed = true;
        begin += 1
      } else if (data[begin] === JIS8.STL) {
        this.state.stl = true
        this.state.style_changed = true;
        begin += 1
      } else if (data[begin] === JIS8.CSI) {
        let last = begin
        let middleIndex = -1
        let separatorIndex = -1
        while (last + 1 < end) {
          last += 1
          if(data[last] === 0x20){
            // 中間文字
            if (middleIndex < 0) {
              middleIndex = last
            }
          }else if(data[last] === 0x3B){
            // 区切り文字
            if (middleIndex < 0 && separatorIndex < 0) {
              separatorIndex = last
            }
          }else if(data[last] === CSI.GSM){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.SWF){
            let index = begin + 1
            let P1 = 0
            if (separatorIndex >= 0 || middleIndex < 0) {
              throw Error('Not Implemented');
            }
            while (index < middleIndex) {
              P1 *= 10
              P1 += data[index] & 0x0F
              index++
            }
            if(P1 === 5){
              this.state.swf = [1920 * this.option.scale, 1080 * this.option.scale]
            }else if(P1 === 7){
              this.state.swf = [960 * this.option.scale, 540 * this.option.scale]
            }else if(P1 == 9){
              this.state.swf = [720 * this.option.scale, 480 * this.option.scale]
            }else{
              throw Error('Not Implemented');
            }
            this.state.style_changed = true;
            break
          }else if(data[last] === CSI.CCC){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.SDF){
            let index = begin + 1
            let P1 = 0, P2 = 0
            while (index < separatorIndex) {
              P1 *= 10
              P1 += data[index] & 0x0F
              index++
            }
            index++
            while (index < middleIndex) {
              P2 *= 10
              P2 += data[index] & 0x0F
              index++
            }
            this.state.sdf = [P1 * this.option.scale, P2 * this.option.scale];
            this.state.style_changed = true;
            break
          }else if(data[last] === CSI.SSM){
            let index = begin + 1
            let P1 = 0, P2 = 0
            while (index < separatorIndex) {
              P1 *= 10
              P1 += data[index] & 0x0F
              index++
            }
            index++
            while (index < middleIndex) {
              P2 *= 10
              P2 += data[index] & 0x0F
              index++
            }
            this.state.ssm = [P1 * this.option.scale, P2 * this.option.scale];
            this.state.style_changed = true;
            break
          }else if(data[last] === CSI.SHS){
            let index = begin + 1
            let P1 = 0
            while (index < middleIndex) {
              P1 *= 10
              P1 += data[index] & 0x0F
              index++
            }
            this.state.shs = P1 * this.option.scale;
            this.state.style_changed = true;
            break
          }else if(data[last] === CSI.SVS){
            let index = begin + 1
            let P1 = 0
            while (index < middleIndex) {
              P1 *= 10
              P1 += data[index] & 0x0F
              index++
            }
            this.state.svs = P1 * this.option.scale;
            this.state.style_changed = true;
            break
          }else if(data[last] === CSI.PLD){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.PLU){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.GAA){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.SRC){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.SDP){
            let index = begin + 1
            let P1 = 0, P2 = 0
            while (index < separatorIndex) {
              P1 *= 10
              P1 += data[index] & 0x0F
              index++
            }
            index++
            while (index < middleIndex) {
              P2 *= 10
              P2 += data[index] & 0x0F
              index++
            }
            this.state.sdp = [P1 * this.option.scale, P2 * this.option.scale];
            this.state.style_changed = true;
            break
          }else if(data[last] === CSI.ACPS){
            let index = begin + 1
            let P1 = 0, P2 = 0
            while (index < separatorIndex) {
              P1 *= 10
              P1 += data[index] & 0x0F
              index++
            }
            index++
            while (index < middleIndex) {
              P2 *= 10
              P2 += data[index] & 0x0F
              index++
            }
            this.move_absolute_dot(P1 * this.option.scale, P2 * this.option.scale);
            break
          }else if(data[last] === CSI.TCC){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.ORN){
            const P1 = data[begin + 1]
            if (P1 == 0x30) {
              this.state.orn_index = null
              this.state.style_changed = true;
            }else if(P1 == 0x31){
              const P2 = (data[begin + 3] & 0x0F) * 10 + (data[begin + 4] & 0x0F)
              const P3 = (data[begin + 5] & 0x0F) * 10 + (data[begin + 6] & 0x0F)
              this.state.orn_index = P2 * 16 + P3;
              this.state.style_changed = true;
            }
            break
          }else if(data[last] === CSI.MDF){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.CFS){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.XCS){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.SCR){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.PRA){
            let index = begin + 1
            let P1 = 0
            while (index < middleIndex) {
              P1 *= 10
              P1 += data[index] & 0x0F
              index++
            }
            //this.state.PRA = P1
            break;
          }else if(data[last] === CSI.ACS){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.UED){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.RCS){
            throw Error('Not Implemeneted');
          }else if(data[last] === CSI.SCS){
            throw Error('Not Implemeneted');
          }
        }
        begin = last + 1
      } else if (data[begin] === JIS8.TIME) {
        if(data[begin + 1] == 0x20){
          const P2 = data[begin + 2] & 0x3F
          this.state.elapsed_time += P2 / 10;
          begin += 3
        }else if(data[begin + 1] == 0x28){
          return
        }else{
          return
        }
      } else {
        return
      }
    }
  }

  private parseDRCS(data: Uint8Array, bytes: number, begin: number, end: number){
    const NumberOfCode = data[begin + 0]
    begin += 1
    while (begin < end){
      const CharacterCode = (data[begin + 0] << 8) | data[begin + 1]
      const NumberOfFont = data[begin + 2]

      begin += 3
      for(let font = 0; font < NumberOfFont; font++){
        const fontId = (data[begin + 0] & 0xF0) >> 4
        const mode = (data[begin + 0] & 0x0F)
        if (mode === 0 || mode === 1){
          const depth = data[begin + 1] + 2
          const width = data[begin + 2]
          const height = data[begin + 3]
          const depth_bits = depth.toString(2).length - depth.toString(2).replace(/0*$/, '').length
          const length = Math.floor(width * height * depth_bits / 8)
          const drcs = new Uint8Array(Array.prototype.slice.call(data, begin + 4, begin + 4 + length)) // for IE11

          if(bytes === 1){
            const index = ((CharacterCode & 0x0F00) >> 8) + 0x40
            const ch = (CharacterCode & 0x00FF) & 0x7F
            const alphabet = G_DRCS_BY_F.get(index)?.alphabet!
            if(alphabet){
              this.state.DRCS.get(alphabet)?.set(ch, drcs)
            }
          }else{
            const ch = CharacterCode & 0x7F7F
            this.state.DRCS.get(ALPHABETS.DRCS_0)?.set(ch, drcs)
          }

          begin += 4 + length
        }
      }
    }
  }

  private renderCharacter(key: number, entry: ALPHABET_ENTRY) {
    if (this.state.style_changed) {
      this.regions.push({
        text: [],
        position: [this.char_x, this.char_y],
        extent: [0, 0],
        fg_index: this.state.fg_index,
        bg_index: this.state.bg_index,
        hlc: this.state.hlc,
        stl: this.state.stl,
        orn_index: this.state.orn_index,
      })
    }

    if (entry.alphabet === ALPHABETS.KANJI) {
      const ch1 = ((key & 0xFF00) >> 8) - 0x21
      const ch2 = ((key & 0x00FF) >> 0) - 0x21
      const index = ch1 * (0x7E - 0x21 + 1) + ch2

      const additional_symbol = ((0x75 - 0x21) * (0x7E - 0x21 + 1)) + 0
      if (index < additional_symbol) {
        const character = KANJI_MAPPING[index];
        this.regions[this.regions.length - 1].text.push({
          type: 'TEXT',
          character,
          position: [this.char_x, this.char_y],
          extent: [this.kukaku_width, this.kukaku_height],
        });
      } else {
        if (this.option.use_pua) {
          const character = ADDITIONAL_SYMBOLS_PUA_MAPPING[index - additional_symbol]
          this.regions[this.regions.length - 1].text.push({
            type: 'TEXT',
            character,
            position: [this.char_x, this.char_y],
            extent: [this.kukaku_width, this.kukaku_height],
          });
        } else {
          const character = ADDITIONAL_SYMBOLS_UNICODE_MAPPING[index - additional_symbol]
          this.regions[this.regions.length - 1].text.push({
            type: 'TEXT',
            character,
            position: [this.char_x, this.char_y],
            extent: [this.kukaku_width, this.kukaku_height],
          });
        }
      }

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.ASCII) {
      const index = key - 0x21
      const character = ASCII_MAPPING[index]

      this.regions[this.regions.length - 1].text.push({
        type: 'TEXT',
        character,
        position: [this.char_x, this.char_y],
        extent: [this.kukaku_width, this.kukaku_height],
      });

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.HIRAGANA) {
      const index = key - 0x21
      const character = HIRAGANA_MAPPING[index]

      this.regions[this.regions.length - 1].text.push({
        type: 'TEXT',
        character,
        position: [this.char_x, this.char_y],
        extent: [this.kukaku_width, this.kukaku_height],
      });

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.KATAKANA) {
      const index = key - 0x21
      const character = KATAKANA_MAPPING[index]

      this.regions[this.regions.length - 1].text.push({
        type: 'TEXT',
        character,
        position: [this.char_x, this.char_y],
        extent: [this.kukaku_width, this.kukaku_height],
      });

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.MACRO) {
      if (key === 0x60){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.ASCII)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x61){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.KATAKANA)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x62){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_1)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x63){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_A)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_C)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_D)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x64){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_A)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_B)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_D)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x65){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_A)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_1)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_D)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x66){
        this.state.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_1)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_2)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_3)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x67){
        this.state.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_4)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_5)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_6)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x68){
        this.state.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_7)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_8)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_9)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x69){
        this.state.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_10)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_11)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_12)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x6a){
        this.state.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_13)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_14)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_15)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x6b){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_2)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x6c){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_3)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x6d){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_4)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x6e){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KATAKANA)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.ASCII)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }else if(key === 0x6f){
        this.state.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.ASCII)!,
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_A)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_1)!,
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)!,
        ]
        this.state.GL = 0
        this.state.GR = 2
      }

      return
    }else { // DRCS
      const drcs = this.state.DRCS.get(entry.alphabet)?.get(key & 0x7F7F)
      if(!drcs){ return; }

      const drcs_hash = md5(drcs.buffer);
      if (this.option.drcs_replacement.has(drcs_hash.toLowerCase())) {
        const character = this.option.drcs_replacement.get(drcs_hash.toLowerCase())!;
        this.regions[this.regions.length - 1].text.push({
          type: 'TEXT',
          character,
          position: [this.char_x, this.char_y],
          extent: [this.kukaku_width, this.kukaku_height],
        });
      } else if (this.option.drcs_replacement.has(drcs_hash.toUpperCase())) {
        const character = this.option.drcs_replacement.get(drcs_hash.toUpperCase())!;
        this.regions[this.regions.length - 1].text.push({
          type: 'TEXT',
          character,
          position: [this.char_x, this.char_y],
          extent: [this.kukaku_width, this.kukaku_height],
        });
      } else {
        this.regions[this.regions.length - 1].text.push({
          type: 'DRCS',
          data: drcs,
          position: [this.char_x, this.char_y],
          extent: [this.kukaku_width, this.kukaku_height],
        });
      }

      this.move_relative_pos(1, 0)
    }
  }
  public decode(data: Uint8Array): AribDecoderResult {
    const PES_data_packet_header_length = data[2] & 0x0F
    const data_group_begin = (3 + PES_data_packet_header_length)
    const data_group_id = (data[data_group_begin + 0] & 0xFC) >> 2
    const data_group_size = (data[data_group_begin + 3] << 8) + data[data_group_begin + 4]

    let data_unit = data_group_begin + 9
    while (data_unit < data_group_begin + (5 + data_group_size)) {
      const unit_separator = data[data_unit + 0]
      const data_unit_parameter = data[data_unit + 1]
      const data_unit_size = (data[data_unit + 2] << 16) | (data[data_unit + 3] << 8) | data[data_unit + 4]

      if (data_unit_parameter === 0x20) {
        this.parseText(data, data_unit + 5, data_unit + 5 + data_unit_size)
      }else if (data_unit_parameter == 0x30) {
        this.parseDRCS(data, 1, data_unit + 5, data_unit + 5 + data_unit_size)
      }else if (data_unit_parameter == 0x31) {
        this.parseDRCS(data, 2, data_unit + 5, data_unit + 5 + data_unit_size)
      }

      data_unit += 5 + data_unit_size
    }
    return {
      regions: [... this.regions],
      plane: [... this.state.swf],
      end_time: this.state.end_time ?? Number.POSITIVE_INFINITY,
    };
  }
}

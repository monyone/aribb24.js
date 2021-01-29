import { JIS8, ESC, CSI } from '@/constants/jis8'
import { ALPHABETS, ALPHABET_ENTRY } from '@/constants/jis8'
import { G_SET_BY_ALPHABET, G_SET_BY_F } from '@/constants/jis8'
import { G_DRCS_BY_ALPHABET, G_DRCS_BY_F } from '@/constants/jis8'

import pallets from '@/constants/color-table'

import KANJI_MAPPING from '@/constants/mapping/kanji'
import ASCII_MAPPING from '@/constants/mapping/ascii'
import HIRAGANA_MAPPING from '@/constants/mapping/hiragana'
import KATAKANA_MAPPING from '@/constants/mapping/katakana'
import ADDITIONAL_SYMBOL_SET from '@/constants/mapping/additional-symbol-set'

interface ProviderOption {
  normalFont?: string,
  gaijiFont?: string,
}

export default class CanvasProvider {
  private pes: Uint8Array

  private fg_canvas: HTMLCanvasElement | null = null
  private bg_canvas: HTMLCanvasElement | null = null

  private GL: number = 0
  private GR: number = 2
  private G_BACK: (ALPHABET_ENTRY | undefined)[] = [
    G_SET_BY_ALPHABET.get(ALPHABETS.KANJI),
    G_SET_BY_ALPHABET.get(ALPHABETS.ASCII),
    G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA),
    G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO)
  ]
  private DRCS_mapping = new Map([
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
  ])

  private swf_x: number = 960
  private swf_y: number = 540
  private sdf_x: number = 960
  private sdf_y: number = 540
  private sdp_x: number = 0
  private sdp_y: number = 0
  private ssm_x: number = 36
  private ssm_y: number = 36
  private shs: number = 4
  private svs: number = 24
  private text_size_x: number = 1
  private text_size_y: number = 1
  private position_x: number = -1
  private position_y: number = -1

  private pallet = 0
  private fg_color = pallets[this.pallet][7]
  private bg_color = pallets[this.pallet][8]

  private hlc: number = 0
  private stl: boolean = false
  private orn: string | null = null

  private startTime: number | null;
  private timeElapsed: number = 0;
  private endTime: number | null;

  private normalFont: string;
  private gaijiFont: string;

  public constructor(pes: Uint8Array, option?: ProviderOption) {
    this.pes = pes
    this.startTime = this.endTime = null
    this.normalFont = option?.normalFont ?? 'sans-serif'
    this.gaijiFont = option?.gaijiFont ?? this.normalFont
  }

  private width(): number {
    return Math.floor((this.shs + this.ssm_x) * this.text_size_x)
  }
  private height(): number {
    return Math.floor((this.svs + this.ssm_y) * this.text_size_y)
  }
  private move_absolute_dot(x: number, y: number): void{
    this.position_x = x
    this.position_y = y
  }
  private move_absolute_pos(x: number, y: number): void {
    this.position_x = this.sdp_x + x * this.width()
    this.position_y = this.sdp_y + (y + 1) * this.height()
  }
  private move_relative_pos(x: number, y: number){
    if (this.position_x < 0 || this.position_y < 0){
      this.move_absolute_pos(0, 0)
    }

    while (x < 0){
      this.position_x -= this.width()
      x++
      if(this.position_x < this.sdp_x){
        this.position_x = this.sdp_x + this.sdf_x - this.width()
        y--
      }
    }
    while (x > 0){
      this.position_x += this.width()
      x--
      if(this.position_x >= this.sdp_x + this.sdf_x){
        this.position_x = this.sdp_x
        y++
      }
    }
    while (y < 0){
      this.position_y -= this.height()
      y++
    }
    while (y > 0){
      this.position_y += this.height()
      y--
    }
  }
  private move_newline(){
    if (this.position_x < 0 || this.position_y < 0){
      this.move_absolute_pos(0, 0)
    }
    this.position_x = this.sdp_x
    this.position_y = this.position_y + this.height()
  }

  public render(pts: number): VTTCue | null {
    this.startTime = pts

    const data_identifer = this.pes[0]
    if(data_identifer != 0x80){
      return null
    }

    const PES_data_packet_header_length = this.pes[2] & 0x0F
    const data_group_begin = (3 + PES_data_packet_header_length)
    const data_group_id = (this.pes[data_group_begin + 0] & 0xFC) >> 2
    const data_group_size = (this.pes[data_group_begin + 3] << 8) + this.pes[data_group_begin + 4]

    // 本当は字幕管理データから画面サイズを求めるべきだが...
    if ((data_group_id & 0x0F) !== 1) { // とりあえず第一言語字幕だけとる
      return null
    }

    let data_unit = data_group_begin + 9
    while (data_unit < data_group_begin + (5 + data_group_size)) {
      const unit_separator = this.pes[data_unit + 0]
      const data_unit_parameter = this.pes[data_unit + 1]
      const data_unit_size = (this.pes[data_unit + 2] << 16) | (this.pes[data_unit + 3] << 8) | this.pes[data_unit + 4]

      if (data_unit_parameter === 0x20) {
        this.parseText(data_unit + 5, data_unit + 5 + data_unit_size)
      }else if (data_unit_parameter == 0x30) {
        this.parseDRCS(1, data_unit + 5, data_unit + 5 + data_unit_size)
      }else if (data_unit_parameter == 0x31) {
        this.parseDRCS(2, data_unit + 5, data_unit + 5 + data_unit_size)
      }

      data_unit += 5 + data_unit_size
    }

    if(this.fg_canvas && this.bg_canvas){
      const canvas = document.createElement('canvas')
      canvas.width = this.swf_x
      canvas.height = this.swf_y
      const ctx = canvas.getContext('2d')
      if(!ctx){
        return null
      }

      ctx.drawImage(
        this.bg_canvas,
        0, 0, this.bg_canvas.width, this.bg_canvas.height,
        0, 0, canvas.width, canvas.height
      )
      ctx.drawImage(
        this.fg_canvas,
        0, 0, this.fg_canvas.width, this.fg_canvas.height,
        0, 0, canvas.width, canvas.height
      )

      const cue: VTTCue = new VTTCue(pts, !this.endTime ? Number.MAX_SAFE_INTEGER : this.endTime, '');
      (cue as any).canvas = canvas
      return cue
    }else{
      return null
    }
  }

  private parseText(begin: number, end: number): void {
    while (begin < end) {
      if (0x20 < this.pes[begin] && this.pes[begin] < 0x7F) {
        let key = 0
        const entry = this.G_BACK[this.GL]
        if(!entry){ return }

        for(let i = 0; i < entry.bytes; i++){
          key <<= 8
          key |= this.pes[begin + i] & 0x7F
        }
        this.renderCharacter(key, entry)
        begin += entry.bytes
      } else if (0xA0 < this.pes[begin] && this.pes[begin] < 0xFF) {
        let key = 0
        const entry = this.G_BACK[this.GR]
        if(!entry){ return }

        for(let i = 0; i < entry.bytes; i++){
          key <<= 8
          key |= this.pes[begin + i] & 0x7F
        }
        this.renderCharacter(key, entry)
        begin += entry.bytes
      } else if (this.pes[begin] === JIS8.NUL) {
        begin += 1
      } else if (this.pes[begin] === JIS8.BEL) {
        begin += 1
      } else if (this.pes[begin] === JIS8.APB) {
        this.move_relative_pos(-1, 0)
        begin += 1
      } else if (this.pes[begin] === JIS8.APF) {
        this.move_relative_pos(1, 0)
        begin += 1
      } else if (this.pes[begin] === JIS8.APD) {
        this.move_relative_pos(0, 1)
        begin += 1
      } else if (this.pes[begin] === JIS8.APU) {
        this.move_relative_pos(0, -1)
        begin += 1
      } else if (this.pes[begin] === JIS8.CS) {
        if(this.startTime && this.timeElapsed > 0){
          this.endTime = this.startTime + this.timeElapsed
        }
        begin += 1
      } else if (this.pes[begin] === JIS8.APR) {
        this.move_newline()
        begin += 1
      } else if (this.pes[begin] === JIS8.LS1) {
        this.GL = 1
        begin += 1
      } else if (this.pes[begin] === JIS8.LS0) {
        this.GL = 0
        begin += 1
      } else if (this.pes[begin] === JIS8.PAPF) {
        const P1 = this.pes[begin + 1] & 0x3F
        this.move_relative_pos(P1, 0)
        begin += 2
      } else if (this.pes[begin] === JIS8.CAN) {
        begin += 1
      } else if (this.pes[begin] === JIS8.SS2) {
        let key = 0
        const entry = this.G_BACK[2]
        if(!entry){ return }

        for(let i = 0; i < entry.bytes; i++){
          key <<= 8
          key |= this.pes[(begin + 1) + i] & 0x7F
        }
        this.renderCharacter(key, entry)
        begin += 1 + entry.bytes
      } else if (this.pes[begin] === JIS8.ESC) {
        if (this.pes[begin + 1] === ESC.LS2){
          this.GL = 2
          begin += 2
        } else if(this.pes[begin + 1] == ESC.LS3){
          this.GL = 3
          begin += 2
        }else if(this.pes[begin + 1] == ESC.LS1R){
          this.GR = 1
          begin += 2
        }else if(this.pes[begin + 1] == ESC.LS2R){
          this.GR = 2
          begin += 2
        }else if(this.pes[begin + 1] == ESC.LS3R){
          this.GR = 3
          begin += 2
        }else if(0x28 <= this.pes[begin + 1] && this.pes[begin + 1] <= 0x2B){
          const GX = this.pes[begin + 1] - 0x28
          if (this.pes[begin + 2] === 0x20){
            this.G_BACK[GX] = G_DRCS_BY_F.get(this.pes[begin + 3])
            begin += 4
          }else{
            this.G_BACK[GX] = G_SET_BY_F.get(this.pes[begin + 2])
            begin += 3
          }
        }else if(this.pes[begin + 1] === 0x24){
          if(0x28 <= this.pes[begin + 2] && this.pes[begin + 2] <= 0x2B){
            const GX = this.pes[begin + 2] - 0x28
            if (this.pes[begin + 3] === 0x20){
              this.G_BACK[GX] = G_DRCS_BY_F.get(this.pes[begin + 4])
              begin += 5
            }else{
              this.G_BACK[GX] = G_SET_BY_F.get(this.pes[begin + 3])
              begin += 4
            }
          }else{
            this.G_BACK[0] = G_SET_BY_F.get(this.pes[begin + 2])
            begin += 3
          }
        }
      } else if (this.pes[begin] === JIS8.APS) {
        const P1 = this.pes[begin + 1] & 0x3F
        const P2 = this.pes[begin + 2] & 0x3F
        this.move_absolute_pos(P2, P1)
        begin += 3
      } else if (this.pes[begin] === JIS8.SS3) {
        let key = 0
        const entry = this.G_BACK[3]
        if(!entry){ return }

        for(let i = 0; i < entry.bytes; i++){
          key <<= 8
          key |= this.pes[(begin + 1) + i] & 0x7F
        }
        this.renderCharacter(key, entry)
        begin += 1 + entry.bytes
      } else if (this.pes[begin] === JIS8.RS) {
        begin += 1
      } else if (this.pes[begin] === JIS8.US) {
        begin += 1
      } else if (this.pes[begin] === JIS8.SP) {
        const entry = G_SET_BY_ALPHABET.get(ALPHABETS.KANJI)
        if(!entry){ return }

        this.renderCharacter(0x2121, entry)
        begin += 1
      } else if (this.pes[begin] === JIS8.DEL) {
        begin += 1
      } else if (this.pes[begin] === JIS8.BKF) {
        this.fg_color = pallets[this.pallet][0]
        begin += 1
      } else if (this.pes[begin] === JIS8.RDF) {
        this.fg_color = pallets[this.pallet][1]
        begin += 1
      } else if (this.pes[begin] === JIS8.GRF) {
        this.fg_color = pallets[this.pallet][2]
        begin += 1
      } else if (this.pes[begin] === JIS8.YLF) {
        this.fg_color = pallets[this.pallet][3]
        begin += 1
      } else if (this.pes[begin] === JIS8.BLF) {
        this.fg_color = pallets[this.pallet][4]
        begin += 1
      } else if (this.pes[begin] === JIS8.MGF) {
        this.fg_color = pallets[this.pallet][5]
        begin += 1
      } else if (this.pes[begin] === JIS8.CNF) {
        this.fg_color = pallets[this.pallet][6]
        begin += 1
      } else if (this.pes[begin] === JIS8.WHF) {
        this.fg_color = pallets[this.pallet][7]
        begin += 1
      } else if (this.pes[begin] === JIS8.SSZ) {
        this.text_size_x = 0.5
        this.text_size_y = 0.5
        begin += 1
      } else if (this.pes[begin] === JIS8.MSZ) {
        this.text_size_x = 0.5
        this.text_size_y = 1
        begin += 1
      } else if (this.pes[begin] === JIS8.NSZ) {
        this.text_size_x = 1
        this.text_size_y = 1
        begin += 1
      } else if (this.pes[begin] === JIS8.SZX) {
        return
      } else if (this.pes[begin] === JIS8.COL) {
        const P1 = this.pes[begin + 1]
        if(P1 == 0x20){
          const P2 = this.pes[begin + 2] & 0x0F
          this.pallet = P2
          begin += 3
        }else{
          const color = P1 & 0x0F
          if((P1 & 0x70) == 0x40){
            this.fg_color = pallets[this.pallet][color]
          }else if((P1 & 0x70) == 0x50){
            this.bg_color = pallets[this.pallet][color]
          }else{
            // other
          }
          begin += 2
        }
      } else if (this.pes[begin] === JIS8.FLC) {
        begin += 2
      } else if (this.pes[begin] === JIS8.CDC) {
        return
      } else if (this.pes[begin] === JIS8.POL) {
        return
      } else if (this.pes[begin] === JIS8.WMM) {
        return
      } else if (this.pes[begin] === JIS8.MACRO) {
        return
      } else if (this.pes[begin] === JIS8.HLC) {
        this.hlc = this.pes[begin + 1] & 0x0F
        begin += 2
      } else if (this.pes[begin] === JIS8.RPC) {
        return
      } else if (this.pes[begin] === JIS8.SPL) {
        this.stl = false
        begin += 1
      } else if (this.pes[begin] === JIS8.STL) {
        this.stl = true
        begin += 1
      } else if (this.pes[begin] === JIS8.CSI) {
        let last = begin + 1
        while(true){
          if (this.pes[last] === CSI.GSM){
            break
          }else if(this.pes[last] === CSI.SWF){
            let index = begin + 1
            let P1 = 0
            while (this.pes[index] != 0x3B && this.pes[index] != 0x20){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            if (this.pes[index] !== 0x20) {
              return
            }
            if(P1 === 5){
              this.swf_x = 1920
              this.swf_y = 1080
            }else if(P1 === 7){
              this.swf_x = 960
              this.swf_y = 540
            }else if(P1 == 9){
              this.swf_x = 720
              this.swf_y = 480
            }else{
              return
            }
            break
          }else if(this.pes[last] === CSI.CCC){
            break
          }else if(this.pes[last] === CSI.SDF){
            let index = begin + 1
            let P1 = 0, P2 = 0
            while (this.pes[index] != 0x3B){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            index++
            while(this.pes[index] != 0x20){
              P2 *= 10
              P2 += this.pes[index] & 0x0F
              index++
            }
            this.sdf_x = P1
            this.sdf_y = P2
            break
          }else if(this.pes[last] === CSI.SSM){
            let index = begin + 1
            let P1 = 0, P2 = 0
            while (this.pes[index] != 0x3B){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            index++
            while(this.pes[index] != 0x20){
              P2 *= 10
              P2 += this.pes[index] & 0x0F
              index++
            }
            this.ssm_x = P1
            this.ssm_y = P2
            break
          }else if(this.pes[last] === CSI.SHS){
            let index = begin + 1
            let P1 = 0
            while (this.pes[index] != 0x20){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            this.shs = P1
            break
          }else if(this.pes[last] === CSI.SVS){
            let index = begin + 1
            let P1 = 0
            while (this.pes[index] != 0x20){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            this.svs = P1
            break
          }else if(this.pes[last] === CSI.PLD){
            break
          }else if(this.pes[last] === CSI.PLU){
            break
          }else if(this.pes[last] === CSI.GAA){
            break
          }else if(this.pes[last] === CSI.SRC){
            break
          }else if(this.pes[last] === CSI.SDP){
            let index = begin + 1
            let P1 = 0, P2 = 0
            while (this.pes[index] != 0x3B){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            index++
            while(this.pes[index] != 0x20){
              P2 *= 10
              P2 += this.pes[index] & 0x0F
              index++
            }
            this.sdp_x = P1
            this.sdp_y = P2
            break
          }else if(this.pes[last] === CSI.ACPS){
            let index = begin + 1
            let P1 = 0, P2 = 0
            while (this.pes[index] != 0x3B){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            index++
            while(this.pes[index] != 0x20){
              P2 *= 10
              P2 += this.pes[index] & 0x0F
              index++
            }
            this.move_absolute_dot(P1, P2)
            break
          }else if(this.pes[last] === CSI.TCC){
            break
          }else if(this.pes[last] === CSI.ORN){
            const P1 = this.pes[begin + 1]
            if (P1 == 0x30) {
              this.orn = null
            }else if(P1 == 0x31){
              const P2 = (this.pes[begin + 3] & 0x0F) * 10 + (this.pes[begin + 4] & 0x0F)
              const P3 = (this.pes[begin + 5] & 0x0F) * 10 + (this.pes[begin + 6] & 0x0F)
              this.orn = pallets[P2][P3]
            }
            break
          }else if(this.pes[last] === CSI.MDF){
            break
          }else if(this.pes[last] === CSI.CFS){
            break
          }else if(this.pes[last] === CSI.XCS){
            break
          }else if(this.pes[last] === CSI.SCR){
            break
          }else if(this.pes[last] === CSI.PRA){
            break
          }else if(this.pes[last] === CSI.ACS){
            break
          }else if(this.pes[last] === CSI.UED){
            break
          }else if(this.pes[last] === CSI.RCS){
            break
          }else if(this.pes[last] === CSI.SCS){
            break
          }

          last += 1
        }
        begin = last + 1
      } else if (this.pes[begin] === JIS8.TIME) {
        if(this.pes[begin + 1] == 0x20){
          const P2 = this.pes[begin + 2] & 0x3F
          this.timeElapsed = P2 / 10
          begin += 3
        }else if(this.pes[begin + 1] == 0x28){
          return
        }else{
          return
        }
      }
    }
  }

  private parseDRCS(bytes: number, begin: number, end: number){
    const NumberOfCode = this.pes[begin + 0]
    begin += 1
    while (begin < end){
      const CharacterCode = (this.pes[begin + 0] << 8) | this.pes[begin + 1]
      const NumberOfFont = this.pes[begin + 2]

      begin += 3
      for(let font = 0; font < NumberOfFont; font++){
        const fontId = (this.pes[begin + 0] & 0xF0) >> 4
        const mode = (this.pes[begin + 0] & 0x0F)
        if (mode === 0 || mode === 1){
          const depth = this.pes[begin + 1] + 2
          const width = this.pes[begin + 2]
          const height = this.pes[begin + 3]
          const depth_bits = depth.toString(2).length - depth.toString(2).replace(/0*$/, '').length
          const length = Math.floor(width * height * depth_bits / 8)
          const drcs = this.pes.slice(begin + 4, begin + 4 + length)

          if(bytes === 1){
            const index = ((CharacterCode & 0x0F00) >> 8) + 0x40
            const ch = (CharacterCode & 0x00FF) & 0x7F
            const alphabet = G_DRCS_BY_F.get(index)?.alphabet
            if(alphabet){
              this.DRCS_mapping.get(alphabet)?.set(ch, drcs)
            }
          }else{
            const ch = CharacterCode & 0x7F7F
            this.DRCS_mapping.get(ALPHABETS.DRCS_0)?.set(ch, drcs)
          }

          begin += 4 + length
        }
      }
    }
  }

  private renderCharacter(key: number, entry: ALPHABET_ENTRY) {
    if (entry.alphabet === ALPHABETS.KANJI) {
      const ch1 = ((key & 0xFF00) >> 8) - 0x21
      const ch2 = ((key & 0x00FF) >> 0) - 0x21
      const index = ch1 * (0x7E - 0x21 + 1) + ch2
      const character = KANJI_MAPPING[index]

      if(!this.fg_canvas){
        this.fg_canvas = document.createElement('canvas')
        this.fg_canvas.width = this.swf_x
        this.fg_canvas.height = this.swf_y
      }
      if(!this.bg_canvas){
        this.bg_canvas = document.createElement('canvas')
        this.bg_canvas.width = this.swf_x
        this.bg_canvas.height = this.swf_y
      }

      const font_canvas = this.renderFont(character)
      const fg_ctx = this.fg_canvas.getContext('2d')
      if(!fg_ctx){
        return
      }
      fg_ctx.drawImage(
        font_canvas,
        0, 0, font_canvas.width, font_canvas.height,
        this.position_x, this.position_y - this.height(), this.width(), this.height()
      )

      //HLC
      if(this.hlc & 0b0001){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 2, this.width(), 1)
      }
      if(this.hlc & 0b0010){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x + this.width() - 2, this.position_y, 1, this.height())
      }
      if(this.hlc & 0b0100){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), 1)
      }
      if(this.hlc & 0b1000){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y, 1, this.height())
      }

      // STL
      if(this.stl){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 1, this.width(), 1)
      }

      const bg_ctx = this.bg_canvas.getContext('2d')
      if(!bg_ctx){
        return
      }
      bg_ctx.fillStyle = this.bg_color
      bg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), this.height())

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.ASCII) {
      const index = key - 0x21
      const character = ASCII_MAPPING[index]

      if(!this.fg_canvas){
        this.fg_canvas = document.createElement('canvas')
        this.fg_canvas.width = this.swf_x
        this.fg_canvas.height = this.swf_y
      }
      if(!this.bg_canvas){
        this.bg_canvas = document.createElement('canvas')
        this.bg_canvas.width = this.swf_x
        this.bg_canvas.height = this.swf_y
      }

      const font_canvas = this.renderFont(character)
      const fg_ctx = this.fg_canvas.getContext('2d')
      if(!fg_ctx){
        return
      }
      fg_ctx.drawImage(
        font_canvas,
        0, 0, font_canvas.width, font_canvas.height,
        this.position_x, this.position_y - this.height(), this.width(), this.height()
      )

      //HLC
      if(this.hlc & 0b0001){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 2, this.width(), 1)
      }
      if(this.hlc & 0b0010){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x + this.width() - 2, this.position_y, 1, this.height())
      }
      if(this.hlc & 0b0100){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), 1)
      }
      if(this.hlc & 0b1000){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y, 1, this.height())
      }

      // STL
      if(this.stl){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 1, this.width(), 1)
      }

      const bg_ctx = this.bg_canvas.getContext('2d')
      if(!bg_ctx){
        return
      }
      bg_ctx.fillStyle = this.bg_color
      bg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), this.height())

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.HIRAGANA) {
      const index = key - 0x21
      const character = HIRAGANA_MAPPING[index]

      if(!this.fg_canvas){
        this.fg_canvas = document.createElement('canvas')
        this.fg_canvas.width = this.swf_x
        this.fg_canvas.height = this.swf_y
      }
      if(!this.bg_canvas){
        this.bg_canvas = document.createElement('canvas')
        this.bg_canvas.width = this.swf_x
        this.bg_canvas.height = this.swf_y
      }

      const font_canvas = this.renderFont(character)
      const fg_ctx = this.fg_canvas.getContext('2d')
      if(!fg_ctx){
        return
      }
      fg_ctx.drawImage(
        font_canvas,
        0, 0, font_canvas.width, font_canvas.height,
        this.position_x, this.position_y - this.height(), this.width(), this.height()
      )

      //HLC
      if(this.hlc & 0b0001){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 2, this.width(), 1)
      }
      if(this.hlc & 0b0010){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x + this.width() - 2, this.position_y, 1, this.height())
      }
      if(this.hlc & 0b0100){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), 1)
      }
      if(this.hlc & 0b1000){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y, 1, this.height())
      }

      // STL
      if(this.stl){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 1, this.width(), 1)
      }

      const bg_ctx = this.bg_canvas.getContext('2d')
      if(!bg_ctx){
        return
      }
      bg_ctx.fillStyle = this.bg_color
      bg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), this.height())

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.KATAKANA) {
      const index = key - 0x21
      const character = KATAKANA_MAPPING[index]

      if(!this.fg_canvas){
        this.fg_canvas = document.createElement('canvas')
        this.fg_canvas.width = this.swf_x
        this.fg_canvas.height = this.swf_y
      }
      if(!this.bg_canvas){
        this.bg_canvas = document.createElement('canvas')
        this.bg_canvas.width = this.swf_x
        this.bg_canvas.height = this.swf_y
      }

      const font_canvas = this.renderFont(character)
      const fg_ctx = this.fg_canvas.getContext('2d')
      if(!fg_ctx){
        return
      }
      fg_ctx.drawImage(
        font_canvas,
        0, 0, font_canvas.width, font_canvas.height,
        this.position_x, this.position_y - this.height(), this.width(), this.height()
      )

      //HLC
      if(this.hlc & 0b0001){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 2, this.width(), 1)
      }
      if(this.hlc & 0b0010){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x + this.width() - 2, this.position_y, 1, this.height())
      }
      if(this.hlc & 0b0100){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), 1)
      }
      if(this.hlc & 0b1000){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y, 1, this.height())
      }

      // STL
      if(this.stl){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 1, this.width(), 1)
      }

      const bg_ctx = this.bg_canvas.getContext('2d')
      if(!bg_ctx){
        return
      }
      bg_ctx.fillStyle = this.bg_color
      bg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), this.height())

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.MACRO) {
      if (key === 0x60){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI),
          G_SET_BY_ALPHABET.get(ALPHABETS.ASCII),
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x61){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI),
          G_SET_BY_ALPHABET.get(ALPHABETS.KATAKANA),
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x62){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_1),
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x63){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_A),
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_C),
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_D),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x64){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_A),
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_B),
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_D),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x65){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_A),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_1),
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_D),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x66){
        this.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_1),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_2),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_3),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x67){
        this.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_4),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_5),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_6),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x68){
        this.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_7),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_8),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_9),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x69){
        this.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_10),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_11),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_12),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x6a){
        this.G_BACK = [
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_13),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_14),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_15),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x6b){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_2),
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x6c){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_3),
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x6d){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KANJI),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_4),
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x6e){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.KATAKANA),
          G_SET_BY_ALPHABET.get(ALPHABETS.HIRAGANA),
          G_SET_BY_ALPHABET.get(ALPHABETS.ASCII),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }else if(key === 0x6f){
        this.G_BACK = [
          G_SET_BY_ALPHABET.get(ALPHABETS.ASCII),
          G_SET_BY_ALPHABET.get(ALPHABETS.MOSAIC_A),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.DRCS_1),
          G_DRCS_BY_ALPHABET.get(ALPHABETS.MACRO),
        ]
        this.GL = 0
        this.GR = 2
      }
    }else { // DRCS
      if(!this.fg_canvas){
        this.fg_canvas = document.createElement('canvas')
        this.fg_canvas.width = this.swf_x
        this.fg_canvas.height = this.swf_y
      }
      if(!this.bg_canvas){
        this.bg_canvas = document.createElement('canvas')
        this.bg_canvas.width = this.swf_x
        this.bg_canvas.height = this.swf_y
      }

      const drcs = this.DRCS_mapping.get(entry.alphabet)?.get(key & 0x7F7F)
      if(!drcs){
        return
      }

      const fg_ctx = this.fg_canvas.getContext('2d')
      if(!fg_ctx){
        return
      }
      const width = Math.floor(this.ssm_x * this.text_size_x)
      const height = Math.floor(this.ssm_y * this.text_size_y)
      const depth = Math.floor((drcs.length * 8) / (width * height))
      if(this.orn){
        fg_ctx.fillStyle = this.orn
        for(let dy = -1; dy <= 1; dy++){
          for(let dx = -1; dx <= 1; dx++){
            for(let y = 0; y < height; y++){
              for(let x = 0; x < width; x++){
                let value = 0
                for(let d = 0; d < depth; d++){
                  const byte = Math.floor(((((y * width) + x) * depth) + d) / 8)
                  const index = 7 - (((((y * width) + x) * depth) + d) % 8)
                  value *= 2
                  value += drcs[byte] & (1 << index) >> index
                }

                if(value > 0){
                  fg_ctx.fillRect(
                    this.position_x -             0 + Math.floor(this.shs * this.text_size_x / 2) + x + dx,
                    this.position_y - this.height() + Math.floor(this.svs * this.text_size_y / 2) + y + dy,
                    1,
                    1,
                  )
                }
              }
            }
          }
        }
      }

      fg_ctx.fillStyle = this.fg_color
      for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
          let value = 0
          for(let d = 0; d < depth; d++){
            const byte = Math.floor(((((y * width) + x) * depth) + d) / 8)
            const index = 7 - (((((y * width) + x) * depth) + d) % 8)
            value *= 2
            value += ((drcs[byte] & (1 << index)) >> index)
          }

          if(value > 0){
            fg_ctx.fillRect(
              this.position_x -             0 + Math.floor(this.shs * this.text_size_x / 2) + x,
              this.position_y - this.height() + Math.floor(this.svs * this.text_size_y / 2) + y,
              1,
              1,
            )
          }
        }
      }

      //HLC
      if(this.hlc & 0b0001){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 1, this.width(), 1)
      }
      if(this.hlc & 0b0010){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x + width - 1, this.position_y - this.height(), 1, this.height())
      }
      if(this.hlc & 0b0100){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - this.height() + 1, this.width(), 1)
      }
      if(this.hlc & 0b1000){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - this.height(), 1, this.height())
      }

      // STL
      if(this.stl){
        fg_ctx.fillStyle = this.fg_color
        fg_ctx.fillRect(this.position_x, this.position_y - 1, this.width(), 1)
      }

      const bg_ctx = this.bg_canvas.getContext('2d')
      if(!bg_ctx){
        return
      }
      bg_ctx.fillStyle = this.bg_color
      bg_ctx.fillRect(this.position_x, this.position_y - this.height(), this.width(), this.height())
    }
  }

  private renderFont(character: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = this.shs + this.ssm_x
    canvas.height = this.svs + this.ssm_y

    const ctx = canvas.getContext('2d')
    if(!ctx){
      return canvas
    }

    if(this.orn){
      for(let dy = -1; dy <= 1; dy++) {
        for(let dx = -1; dx <= 1; dx++) {
          ctx.font = `${this.ssm_x}px ${ADDITIONAL_SYMBOL_SET.has(character) ? this.gaijiFont : this.normalFont}` 
          ctx.fillStyle = this.orn
          ctx.textBaseline = 'bottom'
          ctx.fillText(character, this.shs / 2 + dx, canvas.height - this.svs / 2 + dy)
        }
      }
    }

    ctx.font = `${this.ssm_x}px ${ADDITIONAL_SYMBOL_SET.has(character) ? this.gaijiFont : this.normalFont}`
    ctx.fillStyle = this.fg_color
    ctx.textBaseline = 'bottom'
    ctx.fillText(character, this.shs / 2, canvas.height - this.svs / 2)

    return canvas
  }
}

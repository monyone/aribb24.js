import { JIS8, ESC, CSI } from './constants/jis8'
import { ALPHABETS, ALPHABET_ENTRY } from './constants/jis8'
import { G_SET_BY_ALPHABET, G_SET_BY_F } from './constants/jis8'
import { G_DRCS_BY_ALPHABET, G_DRCS_BY_F } from './constants/jis8'

import pallets from './constants/color-table'

import KANJI_MAPPING from './constants/mapping/kanji'
import ADDITIONAL_SYMBOLS_PUA_MAPPING from './constants/mapping/additional-symbols-pua'
import ADDITIONAL_SYMBOLS_UNICODE_MAPPING from './constants/mapping/additional-symbols-unicode'
import ASCII_MAPPING from './constants/mapping/ascii'
import HIRAGANA_MAPPING from './constants/mapping/hiragana'
import KATAKANA_MAPPING from './constants/mapping/katakana'

import DRCS_NSZ_MAPPING from './constants/mapping/drcs-NSZ'

import ADDITIONAL_SYMBOLS_SET from './constants/mapping/additional-symbols-set'
import { PathElement } from './constants/mapping/additional-symbols-glyph'

import CRC16 from './utils/crc16-ccitt'
import MD5 from './utils/md5'

const SIZE_MAGNIFICATION = 2; // 奇数の height 時に SSZ で改行を行う場合があるため、全体をN倍して半分サイズに備える
let EMBEDDED_GLYPH: Map<string, PathElement> | null = null;

type Region = {
  text_type: 'NSZ' | 'MSZ' | 'SSZ',
  ox: number,
  oy: number,
  ex: number,
  ey: number,
  bg_color: string,
  content: HTMLSpanElement,
  length: number
  used: boolean
  font?: string,
}

interface ProviderOption {
  svg?: SVGElement,
  data_identifier?: number,
  data_group_id?: number,
  forceStrokeColor?: string,
  forceBackgroundColor?: string,
  normalFont?: string,
  gaijiFont?: string,
  drcsReplacement?: boolean,
  drcsReplaceMapping?: Record<string, string>,
  keepAspectRatio?: boolean,
  usePUA?: boolean,
}

interface ProviderResult {
  startTime: number,
  endTime: number,
  PRA: number | null
}


export default class CanvasProvider {
  private pes: Uint8Array
  private svg: SVGElement | null = null

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

  private swf_x: number = 960 * SIZE_MAGNIFICATION
  private swf_y: number = 540 * SIZE_MAGNIFICATION
  private sdf_x: number = 960 * SIZE_MAGNIFICATION
  private sdf_y: number = 540 * SIZE_MAGNIFICATION
  private sdp_x: number = 0   * SIZE_MAGNIFICATION
  private sdp_y: number = 0   * SIZE_MAGNIFICATION
  private ssm_x: number = 36  * SIZE_MAGNIFICATION
  private ssm_y: number = 36  * SIZE_MAGNIFICATION
  private shs: number = 4  * SIZE_MAGNIFICATION
  private svs: number = 24 * SIZE_MAGNIFICATION
  private text_size_x: number = 1
  private text_size_y: number = 1
  private text_type: 'NSZ' | 'MSZ' | 'SSZ' = 'NSZ'
  private position_x: number = -1
  private position_y: number = -1

  private pallet: number = 0
  private fg_color: string = pallets[this.pallet][7]
  private bg_color: string = pallets[this.pallet][8]
  private force_bg_color: string | null = null;

  private hlc: number = 0
  private prev_hlc: number = 0
  private stl: boolean = false
  private orn: string | null = null
  private force_orn: string | null = null
  private flc: number = 15

  private regions: Region[] = []
  private style_changed = true

  private startTime: number
  private timeElapsed: number = 0
  private endTime: number | null = null
  private PRA: number | null = null

  private normalFont: string = 'monospace'
  private gaijiFont: string = this.normalFont

  private drcsReplacement: boolean = false
  private drcsReplaceMapping: Map<string, string> = new Map<string, string>();

  private usePUA: boolean = false

  public constructor(pes: Uint8Array, pts: number) {
    this.pes = pes
    this.startTime = pts
  }

  public static setEmbeddedGlyph(embeded: Map<string, PathElement>): void {
    EMBEDDED_GLYPH = embeded;
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
      this.style_changed = true
      y++
    }
    while (y > 0){
      this.position_y += this.height()
      this.style_changed = true
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

  public static detect(pes: Uint8Array , option?: ProviderOption): boolean {
    const purpose_data_identifier = option?.data_identifier ?? 0x80; // default: caption
    const purpose_data_group_id = option?.data_group_id ?? 0x01; // default: 1st language

    if (pes.length <= 0) { return false; }  
    const data_identifier = pes[0];
    if(data_identifier !== purpose_data_identifier){
      return false;
    }

    if (pes.length <= 2) { return false; }
    const PES_data_packet_header_length = pes[2] & 0x0F;
    const data_group_begin = (3 + PES_data_packet_header_length);
    if (pes.length <= data_group_begin) { return false; }
    const data_group_id = (pes[data_group_begin + 0] & 0xFC) >> 2;

    if ((data_group_id & 0x0F) !== purpose_data_group_id) {
      return false
    }

    if (CRC16(pes, data_group_begin) !== 0) {
      //return false; // CRCチェックに失敗する事があるため無効
      return true;
    } else {
      return true;
    }
  }

  public render(option?: ProviderOption): ProviderResult | null {
    this.svg = option?.svg ?? null
    // その他オプション類
    this.force_orn = CanvasProvider.getRGBAColorCode(option?.forceStrokeColor) ?? null
    this.force_bg_color = CanvasProvider.getRGBAColorCode(option?.forceBackgroundColor) ?? null
    this.normalFont = option?.normalFont ?? this.normalFont
    this.gaijiFont = option?.gaijiFont ?? this.normalFont
    this.drcsReplacement = option?.drcsReplacement ?? false

    // IE11 では以下は動かない...
    // this.drcsReplaceMapping = new Map<string, string>([... DRCS_NSZ_MAPPING, ... Object.entries(option?.drcsReplaceMapping ?? {})])
    this.drcsReplaceMapping = new Map<string, string>(DRCS_NSZ_MAPPING);
    {
      const entries = Object.entries(option?.drcsReplaceMapping ?? {})
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        this.drcsReplaceMapping.set(entry[0], entry[1]);
      }
    }

    this.usePUA = option?.usePUA ?? false
    // その他オプション類終わり

    if (!CanvasProvider.detect(this.pes, option)) {
      return null;
    }

    const PES_data_packet_header_length = this.pes[2] & 0x0F
    const data_group_begin = (3 + PES_data_packet_header_length)
    const data_group_id = (this.pes[data_group_begin + 0] & 0xFC) >> 2
    const data_group_size = (this.pes[data_group_begin + 3] << 8) + this.pes[data_group_begin + 4]

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

    if (this.svg) {
      while (this.svg.firstChild) {
        this.svg.removeChild(this.svg.firstChild);
      }

      this.svg.setAttribute('viewBox', `0 0 ${this.swf_x} ${this.swf_y}`)

      {
        const foreign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        const style = document.createElement('style')

        style.textContent  = ''
        style.textContent += `@keyframes flc-0 { from { opacity: 0; } to { opacity: 1; } }`
        style.textContent += `@keyframes flc-7 { from { opacity: 1; } to { opacity: 0; } }`

        foreign.appendChild(style)
        this.svg.appendChild(foreign)
      }

      const small = this.regions.filter((region) => region.text_type === 'SSZ');
      small.sort((r1, r2) => {
        if (r1.oy !== r2.oy) { return r1.oy - r2.oy }
        if (r1.ox !== r2.ox) { return r1.ox - r2.ox }
        return 0
      })
      const combine: Region[] = []
      for (const upper of small) {
        if (!upper.used) { continue; }
        for (const lower of small) {
          if (!lower.used) { continue; }
          if (upper.ey === lower.oy && upper.ox === lower.ox && upper.ex === lower.ex) {
            upper.used = false
            lower.used = false

            upper.content.style.transform = `scale(0.5)`
            lower.content.style.marginRight = `-${(upper.ex - upper.ox)}px`
            upper.content.style.marginBottom = `-${(upper.ey - upper.oy)}px`
            lower.content.style.transform = `scale(0.5)`
            lower.content.style.marginRight = `-${(lower.ex - lower.ox)}px`
            lower.content.style.marginBottom = `-${(lower.ey - lower.oy)}px`

            const combineElement = document.createElement('div')
            combineElement.style.display = 'inline-flex'
            combineElement.style.flexDirection = 'column'
            combineElement.appendChild(upper.content)
            combineElement.appendChild(lower.content)
            combine.push({
              text_type: 'NSZ',
              ox: upper.ox,
              oy: upper.oy,
              ex: lower.ex,
              ey: lower.ey,
              bg_color: upper.bg_color,
              content: combineElement,
              length: 1,
              used: true
            })
          }
        }
      }
      for (const left of small) {
        if (!left.used) { continue; }
        for (const right of small) {
          if (!right.used) { continue; }
          if (left.oy == right.oy && left.ex === right.ox) {
            right.used = false

            while(right.content.firstChild) {
              const moveElement = right.content.firstChild
              right.content.removeChild(moveElement)
              left.content.appendChild(moveElement)
              left.length += 1
            }
          }
        }
      }

      this.regions = this.regions.filter((region) => { return region.used }).concat(small)
      this.regions.sort((r1, r2) => {
        if (r1.oy !== r2.oy) { return r1.oy - r2.oy }
        if (r1.ox !== r2.ox) { return r1.ox - r2.ox }
        return 0
      })

      this.regions.forEach((region) => {
        if (region.text_type === 'MSZ') {
          region.content.style.transform = `scaleX(0.5)`
          region.content.style.transformOrigin = `0 0`
          region.content.style.marginRight= `-${(region.ex - region.ox)}px`
        } else if(region.text_type === 'SSZ') {
          region.content.style.transform = `scale(0.5)`
          region.content.style.transformOrigin = `0 0`
          region.content.style.marginRight= `-${(region.ex - region.ox)}px`
          region.content.style.marginBottom= `-${(region.ey - region.oy)}px`
        }
      })

      let previous: Region | null = null
      let root: HTMLDivElement | null = null
      let line: HTMLDivElement | null = null
      let bg: HTMLSpanElement | null = null
      let foreign: SVGForeignObjectElement | null = null;
      let height: number = 0;

      for (const region of this.regions) {
        if (!previous || (previous.oy !== region.oy && previous.ey !== region.oy)) {
          if (foreign) {
            foreign.setAttribute('height', `${height}`)
          }

          foreign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
          foreign.setAttribute('x', `${0}`)
          foreign.setAttribute('y', `${region.oy}`)
          foreign.setAttribute('width', `${this.swf_x}`)
          foreign.setAttribute('font-size', `${this.ssm_x}`)
          foreign.setAttribute('letter-spacing', `${this.shs}`)
          foreign.style.lineHeight = `${this.height()}px`

          root = document.createElement('div')
          root.style.display = 'flex'
          root.style.flexWrap = 'nowrap'
          root.style.flexDirection = 'column'
          root.style.willChange = 'transform'

          line = document.createElement('div')
          line.style.display = 'flex'
          line.style.flex = 'none'
          line.style.flexWrap = 'nowrap'
          line.style.flexDirection = 'row'
          line.style.height = `${region.ey - region.oy}px`

          const span = document.createElement('span')
          span.style.width = `${region.ox}px`
          span.style.height = `${region.ex - region.oy}px`
          span.style.flex = 'none'

          bg = document.createElement('span')
          bg.style.backgroundColor = `${region.bg_color}`
          bg.style.display = 'inline-flex'
          bg.style.flex = 'none'
          bg.style.flexWrap = 'nowrap'
          bg.style.flexDirection = 'row'
          bg.style.height = `${region.ey - region.oy}px`

          line.appendChild(span)
          line.appendChild(bg)
          root.appendChild(line)
          foreign.appendChild(root)
          this.svg.appendChild(foreign)

          height = region.ey - region.oy
        } else if (previous.ey === region.oy) {
          line = document.createElement('div')
          line.style.display = 'flex'
          line.style.flex = 'none'
          line.style.flexWrap = 'nowrap'
          line.style.flexDirection = 'row'
          line.style.height = `${region.ey - region.oy}px`

          bg = document.createElement('span')
          bg.style.backgroundColor = `${region.bg_color}`
          bg.style.whiteSpace = `pre-line`
          bg.style.display = 'inline-flex'
          bg.style.flex = 'none'
          bg.style.flexWrap = 'nowrap'
          bg.style.flexDirection = 'row'
          bg.style.height = `${region.ey - region.oy}px`

          const span = document.createElement('span')
          span.style.width = `${region.ox}px`
          span.style.height = `${region.ex - region.oy}px`
          span.style.flex = 'none'

          line.appendChild(span)
          line.appendChild(bg)
          root!.appendChild(line)

          height += region.ey - region.oy
        } else if(previous.ex !== region.ox) {
          bg = document.createElement('span')
          bg.style.backgroundColor = `${region.bg_color}`
          bg.style.whiteSpace = `pre-line`
          bg.style.display = 'inline-flex'
          bg.style.flex = 'none'
          bg.style.flexWrap = 'nowrap'
          bg.style.flexDirection = 'row'
          bg.style.height = `${region.ey - region.oy}px`

          const span = document.createElement('span')
          span.style.width = `${region.ox - previous.ex}px`
          span.style.height = `${region.ex - region.oy}px`
          span.style.flex = 'none'

          line!.appendChild(span)
          line!.appendChild(bg)
          root!.appendChild(line!)
        } else if (previous.bg_color !== region.bg_color) {
          bg = document.createElement('span')
          bg.style.backgroundColor = `${region.bg_color}`
          bg.style.whiteSpace = `pre-line`
          bg.style.display = 'inline-flex'
          bg.style.flex = 'none'
          bg.style.flexWrap = 'nowrap'
          bg.style.flexDirection = 'row'
          bg.style.whiteSpace = `pre-line`
          bg.style.height = `${region.ey - region.oy}px`

          line!.appendChild(bg)
        }

        bg!.appendChild(region.content);
        previous = region
      }

      if (foreign) {
        foreign.setAttribute('height', `${height}`)
      }
    }

    return ({
      startTime: this.startTime,
      endTime: this.endTime ?? Number.POSITIVE_INFINITY,
      PRA: this.PRA
    })
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
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.APF) {
        this.move_relative_pos(1, 0)
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.APD) {
        this.move_relative_pos(0, 1)
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.APU) {
        this.move_relative_pos(0, -1)
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.CS) {
        if(this.startTime != null && this.timeElapsed > 0){
          this.endTime = this.startTime + this.timeElapsed
        }
        begin += 1
      } else if (this.pes[begin] === JIS8.APR) {
        this.move_newline()
        this.style_changed = true
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
        this.style_changed = true
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
        this.style_changed = true
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
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.RDF) {
        this.fg_color = pallets[this.pallet][1]
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.GRF) {
        this.fg_color = pallets[this.pallet][2]
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.YLF) {
        this.fg_color = pallets[this.pallet][3]
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.BLF) {
        this.fg_color = pallets[this.pallet][4]
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.MGF) {
        this.fg_color = pallets[this.pallet][5]
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.CNF) {
        this.fg_color = pallets[this.pallet][6]
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.WHF) {
        this.fg_color = pallets[this.pallet][7]
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.SSZ) {
        this.text_size_x = 0.5
        this.text_size_y = 0.5
        this.text_type = 'SSZ'
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.MSZ) {
        this.text_size_x = 0.5
        this.text_size_y = 1
        this.text_type = 'MSZ'
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.NSZ) {
        this.text_size_x = 1
        this.text_size_y = 1
        this.text_type = 'NSZ'
        this.style_changed = true
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
            this.style_changed = true
          }else if((P1 & 0x70) == 0x50){
            this.bg_color = pallets[this.pallet][color]
            this.style_changed = true
          }else{
            // other
          }
          begin += 2
        }
      } else if (this.pes[begin] === JIS8.FLC) {
        const index = this.pes[begin] & 0x0F;
        this.flc = index
        this.style_changed = true
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
        this.prev_hlc = this.hlc
        this.hlc = this.pes[begin + 1] & 0x0F
        if (this.prev_hlc === 0 && this.hlc !== 0 || this.prev_hlc !== 0 && this.hlc === 0) {
          this.style_changed = true
        }
        begin += 2
      } else if (this.pes[begin] === JIS8.RPC) {
        return
      } else if (this.pes[begin] === JIS8.SPL) {
        this.stl = false
        this.style_changed = true
        begin += 1
      } else if (this.pes[begin] === JIS8.STL) {
        this.stl = true
        this.style_changed = true
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
              this.swf_x = 1920 * SIZE_MAGNIFICATION
              this.swf_y = 1080 * SIZE_MAGNIFICATION
              this.style_changed = true
            }else if(P1 === 7){
              this.swf_x = 960 * SIZE_MAGNIFICATION
              this.swf_y = 540 * SIZE_MAGNIFICATION
              this.style_changed = true
            }else if(P1 == 9){
              this.swf_x = 720 * SIZE_MAGNIFICATION
              this.swf_y = 480 * SIZE_MAGNIFICATION
              this.style_changed = true
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
            this.sdf_x = P1 * SIZE_MAGNIFICATION
            this.sdf_y = P2 * SIZE_MAGNIFICATION
            this.style_changed = true
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
            this.ssm_x = P1 * SIZE_MAGNIFICATION
            this.ssm_y = P2 * SIZE_MAGNIFICATION
            this.style_changed = true
            break
          }else if(this.pes[last] === CSI.SHS){
            let index = begin + 1
            let P1 = 0
            while (this.pes[index] != 0x20){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            this.shs = P1 * SIZE_MAGNIFICATION
            this.style_changed = true
            break
          }else if(this.pes[last] === CSI.SVS){
            let index = begin + 1
            let P1 = 0
            while (this.pes[index] != 0x20){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            this.svs = P1 * SIZE_MAGNIFICATION
            this.style_changed = true
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
            this.sdp_x = P1 * SIZE_MAGNIFICATION
            this.sdp_y = P2 * SIZE_MAGNIFICATION
            this.style_changed = true
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
            this.move_absolute_dot(P1 * SIZE_MAGNIFICATION, P2 * SIZE_MAGNIFICATION)
            this.style_changed = true
            break
          }else if(this.pes[last] === CSI.TCC){
            break
          }else if(this.pes[last] === CSI.ORN){
            const P1 = this.pes[begin + 1]
            if (P1 == 0x30) {
              this.orn = null
              this.style_changed = true
            }else if(P1 == 0x31){
              const P2 = (this.pes[begin + 3] & 0x0F) * 10 + (this.pes[begin + 4] & 0x0F)
              const P3 = (this.pes[begin + 5] & 0x0F) * 10 + (this.pes[begin + 6] & 0x0F)
              this.orn = pallets[P2][P3]
              this.style_changed = true
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
            let index = begin + 1
            let P1 = 0
            while (this.pes[index] != 0x20){
              P1 *= 10
              P1 += this.pes[index] & 0x0F
              index++
            }
            this.PRA = P1
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
          this.timeElapsed += P2 / 10
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
          const drcs = new Uint8Array(Array.prototype.slice.call(this.pes, begin + 4, begin + 4 + length)) // for IE11

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
    if (this.position_x < 0 || this.position_y < 0){
      this.move_absolute_pos(0, 0)
    }

    if (entry.alphabet === ALPHABETS.KANJI) {
      const ch1 = ((key & 0xFF00) >> 8) - 0x21
      const ch2 = ((key & 0x00FF) >> 0) - 0x21
      const index = ch1 * (0x7E - 0x21 + 1) + ch2

      const additional_symbol = ((0x75 - 0x21) * (0x7E - 0x21 + 1)) + 0
      if (index < additional_symbol) {
        const character = KANJI_MAPPING[index]
        this.renderFont(character)
      } else {
        if (this.usePUA) {
          const character = ADDITIONAL_SYMBOLS_PUA_MAPPING[index - additional_symbol]
          this.renderFont(character)
        } else {
          const character = ADDITIONAL_SYMBOLS_UNICODE_MAPPING[index - additional_symbol]
          this.renderFont(character)
        }
      }

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.ASCII) {
      const index = key - 0x21
      const character = ASCII_MAPPING[index]

      this.renderFont(character)

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.HIRAGANA) {
      const index = key - 0x21
      const character = HIRAGANA_MAPPING[index]

      this.renderFont(character)

      this.move_relative_pos(1, 0)
    }else if(entry.alphabet === ALPHABETS.KATAKANA) {
      const index = key - 0x21
      const character = KATAKANA_MAPPING[index]

      this.renderFont(character)

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

      return
    }else { // DRCS
      const drcs = this.DRCS_mapping.get(entry.alphabet)?.get(key & 0x7F7F)
      if(!drcs){
        return
      }

      const drcs_hash = MD5(drcs.buffer)
      if (this.drcsReplacement && this.drcsReplaceMapping.has(drcs_hash.toLowerCase())) {
        this.renderFont(this.drcsReplaceMapping.get(drcs_hash.toLowerCase())!)
      } else  if (this.drcsReplacement && this.drcsReplaceMapping.has(drcs_hash.toUpperCase())) {
        this.renderFont(this.drcsReplaceMapping.get(drcs_hash.toUpperCase())!)
      } else {
        const span = document.createElement('span');
        span.style.display = `inline-block`
        span.style.width = `${this.ssm_x + this.shs}px`
        const canvas = document.createElement('canvas');
        const width = Math.floor(this.ssm_x / SIZE_MAGNIFICATION)
        const height = Math.floor(this.ssm_y / SIZE_MAGNIFICATION)
        const depth = Math.floor((drcs.length * 8) / (width * height))

        canvas.width = width + 4 + Math.floor(this.shs / 2 / SIZE_MAGNIFICATION)
        canvas.height = height + 4 + Math.floor(this.svs / 2 / SIZE_MAGNIFICATION)
        canvas.style.width =  `${this.ssm_x + 4 * SIZE_MAGNIFICATION + Math.floor(this.shs / 2)}px`
        canvas.style.height = `${this.ssm_y + 4 * SIZE_MAGNIFICATION + Math.floor(this.svs / 2)}px`
        canvas.style.verticalAlign = `top`

        const ctx = canvas.getContext('2d')
        if (!ctx) { return; }

        if (this.style_changed || this.text_type === 'SSZ') {
          const content = document.createElement('span');
          content.style.color = CanvasProvider.getRGBAfromColorCode(this.fg_color)
          content.style.fontSize = `inherit`
          content.style.letterSpacing = `inherit`
          content.style.lineHeight = `inherit`
          content.style.marginLeft = `-2px`
          content.style.marginTop = `-2px`

          // FIXME: it too wrong
          if (this.hlc !== 0) {
            content.style.border = `1px solid ${CanvasProvider.getRGBAfromColorCode(this.fg_color)}`
          }
          // FIXME: it too wrong
          if (this.stl) {
            content.style.textDecoration = `underline ${CanvasProvider.getRGBAfromColorCode(this.fg_color)}`
          }

          if (this.flc !== 0x0F) {
            content.style.animation = `flc-${this.flc} 1s infinite`
          }

          this.regions.push({
            text_type: this.text_type,
            ox: this.position_x,
            oy: this.position_y - this.height(),
            ex: this.position_x,
            ey: this.position_y,
            bg_color: this.force_bg_color ?? this.bg_color,
            content: content,
            length: 0,
            used: true
          });
          this.style_changed = false
        }

        const region = this.regions[this.regions.length - 1]
         
        const orn = this.force_orn ?? this.orn
        if (orn && (!this.force_orn || this.force_orn !== this.fg_color)) {
          ctx.fillStyle = CanvasProvider.getRGBAfromColorCode(orn)
          for(let dy = -2; dy <= 2; dy++){
            for(let dx = -2; dx <= 2; dx++){
              for(let y = 0; y < height; y++){
                for(let x = 0; x < width; x++){
                  let value = 0
                  for(let d = 0; d < depth; d++){
                    const byte = Math.floor(((((y * width) + x) * depth) + d) / 8)
                    const index = 7 - (((((y * width) + x) * depth) + d) % 8)
                    value *= 2
                    value += ((drcs[byte] & (1 << index)) >> index)
                  }

                  if (value > 0) {
                    ctx.fillRect(
                      2 + Math.floor(this.shs / 2 / SIZE_MAGNIFICATION) + x + dx,
                      2 + Math.floor(this.svs / 2 / SIZE_MAGNIFICATION) + y + dy,
                      1,
                      1,
                    )
                  }
                }
              }
            }
          }
        }

        ctx.fillStyle = CanvasProvider.getRGBAfromColorCode(this.fg_color)
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
              ctx.fillRect(
                2 + Math.floor(this.shs / 2 / SIZE_MAGNIFICATION) + x,
                2 + Math.floor(this.svs / 2 / SIZE_MAGNIFICATION) + y,
                1,
                1,
              )
            }
          }
        }

        span.appendChild(canvas)
        region.content.appendChild(span)
        region.ex += this.width()
        region.length += 1
      }

      this.move_relative_pos(1, 0)
    }
  }

  private renderFont(character: string): void {
    const useGaijiFont = ADDITIONAL_SYMBOLS_SET.has(character)
    const font = useGaijiFont ? this.gaijiFont : this.normalFont;

    if (this.regions[this.regions.length - 1] != null) {
      const region = this.regions[this.regions.length - 1]
      if (region.font !== font) {
        this.style_changed = true
      }
    }

    if (this.style_changed || this.text_type === 'SSZ') {
      const content = document.createElement('span');
      content.style.color = CanvasProvider.getRGBAfromColorCode(this.fg_color)
      content.style.fontSize = `inherit`
      content.style.letterSpacing = `inherit`
      content.style.lineHeight = `inherit`
      content.style.fontFamily = `${font}`

      const orn = this.force_orn ?? this.orn
      if (orn && (!this.force_orn || this.force_orn !== this.fg_color)) {
        let shadow = '', first = true
        for (let dy = -4; dy <= 4; dy++) {
          for (let dx = -4; dx <= 4; dx++) {
            if (dy === 0 && dx === 0) { continue; }
            shadow += `${!first ? ',' : ''}${dx}px ${dy}px 0 ${CanvasProvider.getRGBAfromColorCode(orn)}`
            first = false
          }
        }
        content.style.textShadow = shadow
      }
      
      // FIXME: it too wrong
      if (this.hlc !== 0) {
        content.style.border = `1px solid ${CanvasProvider.getRGBAfromColorCode(this.fg_color)}`
      }
      // FIXME: it too wrong
      if (this.stl) {
        content.style.textDecoration = `underline ${CanvasProvider.getRGBAfromColorCode(this.fg_color)}`
      }

      if (this.flc !== 0x0F) {
        content.style.animation = `flc-${this.flc} 1s infinite`
      }

      this.regions.push({
        text_type: this.text_type,
        ox: this.position_x,
        oy: this.position_y - this.height(),
        ex: this.position_x,
        ey: this.position_y,
        font: font,
        bg_color: this.force_bg_color ?? this.bg_color,
        content: content,
        length: 0,
        used: true
      });
      this.style_changed = false
    }

    const region = this.regions[this.regions.length - 1]

    if (EMBEDDED_GLYPH != null && EMBEDDED_GLYPH?.has(character)) {
      const {viewBox, path} = EMBEDDED_GLYPH.get(character)!;
      this.renderPath(viewBox, path);
      return
    }

    if (useGaijiFont) { character += '\u{fe0e}' }

    const span = document.createElement('span');
    span.style.display = `inline-block`
    span.style.width = `${this.ssm_x + this.shs}px`
    span.style.textAlign = `center`
    span.style.whiteSpace = `pre-line`
    span.textContent = character
    region.content.appendChild(span)

    region.ex += this.width()
    region.length += 1
  }

  private renderPath(viewBox: [number, number, number, number], path: string): void {
    const region = this.regions[this.regions.length - 1]

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', `${viewBox[0]} ${viewBox[1]} ${viewBox[2]} ${viewBox[3]}`)
    svg.style.verticalAlign = `text-bottom`
    svg.style.width = `${this.ssm_x + this.shs}px`
    svg.style.height = `${this.ssm_y}px`

    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    elem.setAttribute('d', path);
    elem.setAttribute('fill', `${CanvasProvider.getRGBAfromColorCode(this.fg_color)}`)

    const orn = this.force_orn ?? this.orn
    if (orn && (!this.force_orn || this.force_orn !== this.fg_color)) {
      const width = Math.max((viewBox[2] - viewBox[0]) / this.ssm_x, (viewBox[3] - viewBox[1]) / this.ssm_y) * 4
      elem.setAttribute('stroke', `${CanvasProvider.getRGBAfromColorCode(orn)}`)
      elem.setAttribute('stroke-width', `${width}`)
    } else {
      elem.setAttribute('stroke', `transparent`)
    }

    svg.appendChild(elem)
    region.content.appendChild(svg);
    region.ex += this.width()
    region.length += 1    
  }

  private static getRGBAColorCode(color: string | undefined): string | null {
    if (color == null) { return null; }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;

    const ctx = canvas.getContext('2d');
    if (!ctx) { return null; }

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const [R, G, B, A] = ctx.getImageData(0, 0, 1, 1).data

    const code = `#${R.toString(16).toUpperCase().padStart(2, '0')}${G.toString(16).toUpperCase().padStart(2, '0')}${B.toString(16).toUpperCase().padStart(2, '0')}${A.toString(16).toUpperCase().padStart(2, '0')}`

    canvas.width = canvas.height = 0;
    return code;
  }

  private static getRGBAfromColorCode(color: string | undefined): string {
    if (color == null) { return ''; }

    const R = Number.parseInt(color.substring(1, 3), 16);
    const G = Number.parseInt(color.substring(3, 5), 16);
    const B = Number.parseInt(color.substring(5, 7), 16);
    const A = Number.parseInt(color.substring(7, 9), 16);

    return `rgba(${R}, ${G}, ${B}, ${A / 255})`;
  }
}

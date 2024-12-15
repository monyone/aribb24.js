import { ARIBB24_CHARACTER_SIZE_MAP, ARIBB24ParserState } from "../../../../lib/parser/parser";
import { NotImplementedError, UnreachableError } from "../../../../util/error";
import Renderer from "../renderer";
import { HTMLFragmentRendererOption } from "./html-fragment-renderer-option";
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { shouldHalfWidth, shouldNotAssumeUseClearScreen } from "../quirk";
import { ARIBB24BrowserParser, ARIBB24BrowserToken, makeRegions, replaceDRCS } from "../../types";
import { ARIBB24RegionerToken } from "../../../../lib/parser/regioner";
import colortable from "../../../colortable";
import halfwidth from "../halfwidth";

const half = structuredClone(halfwidth);
half.set('ア', 'ｱ');
half.set('イ', 'ｲ');
half.set('ウ', 'ｳ');
half.set('エ', 'ｴ');
half.set('オ', 'ｵ');
half.set('カ', 'ｶ');
half.set('キ', 'ｷ');
half.set('ク', 'ｸ');
half.set('ケ', 'ｹ');
half.set('コ', 'ｺ');
half.set('サ', 'ｻ');
half.set('シ', 'ｼ');
half.set('ス', 'ｽ');
half.set('セ', 'ｾ');
half.set('ソ', 'ｿ');
half.set('タ', 'ﾀ');
half.set('チ', 'ﾁ');
half.set('ツ', 'ﾂ');
half.set('テ', 'ﾃ');
half.set('ト', 'ﾄ');
half.set('ナ', 'ﾅ');
half.set('ニ', 'ﾆ');
half.set('ヌ', 'ﾇ');
half.set('ネ', 'ﾈ');
half.set('ノ', 'ﾉ');
half.set('ハ', 'ﾊ');
half.set('ヒ', 'ﾋ');
half.set('フ', 'ﾌ');
half.set('ヘ', 'ﾍ');
half.set('ホ', 'ﾎ');
half.set('マ', 'ﾏ');
half.set('ミ', 'ﾐ');
half.set('ム', 'ﾑ');
half.set('メ', 'ﾒ');
half.set('モ', 'ﾓ');
half.set('ヤ', 'ﾔ');
half.set('ユ', 'ﾕ');
half.set('ヨ', 'ﾖ');
half.set('ラ', 'ﾗ');
half.set('リ', 'ﾘ');
half.set('ル', 'ﾙ');
half.set('レ', 'ﾚ');
half.set('ロ', 'ﾛ');
half.set('ワ', 'ﾜ');
half.set('ヲ', 'ｦ');
half.set('ン', 'ﾝ');
half.set('ヴ', 'ｳﾞ');
half.set('ガ', 'ｶﾞ');
half.set('ギ', 'ｷﾞ');
half.set('グ', 'ｸﾞ');
half.set('ゲ', 'ｹﾞ');
half.set('ゴ', 'ｺﾞ');
half.set('ザ', 'ｻﾞ');
half.set('ジ', 'ｼﾞ');
half.set('ズ', 'ｽﾞ');
half.set('ゼ', 'ｾﾞ');
half.set('ゾ', 'ｿﾞ');
half.set('ダ', 'ﾀﾞ');
half.set('ヂ', 'ﾁﾞ');
half.set('ヅ', 'ﾂﾞ');
half.set('デ', 'ﾃﾞ');
half.set('ド', 'ﾄﾞ');
half.set('バ', 'ﾊﾞ');
half.set('ビ', 'ﾋﾞ');
half.set('ブ', 'ﾌﾞ');
half.set('ベ', 'ﾍﾞ');
half.set('ボ', 'ﾎﾞ');
half.set('パ', 'ﾊﾟ');
half.set('ピ', 'ﾋﾟ');
half.set('プ', 'ﾌﾟ');
half.set('ペ', 'ﾍﾟ');
half.set('ポ', 'ﾎﾟ');
half.set('ァ', 'ｧ');
half.set('ィ', 'ｨ');
half.set('ゥ', 'ｩ');
half.set('ェ', 'ｪ');
half.set('ォ', 'ｫ');
half.set('ャ', 'ｬ');
half.set('ュ', 'ｭ');
half.set('ョ', 'ｮ'),
half.set('ッ', 'ｯ');
half.set('◌゙', ' ﾞ');
half.set('◌゚', ' ﾟ');

const makeTokenToHTML = (token: ARIBB24RegionerToken, info: CaptionAssociationInformation, option: HTMLFragmentRendererOption) => {
  switch (token.tag) {
    case 'Character': {
      const elem = document.createElement('div');
      elem.style.display = 'inline-block';
      if (option.color.foreground) {
        elem.style.color = colortable[token.state.foreground];
      }
      elem.textContent = (shouldHalfWidth(token.state.size, info) && half.get(token.character)) || token.character;
      return elem;
    }
    case 'DRCS': {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      return svg;
    }
    case 'Script':
      return document.createElement('span');
  }
}

export default class HTMLFragmentRenderer implements Renderer {
  private option: HTMLFragmentRendererOption;
  private element: HTMLDivElement;
  private fragment: DocumentFragment = new DocumentFragment();

  public constructor(option?: Partial<HTMLFragmentRendererOption>) {
    this.option = HTMLFragmentRendererOption.from(option);
    // Setup HTML
    this.element = document.createElement('div');
    if (this.option.color.background) {
      this.element.style.backgroundColor = this.option.color.background;
    }
  }

  public resize(width: number, height: number): void {}
  public destroy(): void {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
  }
  public clear(): void {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
  }
  public hide(): void {
    this.element.style.visibility = 'hidden';
  }
  public show(): void {
    this.element.style.visibility = 'showing';
  }

  public render(initialState: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionAssociationInformation): void {
    // if SBTVD, it is overwritten screen and insert space to erase, so CS Insert
    if (shouldNotAssumeUseClearScreen(info)) {
      this.clear();
    }

    const parser = new ARIBB24BrowserParser(initialState);
    const fragment = new DocumentFragment();

    for (const region of makeRegions(parser.parse(replaceDRCS(tokens, this.option.replace.drcs)))) {
      const div = document.createElement('div');
      div.style.display = 'inline-flex';

      for (const span of region.spans) {
        const elem = document.createElement('div');
        elem.style.display = 'inline-flex';
        switch (span.tag) {
          case 'Normal':
            for (const token of span.text) {
              elem.appendChild(makeTokenToHTML(token, info, this.option));
            }
            break;
          case 'Ruby': {
            const rt_elem = document.createElement('span');
            for (const token of span.ruby) {
              rt_elem.appendChild(makeTokenToHTML(token, info, this.option));
            }
            const rt = document.createElement('rt');
            rt.append(rt_elem);

            const tx_elem = document.createElement('span');
            for (const token of span.text) {
              tx_elem.appendChild(makeTokenToHTML(token, info, this.option));
            }
            const ruby = document.createElement('ruby');
            ruby.appendChild(tx_elem);
            ruby.appendChild(rt);

            elem.appendChild(ruby);
            break;
          }
          default:
            const exhaustive: never = span;
            throw new UnreachableError(`Undefined Region Type (${exhaustive})`);
        }

        div.appendChild(elem);
      }

      fragment.appendChild(div);
    }

    this.clear();
    this.element.appendChild(fragment);
  }

  public onAttach(_: HTMLElement): void {}
  public onDetach(): void {}
  public onContainerResize(width: number, height: number): boolean {
    return false;
  }
  public onVideoResize(width: number, height: number): boolean {
    return false;
  }

  public onPlay(): void {}
  public onPause(): void {}

  public onSeeking(): void {
    this.clear();
  }

  public getPresentationElement(): HTMLDivElement {
    return this.element;
  }
}

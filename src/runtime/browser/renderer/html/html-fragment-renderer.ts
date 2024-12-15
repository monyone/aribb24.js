import { ARIBB24_CHARACTER_SIZE_MAP, ARIBB24DRCSPrasedToken, ARIBB24Parser, ARIBB24ParserState } from "../../../../lib/parser/parser";
import { NotImplementedError, UnreachableError } from "../../../../util/error";
import Renderer from "../renderer";
import { HTMLFragmentRendererOption, PartialHTMLFragmentRendererOption } from "./html-fragment-renderer-option";
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { shouldHalfWidth, shouldNotAssumeUseClearScreen } from "../quirk";
import { ARIBB24BrowserParser, ARIBB24BrowserToken, makeRegions, replaceDRCS } from "../../types";
import { ARIBB24RegionerToken } from "../../../../lib/parser/regioner";
import colortable from "../../../colortable";
import halftext from "../halftext";

const makeTokenToHTML = (token: ARIBB24RegionerToken, info: CaptionAssociationInformation, option: HTMLFragmentRendererOption) => {
  switch (token.tag) {
    case 'Character': {
      const elem = document.createElement('div');
      elem.style.display = 'inline-block';
      elem.style.whiteSpace = 'pre';
      if (option.color.foreground) {
        elem.style.color = colortable[token.state.foreground];
      }
      if (option.color.stroke) {
        elem.style.webkitTextStroke = '0.03em black';
      }
      elem.textContent = (shouldHalfWidth(token.state.size, info) && halftext.get(token.character)) || token.character;
      return elem;
    }
    case 'DRCS': {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const { state, width, height, depth, binary } = token;
      const uint8 = new Uint8Array(binary);
      const foreground = colortable[state.foreground];
      let path = '';
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          let value = 0;
          for(let d = 0; d < depth; d++){
            const byte = Math.floor(((((dy * width) + dx) * depth) + d) / 8);
            const index = 7 - (((((dy * width) + dx) * depth) + d) % 8);
            value *= 2;
            value += ((uint8[byte] & (1 << index)) >> index);
          }

          if (value === 0) { continue; }

          path += (path === '' ? '' : ' ') + `M ${dx} ${dy} h 1 v 1 H ${dx} Z`;
        }
      }
      const fill_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      if (option.color.stroke) {
        const stroke_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        stroke_path.setAttribute('d', path);
        stroke_path.setAttribute('stroke', 'black');
        stroke_path.setAttribute('fill', 'transparent');
        stroke_path.setAttribute('stroke-width', '2');
        stroke_path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(stroke_path);
      }
      fill_path.setAttribute('shape-rendering', 'crispEdges');
      fill_path.setAttribute('d', path);
      fill_path.setAttribute('stroke', 'transparent');
      fill_path.setAttribute('fill', foreground);
      svg.appendChild(fill_path);

      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.style.width = '1em';
      svg.style.verticalAlign = 'middle';
      return svg;
    }
    case 'Script':
      const elem = document.createElement('div');
      elem.style.display = 'inline-flex';
      elem.style.fontSize = '0.5em';
      elem.style.flexDirection = 'column';
      elem.style.verticalAlign = 'top';
      elem.appendChild(makeTokenToHTML(token.sup, info, option));
      elem.appendChild(makeTokenToHTML(token.sub, info, option));
      return elem;
  }
}

export default class HTMLFragmentRenderer implements Renderer {
  private option: HTMLFragmentRendererOption;
  private element: HTMLDivElement;

  public constructor(option?: PartialHTMLFragmentRendererOption) {
    this.option = HTMLFragmentRendererOption.from(option);
    // Setup HTML
    this.element = document.createElement('div');
    if (this.option.color.background && false) {
      //this.element.style.backgroundColor = this.option.color.background;
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

    for (const region of makeRegions(parser.parse(replaceDRCS(tokens, this.option.replace.drcs)), info)) {
      const div = document.createElement('div');
      div.style.display = 'inline-block';
      if (region.highlight) {
        div.style.border = '1px solid white';
      }

      for (const span of region.spans) {
        const elem = document.createElement('div');
        elem.style.display = 'inline-block';
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

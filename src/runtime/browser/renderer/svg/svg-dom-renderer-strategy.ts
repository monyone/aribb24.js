import { ARIBB24CharacterParsedToken, ARIBB24DRCSParsedToken, ARIBB24Parser, ARIBB24ParserState } from "../../../../lib/parser/parser";
import { ARIBB24FlashingControlType } from "../../../../lib/tokenizer/token";
import colortable from "../../../common/colortable";
import halfwidth from "../halfwidth";
import namedcolor from "../../../common/namedcolor";
import { UnreachableError } from "../../../../util/error";
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { shouldHalfWidth } from "../quirk";
import useARIBFont from "../../../common/font";
import { SVGDOMRendererOption } from "./svg-dom-renderer-option";
import { ARIBB24BrowserParser, ARIBB24BrowserToken } from "../../types";

export default (target: SVGSVGElement, state: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionAssociationInformation, rendererOption: SVGDOMRendererOption): void => {
  const parser = new ARIBB24BrowserParser(state);

  const buffer: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const fg_groups: SVGGElement[] = [];
  const bitmap_groups: SVGElement[] = [];
  const bg_paths = new Map<string, string>();

  for (const token of parser.parse(tokens)) {
    target.setAttribute('viewBox', `0 0 ${token.state.plane[0]} ${token.state.plane[1]}`);
    buffer.setAttribute('viewBox', `0 0 ${token.state.area[0]} ${token.state.area[1]}`);
    buffer.setAttribute('x', `${token.state.margin[0]}`);
    buffer.setAttribute('y', `${token.state.margin[1]}`);
    buffer.setAttribute('width', `${token.state.area[0]}`);
    buffer.setAttribute('height', `${token.state.area[1]}`);

    switch (token.tag) {
      case 'Character': {
        // bg
        if (!token.non_spacing) {
          const [background, path] = retriveBackroundPathString(token, info, rendererOption);
          bg_paths.set(background, `${bg_paths.get(background) ?? ''}${bg_paths.has(background) ? ' ' : ''}${path}`);
        }
        // text
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.appendChild(retriveCharacterSVGTextElement(token, info, rendererOption));
        group.appendChild(retriveDecorationSVGPathElement(token, info, rendererOption));
        const animate = retriveFlashingAnimateElement(token, info, rendererOption);
        if (animate) { group.appendChild(animate); }
        // group
        fg_groups.push(group);
        break;
      }
      case 'DRCS': {
        // bg
        const [background, path] = retriveBackroundPathString(token, info, rendererOption);
        bg_paths.set(background, `${bg_paths.get(background) ?? ''}${bg_paths.has(background) ? ' ' : ''}${path}`);
        // DRCS
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        for (const drcs of retriveDRCSSVGPathElement(token, info, rendererOption)) {
          group.appendChild(drcs);
        }
        group.appendChild(retriveDecorationSVGPathElement(token, info, rendererOption));
        const animate = retriveFlashingAnimateElement(token, info, rendererOption);
        if (animate) { group.appendChild(animate); }
        // group
        fg_groups.push(group);
        break;
      }
      case 'Bitmap': {
        token.normal_bitmap.close();
        token.flashing_bitmap?.close();
        {
          const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          image.setAttribute('href', token.normal_dataurl);
          image.setAttribute('x', `${token.x_position}`);
          image.setAttribute('y', `${token.y_position}`);
          image.setAttribute('width', `${token.width}`);
          image.setAttribute('height', `${token.height}`);

          bitmap_groups.push(image);
        }
        if (token.flashing_dataurl != null) {
          const flcImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          flcImage.setAttribute('href', token.flashing_dataurl);
          flcImage.setAttribute('x', `${token.x_position}`);
          flcImage.setAttribute('y', `${token.y_position}`);
          flcImage.setAttribute('width', `${token.width}`);
          flcImage.setAttribute('height', `${token.height}`);

          const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
          animate.setAttribute('attributeName', 'opacity');
          animate.setAttribute('values', '1;0');
          animate.setAttribute('dur', '1s');
          animate.setAttribute('calcMode', 'discrete');
          animate.setAttribute('repeatCount', 'indefinite');
          flcImage.appendChild(animate);

          bitmap_groups.push(flcImage);
        }

        break;
      }
      case 'ClearScreen':
        if (token.time !== 0) { break; }

        while (target.firstChild) {
          target.removeChild(target.firstChild);
        }
        break;
      default:
        const exhaustive: never = token;
        throw new UnreachableError(`Unhandled ARIB Parsed Token (${exhaustive})`);
    }
  }

  // bg
  for (const [ color, path ] of bg_paths.entries()) {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bg.setAttribute('shape-rendering', 'crispEdges');
    bg.setAttribute('d', path);
    bg.setAttribute('fill', color);
    buffer.append(bg);
  }
  // text
  buffer.append(... fg_groups);
  buffer.append(... bitmap_groups);

  // Fragment append
  target.appendChild(buffer);

  // Calc textSize
  for (const text of Array.from(target.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'text'))) {
    const width = (text as SVGTextElement).getComputedTextLength()
    text.setAttribute('textLength', `${Math.min(width, Number.parseInt(text.dataset.width!, 10))}`);
    delete text.dataset.width;
    text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  }
  // Animation Start
  for (const animate of Array.from(target.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'animate'))) {
    (animate as SVGAnimateElement).beginElement();
  }
}

const retriveDecorationSVGPathElement = (token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, info: CaptionAssociationInformation, rendererOption: SVGDOMRendererOption): SVGPathElement => {
  const { state, option } = token;

  const foreground = rendererOption.color.foreground ?? colortable[state.foreground];
  const x = (state.position[0] + 0) +                           0;
  const y = (state.position[1] + 1) - ARIBB24Parser.box(state)[1];

  let path = '';

  if ((state.highlight & 0b0001) !== 0) { // bottom
    path += (path === '' ? '' : ' ') + `M ${x} ${y + ARIBB24Parser.box(state)[1] - 1 * option.magnification} h ${ARIBB24Parser.box(state)[0]} v ${option.magnification} H ${x} Z`;
  }
  if ((state.highlight & 0b0010) !== 0) { // right
    path += (path === '' ? '' : ' ') + `M ${x + ARIBB24Parser.box(state)[0] - 1 * option.magnification} ${y} h ${option.magnification} v ${ARIBB24Parser.box(state)[1]} H ${x} Z`;
  }
  if ((state.highlight & 0b0100) !== 0) { // top
    path += (path === '' ? '' : ' ') + `M ${x} ${y} h ${ARIBB24Parser.box(state)[0]} v ${option.magnification} H ${x} Z`;
  }
  if ((state.highlight & 0b1000) !== 0) { // left
    path += (path === '' ? '' : ' ') + `M ${x} ${y} h ${option.magnification} v ${ARIBB24Parser.box(state)[1]} H ${x} Z`;
  }

  if (state.underline) {
    path += (path === '' ? '' : ' ') + `M ${x} ${y + ARIBB24Parser.box(state)[1] - 1 * option.magnification} h ${ARIBB24Parser.box(state)[0]} v ${option.magnification} H ${x} Z`;
  }

  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  elem.setAttribute('shape-rendering', 'crispEdges');
  if (path !== '') {
    elem.setAttribute('d', path);
  }
  elem.setAttribute('fill', foreground);

  return elem;
}

const retriveFlashingAnimateElement = (token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, info: CaptionAssociationInformation, rendererOption: SVGDOMRendererOption): SVGAnimateElement | null => {
  const { state } = token;

  switch (state.flashing) {
    case ARIBB24FlashingControlType.STOP:
      return null;
    case ARIBB24FlashingControlType.NORMAL:
    case ARIBB24FlashingControlType.INVERTED: {
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'opacity');
      animate.setAttribute('values', state.flashing === ARIBB24FlashingControlType.NORMAL ? '1;0' : '0;1');
      animate.setAttribute('dur', '1s');
      animate.setAttribute('calcMode', 'discrete');
      animate.setAttribute('repeatCount', 'indefinite');
      return animate;
    }
    default:
      const exhaustive: never = state.flashing;
      throw new UnreachableError(`Unhandled Flasing Token (${exhaustive})`);
  }
}

const retriveBackroundPathString = (token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, info: CaptionAssociationInformation, rendererOption: SVGDOMRendererOption): [string, String] => {
  const { state } = token;
  const color = rendererOption.color.background ?? colortable[state.background];
  const origin_x = Math.floor((state.position[0] + 0) +                           0);
  const origin_y = Math.floor((state.position[1] + 1) - ARIBB24Parser.box(state)[1]);

  return [color, `M ${origin_x} ${origin_y} h ${ARIBB24Parser.box(state)[0]} v ${ARIBB24Parser.box(state)[1]} H ${origin_x} Z`];
}

const retriveCharacterSVGTextElement = (token: ARIBB24CharacterParsedToken, info: CaptionAssociationInformation, rendererOption: SVGDOMRendererOption): SVGTextElement => {
  const { state, option, character: key } = token;

  const should_halfwidth = shouldHalfWidth(state.size, info);
  const replace_halfwidth = rendererOption.replace.half && should_halfwidth;
  const has_halfwidth =  halfwidth.has(key);
  const character = replace_halfwidth && has_halfwidth ? halfwidth.get(key)! : key;

  const center_x = Math.floor((state.position[0] + 0) + ARIBB24Parser.box(state)[0] / 2);
  const center_y = Math.floor((state.position[1] + 1) - ARIBB24Parser.box(state)[1] / 2);
  const scale_x = ARIBB24Parser.scale(state)[0];
  const scale_y = ARIBB24Parser.scale(state)[1];

  const stroke = rendererOption.color.stroke != null ? (namedcolor.get(rendererOption.color.stroke) ?? rendererOption.color.stroke) : null;
  const orn = stroke ?? (state.ornament != null ? colortable[state.ornament] : null);
  const foreground = rendererOption.color.foreground ?? colortable[state.foreground];

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', `${center_x}`);
  text.setAttribute('y', `${center_y}`);
  text.setAttribute('transform', `scale(${1} ${scale_y})`);
  text.setAttribute('transform-origin', `${center_x} ${center_y}`);
  text.setAttribute('font-size', `${state.fontsize[0]}`);
  text.setAttribute('font-family', useARIBFont(character) ? rendererOption.font.arib ?? rendererOption.font.normal : rendererOption.font.normal);
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', foreground);
  text.setAttribute('paint-order', 'stroke');
  text.setAttribute('stroke-linejoin', 'round');
  text.setAttribute('stroke-width', orn != null ? `${4 * option.magnification}` : '0');
  text.setAttribute('stroke', orn != null ? orn : 'transparent');
  text.dataset.width = `${state.fontsize[0] * scale_x}`;
  text.appendChild(document.createTextNode(character));

  return text;
}

const retriveDRCSSVGPathElement = (token: ARIBB24DRCSParsedToken, info: CaptionAssociationInformation, rendererOption: SVGDOMRendererOption): [SVGPathElement, SVGPathElement] => {
  const { state, option, width, height, depth, binary } = token;
  const uint8 = new Uint8Array(binary);

  const stroke = rendererOption.color.stroke != null ? (namedcolor.get(rendererOption.color.stroke) ?? rendererOption.color.stroke) : null;
  const orn = stroke ?? (state.ornament != null ? colortable[state.ornament] : null);
  const foreground = rendererOption.color.foreground ?? colortable[state.foreground];

  const start_x = state.position[0] + (0 -                           0 + ARIBB24Parser.offset(state)[0]);
  const start_y = state.position[1] + (1 - ARIBB24Parser.box(state)[1] + ARIBB24Parser.offset(state)[1]);

  let path = '';
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const x = start_x + dx * option.magnification;
      const y = start_y + dy * option.magnification;

      let value = 0;
      for(let d = 0; d < depth; d++){
        const byte = Math.floor(((((dy * width) + dx) * depth) + d) / 8);
        const index = 7 - (((((dy * width) + dx) * depth) + d) % 8);
        value *= 2;
        value += ((uint8[byte] & (1 << index)) >> index);
      }

      if (value === 0) { continue; }

      path += (path === '' ? '' : ' ') + `M ${x} ${y} h ${option.magnification} v ${option.magnification} H ${x} Z`;
    }
  }

  const stroke_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const fill_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  stroke_path.setAttribute('shape-rendering', 'crispEdges');
  fill_path.setAttribute('shape-rendering', 'crispEdges');
  stroke_path.setAttribute('d', path);
  fill_path.setAttribute('d', path);
  stroke_path.setAttribute('stroke', orn ?? 'transparent');
  fill_path.setAttribute('stroke', 'transparent');
  stroke_path.setAttribute('fill', 'transparent');
  fill_path.setAttribute('fill', foreground);
  stroke_path.setAttribute('stroke-width', orn != null ? `${4 * option.magnification}` : '0');
  stroke_path.setAttribute('stroke-linejoin', 'round');

  return [stroke_path, fill_path];
}


import { ARIBB24BitmapParsedToken, ARIBB24CharacterParsedToken, ARIBB24CommonParsedToken, ARIBB24DRCSParsedToken, ARIBB24ParsedToken, ARIBB24Parser, ARIBB24ParserOption, ARIBB24ParserState } from "../../../../lib/parser/parser";
import { ARIBB24BitmapToken, ARIBB24FlashingControlType, ARIBB24Token } from "../../../../lib/tokenizer/token";
import colortable from "../../colortable";
import halfwidth from "../../halfwidth";
import namedcolor from "../../namedcolor";
import { ExhaustivenessError } from "../../../../util/error";
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { shouldHalfWidth } from "../../quirk";
import useARIBFont from "../../font";
import { SVGRendererOption } from "./renderer-option";
import CRC32 from "../../../../util/crc32";

export type SVGNode = string | {
  name: string;
  xmlns: string;
  attributes: Record<string, string>
  children: SVGNode[]
};
export const SVGNode = {
  from(xmlns: string, name: string, attributes: Record<string, string> = {}, children: SVGNode[] = []) {
    return { name, xmlns, attributes, children };
  }
}

export const serializeSVG = (node: SVGNode, depth: number = 0): string => {
  if (typeof node === 'string') {
    return '  '.repeat(depth) + node + '\n';
  }

  const attributes = Array.from([... (node.name === 'svg' ? [['xmlns', node.xmlns]] : []),  ...Object.entries(node.attributes)]).map(([k, v]) => `${k}="${v}"`).join(' ');
  let result = '  '.repeat(depth) + `<${node.name}${attributes === '' ? '' : ' ' + attributes}${node.children.length === 0 ? ' /' : ''}>\n`
  if (node.children.length === 0) { return result; }

  for (const child of node.children) {
    result += serializeSVG(child, depth + 1);
  }
  result += '  '.repeat(depth) + `</${node.name}>\n`;
  return result;
}

export default (tokens: ARIBB24ParsedToken[], info: CaptionAssociationInformation, rendererOption: SVGRendererOption, enclosure?: boolean): Exclude<SVGNode, string> => {
  const target = SVGNode.from('http://www.w3.org/2000/svg', 'svg');
  const buffer = SVGNode.from('http://www.w3.org/2000/svg', 'svg');
  const fg_groups: SVGNode[] = [];
  const bitmap_groups: SVGNode[] = [];
  const bg_paths = new Map<string, string>();

  for (const token of tokens) {
    target.attributes['viewBox'] = `0 0 ${token.state.plane[0]} ${token.state.plane[1]}`;
    buffer.attributes['viewBox'] = `0 0 ${token.state.area[0]} ${token.state.area[1]}`;
    buffer.attributes['x'] = `${token.state.margin[0]}`;
    buffer.attributes['y'] = `${token.state.margin[1]}`;
    buffer.attributes['width'] = `${token.state.area[0]}`;
    buffer.attributes['height'] = `${token.state.area[1]}`;

    switch (token.tag) {
      case 'Character': {
        // bg
        if (!token.non_spacing) {
          const [background, path] = retriveBackroundPathString(token, info, rendererOption);
          bg_paths.set(background, `${bg_paths.get(background) ?? ''}${bg_paths.has(background) ? ' ' : ''}${path}`);
        }
        // text
        const group = SVGNode.from('http://www.w3.org/2000/svg', 'g');
        group.children.push(retriveCharacterSVGTextElement(token, info, rendererOption));
        group.children.push(retriveDecorationSVGPathElement(token, info, rendererOption));
        const animate = retriveFlashingAnimateElement(token, info, rendererOption);
        if (animate) { group.children.push(animate); }
        // group
        fg_groups.push(group);
        break;
      }
      case 'DRCS': {
        // bg
        const [background, path] = retriveBackroundPathString(token, info, rendererOption);
        bg_paths.set(background, `${bg_paths.get(background) ?? ''}${bg_paths.has(background) ? ' ' : ''}${path}`);
        // DRCS
        const group = SVGNode.from('http://www.w3.org/2000/svg', 'g');
        for (const drcs of retriveDRCSSVGPathElement(token, info, rendererOption)) {
          group.children.push(drcs);
        }
        group.children.push(retriveDecorationSVGPathElement(token, info, rendererOption));
        const animate = retriveFlashingAnimateElement(token, info, rendererOption);
        if (animate) { group.children.push(animate); }
        // group
        fg_groups.push(group);
        break;
      }
      case 'Bitmap': {
        const { width, height, normal_dataurl, flashing_dataurl} = ARIBB24BitmapParsedToken.toDataURL(token, colortable);
        {
          const image = SVGNode.from('http://www.w3.org/2000/svg', 'image');
          image.attributes['href'] = normal_dataurl;
          image.attributes['x'] =`${token.x_position}`;
          image.attributes['y'] = `${token.y_position}`;
          image.attributes['width'] = `${width}`;
          image.attributes['height'] = `${height}`;

          bitmap_groups.push(image);
        }
        if (flashing_dataurl != null) {
          const flcImage = SVGNode.from('http://www.w3.org/2000/svg', 'image');
          flcImage.attributes['href'] = flashing_dataurl;
          flcImage.attributes['x'] =`${token.x_position}`;
          flcImage.attributes['y'] = `${token.y_position}`;
          flcImage.attributes['width'] =`${width}`;
          flcImage.attributes['height'] = `${height}`;

          const animate = SVGNode.from('http://www.w3.org/2000/svg', 'animate');
          animate.attributes['attributeName'] = 'opacity';
          animate.attributes['values'] = '1;0';
          animate.attributes['dur'] = '1s';
          animate.attributes['calcMode'] = 'discrete';
          animate.attributes['repeatCount'] = 'indefinite';
          flcImage.children.push(animate);

          bitmap_groups.push(flcImage);
        }

        break;
      }
      case 'ClearScreen':
        // Noop
        break;
      default:
        throw new ExhaustivenessError(token, `Unexpected ARIB Parsed Token in SVGRenderingStrategy`);
    }
  }

  // bg
  for (const [ color, path ] of bg_paths.entries()) {
    const bg = SVGNode.from('http://www.w3.org/2000/svg', 'path');
    bg.attributes['shape-rendering'] = 'crispEdges';
    bg.attributes['d'] = path;
    bg.attributes['fill'] = color;
    buffer.children.push(bg);
  }
  // text
  buffer.children.push(... fg_groups);
  buffer.children.push(... bitmap_groups);

  if (!enclosure) {
    return buffer;
  }

  target.children.push(buffer);
  return target;
}

const retriveDecorationSVGPathElement = (token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, info: CaptionAssociationInformation, rendererOption: SVGRendererOption): SVGNode => {
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

  const elem = SVGNode.from('http://www.w3.org/2000/svg', 'path');

  elem.attributes['shape-rendering'] = 'crispEdges';
  if (path !== '') {
    elem.attributes['d'] = path;
  }
  elem.attributes['fill'] = foreground;

  return elem;
}

const retriveFlashingAnimateElement = (token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, info: CaptionAssociationInformation, rendererOption: SVGRendererOption): SVGNode | null => {
  const { state } = token;

  switch (state.flashing) {
    case ARIBB24FlashingControlType.STOP:
      return null;
    case ARIBB24FlashingControlType.NORMAL:
    case ARIBB24FlashingControlType.INVERTED: {
      const animate = SVGNode.from('http://www.w3.org/2000/svg', 'animate');
      animate.attributes['attributeName'] = 'opacity';
      animate.attributes['values'] = state.flashing === ARIBB24FlashingControlType.NORMAL ? '1;0' : '0;1';
      animate.attributes['dur'] = '1s';
      animate.attributes['calcMode'] = 'discrete';
      animate.attributes['repeatCount'] = 'indefinite';
      return animate;
    }
    default:
      throw new ExhaustivenessError(state.flashing, `Unhandled Flasing Token in SVGDOMRenderingStrategy`);
  }
}

const retriveBackroundPathString = (token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, info: CaptionAssociationInformation, rendererOption: SVGRendererOption): [string, String] => {
  const { state } = token;
  const color = rendererOption.color.background ?? colortable[state.background];
  const origin_x = Math.floor((state.position[0] + 0) +                           0);
  const origin_y = Math.floor((state.position[1] + 1) - ARIBB24Parser.box(state)[1]);

  return [color, `M ${origin_x} ${origin_y} h ${ARIBB24Parser.box(state)[0]} v ${ARIBB24Parser.box(state)[1]} H ${origin_x} Z`];
}

const retriveCharacterSVGTextElement = (token: ARIBB24CharacterParsedToken, info: CaptionAssociationInformation, rendererOption: SVGRendererOption): SVGNode => {
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

  const text = SVGNode.from('http://www.w3.org/2000/svg', 'text');
  text.attributes['x'] = `${center_x}`;
  text.attributes['y'] = `${center_y}`;
  text.attributes['transform'] = `scale(${1} ${scale_y})`;
  text.attributes['transform-origin'] = `${center_x} ${center_y}`;
  text.attributes['font-size'] = `${state.fontsize[0]}`;
  text.attributes['font-family'] = useARIBFont(character) ? rendererOption.font.arib ?? rendererOption.font.normal : rendererOption.font.normal;
  text.attributes['dominant-baseline'] = 'central';
  text.attributes['text-anchor'] = 'middle';
  text.attributes['fill'] = foreground;
  text.attributes['paint-order'] = 'stroke';
  text.attributes['stroke-linejoin'] = 'round';
  text.attributes['stroke-width'] = orn != null ? `${4 * option.magnification}` : '0';
  text.attributes['stroke'] = orn != null ? orn : 'transparent';
  text.attributes['data-width'] = `${state.fontsize[0] * scale_x}`;
  text.attributes['textLength'] = `${state.fontsize[0] * scale_x}`;
  text.attributes['lengthAdjust'] = 'spacingAndGlyphs';
  text.children.push(character);

  return text;
}

const retriveDRCSSVGPathElement = (token: ARIBB24DRCSParsedToken, info: CaptionAssociationInformation, rendererOption: SVGRendererOption): [SVGNode, SVGNode] => {
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

  const stroke_path = SVGNode.from('http://www.w3.org/2000/svg', 'path');
  const fill_path = SVGNode.from('http://www.w3.org/2000/svg', 'path');
  stroke_path.attributes['shape-rendering'] = 'crispEdges';
  fill_path.attributes['shape-rendering'] = 'crispEdges';
  stroke_path.attributes['d'] = path;
  fill_path.attributes['d'] = path;
  stroke_path.attributes['stroke'] = orn ?? 'transparent';
  fill_path.attributes['stroke'] = 'transparent';
  stroke_path.attributes['fill'] = 'transparent';
  fill_path.attributes['fill'] = foreground;
  stroke_path.attributes['stroke-width'] = orn != null ? `${4 * option.magnification}` : '0';
  stroke_path.attributes['stroke-linejoin'] = 'round';

  return [stroke_path, fill_path];
}


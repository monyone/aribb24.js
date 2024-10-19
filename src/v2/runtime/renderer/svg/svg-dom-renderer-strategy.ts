import { ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24ParsedToken, ARIBB24Parser, ARIBB24ParserState, CHARACTER_SIZE } from "../../../parser/parser";
import { ARIBB24Token } from "../../../tokenizer/token";
import colortable from "../colortable";
import halfwidth from "../halfwidth";
import namedcolor from "../namedcolor";
import { UnreachableError } from "../../../util/error";
import { CaptionLanguageInformation } from "../../../tokenizer/b24/datagroup";
import { shouldHalfWidth } from "../quirk";
import { SVGDOMRendererOption } from "./svg-dom-renderer-option";

export default (target: SVGElement, state: ARIBB24ParserState, tokens: ARIBB24Token[], info: CaptionLanguageInformation, rendererOption: SVGDOMRendererOption): void => {
  const parser = new ARIBB24Parser(state);

  const texts: (SVGTextElement | SVGPathElement)[] = [];
  const bg_paths = new Map<string, string>();


  for (const token of parser.parse(tokens)) {
    target.setAttribute('viewBox', `0 0 ${token.state.plane[0]} ${token.state.plane[1]}`)

    switch (token.tag) {
      case 'Character': {
        // bg
        const [background, path] = retriveBackroundPathString(token, info, rendererOption);
        bg_paths.set(background, `${bg_paths.get(background) ?? ''}${bg_paths.has(background) ? ' ' : ''}${path}`);
        // text
        texts.push(retriveCharacterSVGTextElement(token, info, rendererOption));
        break;
      }
      case 'DRCS': {
        // bg
        const [background, path] = retriveBackroundPathString(token, info, rendererOption);
        bg_paths.set(background, `${bg_paths.get(background) ?? ''}${bg_paths.has(background) ? ' ' : ''}${path}`);
        // DRCS
        texts.push(... retriveDRCSSVGPathElement(token, info, rendererOption));
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

  const fragment = new DocumentFragment();
  // bg
  for (const [ color, path ] of bg_paths.entries()) {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bg.setAttribute('shape-rendering', 'crispEdges');
    bg.setAttribute('d', path);
    bg.setAttribute('fill', color);
    fragment.append(bg);
  }
  // text
  fragment.append(... texts);

  // Fragment
  target.appendChild(fragment);
}

/*
const renderHighlight = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, magnification: [number, number], info: CaptionLanguageInformation,rendererOption: CanvasRendererOption): void => {
  const { state, option } = token;

  const x = (state.margin[0] + (state.position[0] + 0) +                           0) * magnification[0];
  const y = (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1]) * magnification[1];
  context.translate(x, y);
  context.scale(magnification[0], magnification[1]);
  context.fillStyle = rendererOption.color.foreground ?? colortable[state.foreground];

  if ((state.highlight & 0b0001) !== 0) { // bottom
    context.fillRect(0, ARIBB24Parser.box(state)[1] - 1 * option.magnification, ARIBB24Parser.box(state)[0], 1 * option.magnification);
  }
  if ((state.highlight & 0b0010) !== 0) { // right
    context.fillRect(ARIBB24Parser.box(state)[0] - 1 * option.magnification, 0, 1 * option.magnification, ARIBB24Parser.box(state)[1]);
  }
  if ((state.highlight & 0b0100) !== 0) { // top
    context.fillRect(0, 0, ARIBB24Parser.box(state)[0], 1 * option.magnification);
  }
  if ((state.highlight & 0b1000) !== 0) { // left
    context.fillRect(0, 0, 1 * option.magnification, ARIBB24Parser.box(state)[1]);
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
}

const renderUnderline = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, magnification: [number, number], info: CaptionLanguageInformation, rendererOption: CanvasRendererOption): void => {
  const { state, option } = token;

  if (!state.underline) { return; }

  const x = (state.margin[0] + (state.position[0] + 0) +                           0) * magnification[0];
  const y = (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1]) * magnification[1];
  context.translate(x, y);
  context.scale(magnification[0], magnification[1]);
  context.fillStyle = rendererOption.color.foreground ?? colortable[state.foreground];

  context.fillRect(0, ARIBB24Parser.box(state)[1] - 1 * option.magnification, ARIBB24Parser.box(state)[0], 1 * option.magnification);

  context.setTransform(1, 0, 0, 1, 0, 0);
}

const renderCharacter = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken, magnification: [number, number], info: CaptionLanguageInformation, rendererOption: CanvasRendererOption): void => {
  const { state, option, character: { character: key, non_spacing } } = token;
  const is_halfwidth = state.size === CHARACTER_SIZE.Middle || state.size === CHARACTER_SIZE.Small;
  const should_halfwidth = shouldHalfWidth(state.size, info);
  const replace_halfwidth = rendererOption.replace.half  && should_halfwidth;
  const character = replace_halfwidth && halfwidth.has(key) ? halfwidth.get(key)! : key;
  // is spacing, do bg related render
  if (!non_spacing) {
    // clear
    clear(context, token, magnification, info, rendererOption);
    // background
    renderBackground(context, token, magnification, info, rendererOption);
    // Highlight
    renderHighlight(context, token, magnification, info, rendererOption);
    // Underline
    renderUnderline(context, token, magnification, info, rendererOption);
  }

  const stroke = rendererOption.color.stroke != null ? (namedcolor.get(rendererOption.color.stroke) ?? rendererOption.color.stroke) : null;
  const orn = stroke ?? (state.ornament != null ? colortable[state.ornament] : null);
  const foreground = rendererOption.color.foreground ?? colortable[state.foreground];

  const center_x = Math.floor((state.margin[0] + (state.position[0] + 0) + ARIBB24Parser.box(state)[0] / 2) * magnification[0]);
  const center_y = Math.floor((state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1] / 2) * magnification[1]);
  context.translate(center_x, center_y);

  // if embedded glyph, use
  if (rendererOption.replace.glyph.has(character)) {
    const { viewBox, path } = rendererOption.replace.glyph.get(character)!
    const path2d = new Path2D(path);

    const [sx, sy, dx, dy] = viewBox
    const width = dx - sx
    const height = dy - sy
    context.scale(state.fontsize[0] / width, state.fontsize[1] / height);
    context.translate(sx, sy);

    // orn
    if (orn !== null && orn !== foreground) {
      context.strokeStyle = orn;
      context.lineJoin = 'round';
      context.lineWidth = 4 * option.magnification;
      context.stroke(path2d);
    }

    // text
    context.fillStyle = foreground;
    context.fill(path2d);

    context.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }

  // detect
  const font = rendererOption.font.normal;
  context.font = `${state.fontsize[0]}px ${font}`;
  const { width }  = context.measureText(character);
  const fullwidth_font = width >= state.fontsize[0];

  if (fullwidth_font || !is_halfwidth) {
    context.scale(ARIBB24Parser.scale(state)[0] * magnification[0], ARIBB24Parser.scale(state)[1] * magnification[1]);
  } else {
    context.scale(magnification[0], ARIBB24Parser.scale(state)[1] * magnification[1]);
  }

  // orn
  if (orn !== null && orn !== foreground) {
    context.font = `${state.fontsize[0]}px ${font}`;
    context.strokeStyle = orn;
    context.lineJoin = 'round';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.lineWidth = 4 * option.magnification;
    context.strokeText(character, 0, 0);
  }

  // text
  context.font = `${state.fontsize[0]}px ${font}`;
  context.fillStyle = foreground;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.fillText(character, 0, 0);

  context.setTransform(1, 0, 0, 1, 0, 0);
}
*/

const retriveFlushingAnimateElement = (token: ARIBB24CharacterParsedToken, info: CaptionLanguageInformation, rendererOption: SVGDOMRendererOption): SVGAnimateElement => {
  const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  animate.setAttribute('attributeName', 'opacity');
  animate.setAttribute('values', '1;0');
  animate.setAttribute('dur', '1s');
  animate.setAttribute('calcMode', 'discrete');
  animate.setAttribute('repeatCount', 'indefinite');

  return animate;
}

const retriveBackroundPathString = (token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, info: CaptionLanguageInformation, rendererOption: SVGDOMRendererOption): [string, String] => {
  const { state } = token;
  const color = rendererOption.color.background ?? colortable[state.background];
  const origin_x = Math.floor(state.margin[0] + (state.position[0] + 0) +                           0);
  const origin_y = Math.floor(state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1]);

  return [color, `M ${origin_x} ${origin_y} h ${ARIBB24Parser.box(state)[0]} v ${ARIBB24Parser.box(state)[1]} H ${origin_x} Z`];
}

const retriveCharacterSVGTextElement = (token: ARIBB24CharacterParsedToken, info: CaptionLanguageInformation, rendererOption: SVGDOMRendererOption): SVGTextElement => {
  const { state, option, character: { character: key }} = token;

  const should_halfwidth = shouldHalfWidth(state.size, info);
  const replace_halfwidth = rendererOption.replace.half  && should_halfwidth;
  const has_halfwidth =  halfwidth.has(key);
  const character = replace_halfwidth && has_halfwidth ? halfwidth.get(key)! : key;

  const center_x = Math.floor(state.margin[0] + (state.position[0] + 0) + ARIBB24Parser.box(state)[0] / 2);
  const center_y = Math.floor(state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1] / 2);
  const scale_x = replace_halfwidth && has_halfwidth ? 1 : ARIBB24Parser.scale(state)[0];
  const scale_y = ARIBB24Parser.scale(state)[1];

  const stroke = rendererOption.color.stroke != null ? (namedcolor.get(rendererOption.color.stroke) ?? rendererOption.color.stroke) : null;
  const orn = stroke ?? (state.ornament != null ? colortable[state.ornament] : null);
  const foreground = rendererOption.color.foreground ?? colortable[state.foreground];

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', `${center_x}`);
  text.setAttribute('y', `${center_y}`);
  text.setAttribute('transform', `scale(${scale_x} ${scale_y})`);
  text.setAttribute('transform-origin', `${center_x} ${center_y}`);
  text.setAttribute('font-size', `${state.fontsize[0]}`);
  text.setAttribute('font-family', rendererOption.font.normal);
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', foreground);
  text.setAttribute('paint-order', 'stroke');
  text.setAttribute('stroke-linejoin', 'round');
  text.setAttribute('stroke-width', orn != null ? `${4 * option.magnification}` : '0');
  text.setAttribute('stroke', orn != null ? orn : 'transparent');
  text.appendChild(document.createTextNode(character));

  return text;
}

const retriveDRCSSVGPathElement = (token: ARIBB24DRCSPrasedToken, info: CaptionLanguageInformation, rendererOption: SVGDOMRendererOption): [SVGPathElement, SVGPathElement] => {
  const { state, option, drcs: { width, height, depth, binary } } = token;
  const uint8 = new Uint8Array(binary);

  const stroke = rendererOption.color.stroke != null ? (namedcolor.get(rendererOption.color.stroke) ?? rendererOption.color.stroke) : null;
  const orn = stroke ?? (state.ornament != null ? colortable[state.ornament] : null);
  const foreground = rendererOption.color.foreground ?? colortable[state.foreground];

  const start_x = state.margin[0] + state.position[0] + (0 -                           0 + ARIBB24Parser.offset(state)[0]);
  const start_y = state.margin[1] + state.position[1] + (1 - ARIBB24Parser.box(state)[1] + ARIBB24Parser.offset(state)[1]);

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
  const fill_path = document.createElementNS('http://www.w3.org/2000/svg', 'path');;
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

/*
const renderDRCS = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24DRCSPrasedToken, magnification: [number, number], info: CaptionLanguageInformation, rendererOption: SVGRendererOption): void => {
  const { state } = token;
  // clear
  clear(context, token, magnification, info, rendererOption);
  // background
  renderBackground(context, token, magnification, info, rendererOption);
  // Highlight
  renderHighlight(context, token, magnification, info, rendererOption);
  // Underline
  renderUnderline(context, token, magnification, info, rendererOption);

  const stroke = rendererOption.color.stroke != null ? (namedcolor.get(rendererOption.color.stroke) ?? rendererOption.color.stroke) : null;
  const orn = stroke ?? (state.ornament != null ? colortable[state.ornament] : null);
  const foreground = rendererOption.color.foreground ?? colortable[state.foreground];

  // orn
  if (orn !== null && orn !== foreground) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        renderDRCSInternal(context, token, magnification, [dx, dy], orn);
      }
    }
  }

  // foreground
  renderDRCSInternal(context, token, magnification, [0, 0], foreground);
}
*/

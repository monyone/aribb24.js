import { ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24Parser, ARIBB24ParserState, CHARACTER_SIZE } from "../../../parser/parser";
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

  const texts: SVGTextElement[] = [];

  for (const token of parser.parse(tokens)) {
    target.setAttribute('viewBox', `0 0 ${token.state.plane[0]} ${token.state.plane[1]}`)

    switch (token.tag) {
      case 'Character': {
        texts.push(retriveSVGTextElement(token, info, rendererOption));
        break;
      }
      case 'DRCS': {
        // TODO:
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
  fragment.append(... texts);

  target.appendChild(fragment);
}

/*
const renderBackground = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, magnification: [number, number], info: CaptionLanguageInformation,rendererOption: CanvasRendererOption): void => {
  const { state } = token;

  // background
  context.fillStyle = rendererOption.color.background ?? colortable[state.background];
  context.fillRect(
    (state.margin[0] + (state.position[0] + 0)  -                          0) * magnification[0],
    (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1]) * magnification[1],
    ARIBB24Parser.box(state)[0] * magnification[0],
    ARIBB24Parser.box(state)[1] * magnification[1]
  );
}

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

const retriveSVGTextElement = (token: ARIBB24CharacterParsedToken, info: CaptionLanguageInformation, rendererOption: SVGDOMRendererOption): SVGTextElement => {
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
  text.setAttribute('x', '0');
  text.setAttribute('y', '0');
  text.setAttribute('transform', `translate(${center_x} ${center_y}) scale(${scale_x} ${scale_y})`);
  text.setAttribute('transform-origin', `0 0`);
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

const renderDRCSInternal = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24DRCSPrasedToken, magnification: [number, number], delta: [number, number], color: string): void => {
  const { state, option, drcs: { width, height, depth, binary } } = token;
  const uint8 = new Uint8Array(binary);

  const start_x = (state.margin[0] + state.position[0] + (0 -                           0 + ARIBB24Parser.offset(state)[0])) * magnification[0];
  const start_y = (state.margin[1] + state.position[1] + (1 - ARIBB24Parser.box(state)[1] + ARIBB24Parser.offset(state)[1])) * magnification[1];
  context.translate(start_x, start_y);
  context.scale(option.magnification * magnification[0], option.magnification * magnification[1]);
  context.fillStyle = color;

  for(let sy = 0; sy < height; sy++){
    for(let sx = 0; sx < width; sx++){
      let value = 0;
      for(let d = 0; d < depth; d++){
        const byte = Math.floor(((((sy * width) + sx) * depth) + d) / 8);
        const index = 7 - (((((sy * width) + sx) * depth) + d) % 8);
        value *= 2;
        value += ((uint8[byte] & (1 << index)) >> index);
      }

      const x = sx + delta[0];
      const y = sy + delta[1];

      if (value === 0) { continue; }

      context.fillRect(x, y, 1, 1);
    }
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
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

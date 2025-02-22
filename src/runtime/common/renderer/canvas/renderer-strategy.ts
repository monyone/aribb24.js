import { ARIBB24CharacterParsedToken, ARIBB24DRCSParsedToken, ARIBB24ParsedToken, ARIBB24Parser } from "../../../../lib/parser/parser";
import { CanvasRendererOption } from "./renderer-option";
import colortable from "../../colortable";
import halfwidth from "../../halfwidth";
import namedcolor from "../../namedcolor";
import { ExhaustivenessError } from "../../../../util/error";
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { shouldHalfWidth } from "../../quirk";
import useARIBFont from "../../font";


export default (buffer: HTMLCanvasElement | OffscreenCanvas, Path2DSource: typeof Path2D, magnification: [number, number], tokens: ARIBB24ParsedToken[], info: CaptionAssociationInformation, rendererOption: CanvasRendererOption): void => {
  const context = buffer.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D; // Type Issue
  if (context == null) { return; }

  for (const token of tokens) {
    switch (token.tag) {
      case 'Character': {
        renderCharacter(context, token, Path2DSource, magnification, info, rendererOption);
        break;
      }
      case 'DRCS': {
        renderDRCS(context, token, Path2DSource, magnification, info, rendererOption);
        break;
      }
      case 'ClearScreen':
        if (token.time === 0) {
          // erase internal buffer
          context.clearRect(0, 0, buffer.width, buffer.height);
        }
        break;
      case 'Bitmap':
        break;
      default:
        throw new ExhaustivenessError(token, `Unexpected ARIB Parsed Token in CanvasRenderingStrategy`);
    }
  }
}

export const clear = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, magnification: [number, number], info: CaptionAssociationInformation, rendererOption: CanvasRendererOption): void => {
  const { state } = token;

  // clear
  context.clearRect(
    (state.margin[0] + (state.position[0] + 0)  -                          0) * magnification[0],
    (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1]) * magnification[1],
    ARIBB24Parser.box(state)[0] * magnification[0],
    ARIBB24Parser.box(state)[1] * magnification[1]
  );
}

export const renderBackground = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, magnification: [number, number], info: CaptionAssociationInformation,rendererOption: CanvasRendererOption): void => {
  const { state } = token;

  // background
  context.fillStyle = rendererOption.color.background ?? colortable[state.background];
  context.fillRect(
    (state.margin[0] + (state.position[0] + 0)  -                          0) * magnification[0],
    (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1]) * magnification[1],
    ARIBB24Parser.box(state)[0] * magnification[0],
    ARIBB24Parser.box(state)[1] * magnification[1],
  );
}

export const renderHighlight = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, magnification: [number, number], info: CaptionAssociationInformation,rendererOption: CanvasRendererOption): void => {
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

export const renderUnderline = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, magnification: [number, number], info: CaptionAssociationInformation, rendererOption: CanvasRendererOption): void => {
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

export const renderCharacter = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken, Path2DSource: typeof Path2D, magnification: [number, number], info: CaptionAssociationInformation, rendererOption: CanvasRendererOption): void => {
  const { state, option, character: key, non_spacing } = token;
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

  // if embedded glyph, use
  if (rendererOption.replace.glyph.has(character)) {
    const start_x = Math.floor((state.margin[0] + (state.position[0] + 0) +                           0 + ARIBB24Parser.offset(state)[0]) * magnification[0]);
    const start_y = Math.floor((state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1] + ARIBB24Parser.offset(state)[1]) * magnification[1]);
    context.translate(start_x, start_y);

    const { viewBox, path } = rendererOption.replace.glyph.get(character)!
    const path2d = new Path2DSource(path);

    const [sx, sy, dx, dy] = viewBox
    const width = dx - sx
    const height = dy - sy
    context.scale(state.fontsize[0] / width, state.fontsize[1] / height);
    context.translate(sx, sy);

    // orn
    if (orn !== null && orn !== foreground) {
      context.strokeStyle = orn;
      context.lineJoin = 'round';
      context.lineWidth = 4 * Math.max(width / state.fontsize[0], height / state.fontsize[1]) * option.magnification;
      context.stroke(path2d);
    }

    // text
    context.fillStyle = foreground;
    context.fill(path2d);

    context.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }

  // move
  const center_x = Math.floor((state.margin[0] + (state.position[0] + 0) + ARIBB24Parser.box(state)[0] / 2) * magnification[0]);
  const center_y = Math.floor((state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1] / 2) * magnification[1]);
  context.translate(center_x, center_y);

  // detect
  const font = useARIBFont(character) ? rendererOption.font.arib ?? rendererOption.font.normal : rendererOption.font.normal;
  context.scale(magnification[0] * 1, ARIBB24Parser.scale(state)[1] * magnification[1]);

  // orn
  if (orn !== null && orn !== foreground) {
    context.font = `${state.fontsize[0]}px ${font}`;
    context.strokeStyle = orn;
    context.lineJoin = 'round';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.lineWidth = 4 * option.magnification;
    context.strokeText(character, 0, 0, state.fontsize[0] * ARIBB24Parser.scale(state)[0]);
  }

  // text
  context.font = `${state.fontsize[0]}px ${font}`;
  context.fillStyle = foreground;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.fillText(character, 0, 0, state.fontsize[0] * ARIBB24Parser.scale(state)[0]);

  context.setTransform(1, 0, 0, 1, 0, 0);
}

const renderDRCSInternal = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24DRCSParsedToken, Path2DSource: typeof Path2D, magnification: [number, number], foreground: string, orn: string | null): void => {
  const { state, option, width, height, depth, binary } = token;
  const uint8 = new Uint8Array(binary);

  const start_x = (state.margin[0] + state.position[0] + (0 -                           0 + ARIBB24Parser.offset(state)[0])) * magnification[0];
  const start_y = (state.margin[1] + state.position[1] + (1 - ARIBB24Parser.box(state)[1] + ARIBB24Parser.offset(state)[1])) * magnification[1];
  context.translate(start_x, start_y);
  context.scale(option.magnification * magnification[0], option.magnification * magnification[1]);

  let path = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      for(let d = 0; d < depth; d++){
        const byte = Math.floor(((((y * width) + x) * depth) + d) / 8);
        const index = 7 - (((((y * width) + x) * depth) + d) % 8);
        value *= 2;
        value += ((uint8[byte] & (1 << index)) >> index);
      }

      if (value === 0) { continue; }
      path += (path === '' ? '' : ' ') + `M ${x} ${y} h ${1} v ${1} H ${x} Z`;
    }
  }
  const path2D = new Path2DSource(path);

  if (orn != null) {
    context.strokeStyle = orn;
    context.lineJoin = 'round';
    context.lineWidth = 2 * option.magnification;
    context.stroke(path2D);
  }

  context.fill(path2D);

  context.setTransform(1, 0, 0, 1, 0, 0);
}

export const renderDRCS = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24DRCSParsedToken, Path2DSource: typeof Path2D, magnification: [number, number], info: CaptionAssociationInformation, rendererOption: CanvasRendererOption): void => {
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

  renderDRCSInternal(context, token, Path2DSource, magnification, foreground, orn);
}

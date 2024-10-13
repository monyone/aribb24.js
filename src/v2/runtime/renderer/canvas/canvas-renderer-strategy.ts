import { ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24Parser, ARIBB24ParserState, CHARACTER_SIZE } from "../../../parser/index";
import { ARIBB24Token } from "../../../tokenizer/token";
import { CanvasRendererOption } from "./canvas-renderer-option";
import colortable from "../colortable";
import halfwidth from "../halfwidth";
import namedcolor from "../namedcolor";

export default (target: HTMLCanvasElement | OffscreenCanvas | null, buffer: HTMLCanvasElement | OffscreenCanvas, state: ARIBB24ParserState, tokens: ARIBB24Token[], rendererOption: CanvasRendererOption): void => {
  // render background
  let magnification: [number, number] = [1, 1];
  {
    const context = buffer.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D; // Type Issue
    if (context == null) { return; }

    const parser = new ARIBB24Parser(state);
    for (const token of parser.parse(tokens)) {
      const plane_width = token.state.plane[0];
      const plane_height = token.state.plane[1];

      const x = target != null ? Math.ceil(target.width / plane_width) : 1;
      const y = target != null ? Math.ceil(target.height / plane_height) : 1;
      const width = x * plane_width;
      const height = y * plane_height;
      magnification = [x, y];

      if (buffer.width !== width || buffer.height !== height) {
        buffer.width = width;
        buffer.height = height;
        context.clearRect(0, 0, buffer.width, buffer.height);
      }

      switch (token.tag) {
        case 'Character': {
          renderCharacter(context, token, magnification, rendererOption);
          break;
        }
        case 'DRCS': {
          renderDRCS(context, token, magnification, rendererOption);
          break;
        }
        case 'ClearScreen':
          if (token.time === 0) {
            // erase internal buffer
            context.clearRect(0, 0, buffer.width, buffer.height);
          }
          break;
        case 'PRA':
          break;
        default:
          const exhaustive: never = token;
          throw new Error(`Unhandled ARIB Parsed Token (${exhaustive})`);
      }
    }
  }

  // render Foregroud
  if (target != null) {
    const context = target.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D; // Type Issue;
    if (context == null) { return; }
    context.clearRect(0, 0, target.width, target.height);

    switch (rendererOption.resize.objectFit) {
      case 'none': {
        context.drawImage(buffer, 0, 0, target.width, target.height);
        break;
      }
      case 'contain':
      default: {
        const x_magnification = target.width / (buffer.width / magnification[0]);
        const y_magnification = target.height / (buffer.height / magnification[1]);
        const xy_magnification = Math.min(x_magnification, y_magnification);
        const width = buffer.width * xy_magnification / magnification[0];
        const height = buffer.height * xy_magnification / magnification[1];
        const x_margin = (target.width - width) / 2;
        const y_margin = (target.height - height) / 2;

        context.drawImage(buffer, 0, 0, buffer.width, buffer.height, x_margin, y_margin, width, height);
        break;
      }
    }
  }
}

const clear = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, magnification: [number, number], rendererOption: CanvasRendererOption): void => {
  const { state } = token;

  // background
  context.clearRect(
    (state.margin[0] + (state.position[0] + 0)  -                          0) * magnification[0],
    (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1]) * magnification[1],
    ARIBB24Parser.box(state)[0] * magnification[0],
    ARIBB24Parser.box(state)[1] * magnification[1]
  );
}

const renderBackground = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, magnification: [number, number], rendererOption: CanvasRendererOption): void => {
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

const renderHighlight = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, magnification: [number, number], rendererOption: CanvasRendererOption): void => {
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

const renderUnderline = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, magnification: [number, number], rendererOption: CanvasRendererOption): void => {
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

const renderCharacter = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken, magnification: [number, number], rendererOption: CanvasRendererOption): void => {
  const { state, option, character: { character: key } } = token;
  const is_halfwidth = state.size === CHARACTER_SIZE.Middle || state.size === CHARACTER_SIZE.Small;
  const replace_halfwidth = (rendererOption.replace.half && state.size === CHARACTER_SIZE.Middle) || (rendererOption.replace.small && state.size === CHARACTER_SIZE.Small)
  const character = replace_halfwidth && halfwidth.has(key) ? halfwidth.get(key)! : key;
  // clear
  clear(context, token, magnification, rendererOption);
  // background
  renderBackground(context, token, magnification, rendererOption);
  // Highlight
  renderHighlight(context, token, magnification, rendererOption);
  // Underline
  renderUnderline(context, token, magnification, rendererOption);

  // detect
  const font = rendererOption.font.normal;
  context.font = `${state.fontsize[0]}px ${font}`;
  const { width }  = context.measureText(character);
  const fullwidth_font = width >= state.fontsize[0];

  const center_x = (state.margin[0] + (state.position[0] + 0) + ARIBB24Parser.box(state)[0] / 2) * magnification[0];
  const center_y = (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.box(state)[1] / 2) * magnification[1];
  context.translate(center_x, center_y);
  if (fullwidth_font || !is_halfwidth) {
    context.scale(ARIBB24Parser.scale(state)[0] * magnification[0], ARIBB24Parser.scale(state)[1] * magnification[1]);
  } else {
    context.scale(magnification[0], ARIBB24Parser.scale(state)[1] * magnification[1]);
  }

  const stroke = rendererOption.color.stroke != null ? (namedcolor.get(rendererOption.color.stroke) ?? rendererOption.color.stroke) : null;
  const orn = stroke ?? (state.ornament != null ? colortable[state.ornament] : null);
  const foreground = rendererOption.color.foreground ?? colortable[state.foreground];

  // orn
  if (orn !== null && orn !== foreground) {
    context.font = `${state.fontsize[0]}px ${font}`;
    context.strokeStyle = orn;
    context.lineJoin = 'round';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.lineWidth = 4 * option.magnification;
    context.strokeText(character, 0, 0, state.fontsize[0]);
  }

  // text
  context.font = `${state.fontsize[0]}px ${font}`;
  context.fillStyle = foreground;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.fillText(character, 0, 0, state.fontsize[0]);

  context.setTransform(1, 0, 0, 1, 0, 0);
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

const renderDRCS = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24DRCSPrasedToken, magnification: [number, number], rendererOption: CanvasRendererOption): void => {
  const { state } = token;
  // clear
  clear(context, token, magnification, rendererOption);
  // background
  renderBackground(context, token, magnification, rendererOption);
  // Highlight
  renderHighlight(context, token, magnification, rendererOption);
  // Underline
  renderUnderline(context, token, magnification, rendererOption);

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

import { ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24Parser } from "../../../parser/index";
import { ARIBB24Token } from "../../../tokenizer/token";
import { ARIBB24CanvasRendererOption } from "./canvas-renderer-option";
import colortable from "../colortable";

export default (target: HTMLCanvasElement | OffscreenCanvas | null, buffer: HTMLCanvasElement | OffscreenCanvas, tokens: ARIBB24Token[], rendererOption: ARIBB24CanvasRendererOption): boolean => {
  // render background
  let magnification: [number, number] = [1, 1];
  {
    const context = buffer.getContext('2d');
    if (context == null) { return false; }

    const parser = new ARIBB24Parser();
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
    const context = target.getContext('2d');
    if (context == null) { return false; }
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

  return true;
}

const renderBackground = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, magnification: [number, number], rendererOption: ARIBB24CanvasRendererOption) => {
  const { state } = token;

  // background
  context.fillStyle = rendererOption.color.background ?? colortable[state.background];
  context.fillRect(
    (state.margin[0] + state.position[0]) * magnification[0],
    (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.height(state)) * magnification[1],
    ARIBB24Parser.width(state) * magnification[0],
    ARIBB24Parser.height(state) * magnification[1]
  );
}

const renderCharacter = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken, magnification: [number, number], rendererOption: ARIBB24CanvasRendererOption) => {
  const { state, option, character: { character } } = token;
  const font = rendererOption.font.normal;

  // background
  renderBackground(context, token, magnification, rendererOption);

  const center_x = (state.margin[0] + state.position[0] + ARIBB24Parser.width(state) / 2) * magnification[0];
  const center_y = (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.height(state) / 2) * magnification[1];
  context.translate(center_x, center_y);
  context.scale(ARIBB24Parser.scale(state)[0] * magnification[0], ARIBB24Parser.scale(state)[1] * magnification[1]);

  // orn
  if (rendererOption.color.stroke != null || state.ornament != null) {
    context.font = `${state.fontsize[0]}px ${font}`;
    context.strokeStyle = rendererOption.color.stroke ?? colortable[state.ornament!];
    context.lineJoin = 'round';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.lineWidth = 4 * option.magnification;
    context.strokeText(character, 0, 0);
  }

  // text
  context.font = `${state.fontsize[0]}px ${font}`;
  context.fillStyle = rendererOption.color.foreground ?? colortable[state.foreground];
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.fillText(character, 0, 0);

  context.setTransform(1, 0, 0, 1, 0, 0);
}

const renderDRCS = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24DRCSPrasedToken, magnification: [number, number], rendererOption: ARIBB24CanvasRendererOption) => {
  const { state, option, drcs: { width, height, depth, binary } } = token;
  const font = rendererOption.font.normal;

  // background
  renderBackground(context, token, magnification, rendererOption);
}

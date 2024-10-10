import { ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24Parser } from "../../../parser/index";
import { ARIBB24Token } from "../../../tokenizer/token";
import { ARIBB24CanvasRendererOption } from "./canvas-renderer-option";
import colortable from "../colortable";

export default (buffer: HTMLCanvasElement | OffscreenCanvas, tokens: ARIBB24Token[], rendererOption: ARIBB24CanvasRendererOption): boolean => {
  const context = buffer.getContext('2d');
  if (context == null) { return false; }

  const parser = new ARIBB24Parser();
  for (const token of parser.parse(tokens)) {
    const plane_width = token.state.plane[0];
    const plane_height = token.state.plane[1];
    if (buffer.width !== plane_width || buffer.height !== plane_height) {
      buffer.width = plane_width;
      buffer.height = plane_height;
      context.clearRect(0, 0, buffer.width, buffer.height);
    }

    switch (token.tag) {
      case 'Character': {
        renderCharacter(context, token, rendererOption);
        break;
      }
      case 'DRCS': {
        renderDRCS(context, token, rendererOption);
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

  return true;
}

const renderBackground = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, rendererOption: ARIBB24CanvasRendererOption) => {
  const { state } = token;

  // background
  context.fillStyle = rendererOption.color.background ?? colortable[state.background];
  context.fillRect(
    state.margin[0] + state.position[0],
    state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.height(state),
    ARIBB24Parser.width(state),
    ARIBB24Parser.height(state)
  );
}

const renderCharacter = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken, rendererOption: ARIBB24CanvasRendererOption) => {
  const { state, option, character: { character } } = token;
  const font = rendererOption.font.normal;

  // background
  renderBackground(context, token, rendererOption);

  const center_x = (state.margin[0] + state.position[0] + ARIBB24Parser.width(state) / 2);
  const center_y = (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.height(state) / 2);
  context.translate(center_x, center_y);
  context.scale(ARIBB24Parser.scale(state)[0], ARIBB24Parser.scale(state)[1]);

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

const renderDRCS = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24DRCSPrasedToken, rendererOption: ARIBB24CanvasRendererOption) => {
  const { state, option, drcs: { width, height, depth, binary } } = token;
  const font = rendererOption.font.normal;

  // background
  renderBackground(context, token, rendererOption);
}

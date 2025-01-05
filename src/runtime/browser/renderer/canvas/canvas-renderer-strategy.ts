import { ARIBB24ParserState } from "../../../../lib/parser/parser";
import { CanvasRendererOption } from "./canvas-renderer-option";
import { UnreachableError } from "../../../../util/error";
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { ARIBB24BitmapParsedToken, ARIBB24BrowserParser, ARIBB24BrowserToken } from "../../types";
import { renderCharacter, renderDRCS } from "../../../common/canvas/renderer-strategy";

export default (target: HTMLCanvasElement | OffscreenCanvas | null, buffer: HTMLCanvasElement | OffscreenCanvas, state: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionAssociationInformation, rendererOption: CanvasRendererOption): void => {
  // render background
  let magnification: [number, number] = [1, 1];
  {
    const context = buffer.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D; // Type Issue
    if (context == null) { return; }

    const parser = new ARIBB24BrowserParser(state);
    const parsed = parser.parse(tokens);
    const { plane: [width, height] } = parser.currentState();
    if (target != null) {
      magnification = [Math.ceil(target.width / width), Math.ceil(target.height / height)];
    }
    if (buffer.width !== width || buffer.height !== height) {
      buffer.width = width;
      buffer.height = height;
      context.clearRect(0, 0, buffer.width, buffer.height);
    }

    for (const token of parsed) {
      switch (token.tag) {
        case 'Character': {
          renderCharacter(context, token, globalThis.Path2D, magnification, info, rendererOption);
          break;
        }
        case 'DRCS': {
          renderDRCS(context, token, globalThis.Path2D, magnification, info, rendererOption);
          break;
        }
        case 'Bitmap': {
          renderBitmap(context, token, globalThis.Path2D, magnification, info, rendererOption);
          break;
        }
        case 'ClearScreen':
          if (token.time === 0) {
            // erase internal buffer
            context.clearRect(0, 0, buffer.width, buffer.height);
          }
          break;
        default:
          const exhaustive: never = token;
          throw new UnreachableError(`Unhandled ARIB Parsed Token (${exhaustive})`);
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

const renderBitmap = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24BitmapParsedToken, Path2DSource: typeof Path2D, magnification: [number, number], info: CaptionAssociationInformation, rendererOption: CanvasRendererOption): void => {
  const { x_position, y_position, width, height } = token;

  context.drawImage(token.normal_bitmap, x_position * magnification[0], y_position * magnification[1], width* magnification[0], height * magnification[1]);
  token.normal_bitmap.close();
  token.flashing_bitmap?.close();
}

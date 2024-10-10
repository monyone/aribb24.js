import { ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24Parser } from "../../../parser/index";
import { ARIBB24Token } from "../../../tokenizer/token";
import { ARIBB24CanvasRendererOption } from "./canvas-renderer-option";
import colortable from "../colortable";

export default (target: HTMLCanvasElement | OffscreenCanvas, buffer: HTMLCanvasElement | OffscreenCanvas | ImageBitmap, rendererOption: ARIBB24CanvasRendererOption): boolean => {
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
      const x_magnification = target.width / buffer.width;
      const y_magnification = target.height / buffer.height;
      const magnification = Math.min(x_magnification, y_magnification);
      const width = buffer.width * magnification;
      const height = buffer.height * magnification;
      const x_margin = (target.width - width) / 2
      const y_margin = (target.height - height) / 2

      context.drawImage(buffer, 0, 0, buffer.width, buffer.height, x_margin, y_margin, width, height);
      break;
    }
  }

  return true;
}

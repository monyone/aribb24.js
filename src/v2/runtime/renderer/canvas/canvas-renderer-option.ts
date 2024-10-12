import { RendererOption } from "../renderer-option";

export type CanvasRendererOption = RendererOption & {
  font: {
    normal: string;
    arib: string;
  },
  color: {
    stroke: string | null,
    foreground: string | null,
    background: string | null,
  },
  resize: {
    target: 'video' | 'container'
    objectFit: 'contain' | 'none'
  }
};

export const CanvasRendererOption = {
  from (option?: Partial<CanvasRendererOption>): CanvasRendererOption {
    return {
      font: {
        normal: '"Hiragino Maru Gothic Pro", "HGMaruGothicMPRO", "BIZ UDGothic", "MS Gothic", sans-serif',
        arib: '"Hiragino Maru Gothic Pro", "HGMaruGothicMPRO", "BIZ UDGothic", "MS Gothic", sans-serif',
        ... option?.font,
      },
      color: {
        stroke: null,
        foreground: null,
        background: null,
        ... option?.color,
      },
      resize: {
        target: 'container',
        objectFit: 'contain',
        ... option?.resize,
      }
    };
  }
};

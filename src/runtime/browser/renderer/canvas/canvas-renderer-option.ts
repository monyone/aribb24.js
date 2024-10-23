import type { PathElement } from "../additional-symbols-glyph";
import { RendererOption } from "../renderer-option";

export type CanvasRendererOption = RendererOption & {
  font: {
    normal: string;
    arib: string;
  },
  replace: {
    half: boolean,
    drcs: Map<string, string>,
    glyph: Map<string, PathElement>,
  }
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
        normal: '"Hiragino Maru Gothic Pro", "BIZ UDGothic", sans-serif',
        arib: '"Hiragino Maru Gothic Pro", "BIZ UDGothic", sans-serif',
        ... option?.font,
      },
      replace: {
        half: true,
        drcs: new Map<string, string>(),
        glyph: new Map<string, PathElement>(),
        ... option?.replace,
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

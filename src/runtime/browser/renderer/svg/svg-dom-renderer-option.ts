import type { PathElement } from "../additional-symbols-glyph";
import { RendererOption } from "../renderer-option";

export type SVGDOMRendererOption = RendererOption & {
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
  animation: {
    pause: boolean,
  },
};

export const SVGDOMRendererOption = {
  from (option?: Partial<SVGDOMRendererOption>): SVGDOMRendererOption {
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
      animation: {
        pause: true,
        ... option?.animation,
      },
    };
  }
};

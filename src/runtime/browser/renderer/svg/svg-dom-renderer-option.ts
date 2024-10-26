import type { PathElement } from "../additional-symbols-glyph";
import { RendererOption } from "../renderer-option";

type SVGDOMRendererFontOption = {
  normal: string;
  arib: string;
};

type SVGDOMRendererReplaceOption = {
  half: boolean;
  drcs: Map<string, string>;
  glyph: Map<string, PathElement>;
};

type SVGDOMRendererColorOption = {
  stroke: string | null;
  foreground: string | null;
  background: string | null;
};

type SVGDOMRendererAnimationOption = {
  pause: boolean;
}

export type SVGDOMRendererOption = RendererOption & {
  font: SVGDOMRendererFontOption;
  replace: SVGDOMRendererReplaceOption;
  color: SVGDOMRendererColorOption;
  animation: SVGDOMRendererAnimationOption;
};

export type PartialSVGDOMRendererOption = Partial<RendererOption & {
  font: Partial<SVGDOMRendererFontOption>;
  replace:  Partial<SVGDOMRendererReplaceOption>;
  color:  Partial<SVGDOMRendererColorOption>;
  animation:  Partial<SVGDOMRendererAnimationOption>;
}>;

export const SVGDOMRendererOption = {
  from (option?: PartialSVGDOMRendererOption): SVGDOMRendererOption {
    return {
      font: {
        normal: '"Hiragino Maru Gothic Pro", "BIZ UDGothic", "Yu Gothic Medium", sans-serif',
        arib: '"Hiragino Maru Gothic Pro", "BIZ UDGothic", "Yu Gothic Medium", sans-serif',
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

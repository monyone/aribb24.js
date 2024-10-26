import type { PathElement } from "../additional-symbols-glyph";
import { RendererOption } from "../renderer-option";

type CanvasRendererFontOption = {
  normal: string;
  arib: string;
};

type CanvasRendererReplaceOption = {
  half: boolean;
  drcs: Map<string, string>;
  glyph: Map<string, PathElement>;
};

type CanvasRendererColorOption = {
  stroke: string | null;
  foreground: string | null;
  background: string | null;
};

type CanvasRendererResizeOption = {
  target: 'video' | 'container';
  objectFit: 'contain' | 'none';
}

export type CanvasRendererOption = RendererOption & {
  font: CanvasRendererFontOption;
  replace: CanvasRendererReplaceOption;
  color: CanvasRendererColorOption;
  resize: CanvasRendererResizeOption;
};

export type PartialCanvasRendererOption = Partial<RendererOption & {
  font: Partial<CanvasRendererFontOption>;
  replace:  Partial<CanvasRendererReplaceOption>;
  color:  Partial<CanvasRendererColorOption>;
  resize:  Partial<CanvasRendererResizeOption>;
}>;

export const CanvasRendererOption = {
  from (option?: PartialCanvasRendererOption): CanvasRendererOption {
    return {
      font: {
        normal: "'Hiragino Maru Gothic Pro', 'BIZ UDGothic', 'Yu Gothic Medium', sans-serif",
        arib: "'Hiragino Maru Gothic Pro', 'BIZ UDGothic', 'Yu Gothic Medium', sans-serif",
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

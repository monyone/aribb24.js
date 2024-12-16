import { PathElement } from "../additional-symbols-glyph";

type RendererFontOption = {
  normal: string;
  arib: string;
};

type RendererReplaceOption = {
  half: boolean;
  drcs: Map<string, string>;
  glyph: Map<string, PathElement>;
};

type RendererColorOption = {
  stroke: string | null;
  foreground: string | null;
  background: string | null;
};

type RendererResizeOption = {
  target: 'video' | 'container';
  objectFit: 'contain' | 'none';
}

export type RendererOption = {
  font: RendererFontOption;
  replace: RendererReplaceOption;
  color: RendererColorOption;
  resize: RendererResizeOption;
};

export type PartialRendererOption = Partial<{
  font: Partial<RendererFontOption>;
  replace:  Partial<RendererReplaceOption>;
  color:  Partial<RendererColorOption>;
  resize:  Partial<RendererResizeOption>;
}>;

export const RendererOption = {
  from (option?: PartialRendererOption): RendererOption {
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
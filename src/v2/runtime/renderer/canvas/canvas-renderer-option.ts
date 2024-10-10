import { ARIBB24RendererOption } from "../renderer-option";

export type ARIBB24CanvasRendererOption = ARIBB24RendererOption & {
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
  }
};

export const ARIBB24CanvasRendererOption = {
  from (option?: Partial<ARIBB24CanvasRendererOption>): ARIBB24CanvasRendererOption {
    return {
      font: {
        normal: 'sans-serif',
        arib: 'sans-serif',
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
        ... option?.resize,
      }
    };
  }
};

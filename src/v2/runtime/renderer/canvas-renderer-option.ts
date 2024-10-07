import { ARIBB24RenderOption } from "./renderer-option";

export type ARIBB24CanvasRenderOption = ARIBB24RenderOption & {
  font: {
    normal: string;
    arib: string;
  },
  color: {
    stroke: string | null,
    foreground: string | null,
    background: string | null,
  }
};

export const ARIBB24CanvasRenderOption = {
  from (option?: Partial<ARIBB24CanvasRenderOption>): ARIBB24CanvasRenderOption {
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
    };
  }
};

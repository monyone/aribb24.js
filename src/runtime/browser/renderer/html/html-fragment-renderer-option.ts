import { RendererOption } from "../renderer-option";

export type HTMLFragmentRendererOption = RendererOption & {
  replace: {
    drcs: Map<string, string>,
  },
  color: {
    foreground: boolean,
    background: string | null,
  }
};

export const HTMLFragmentRendererOption = {
  from (option?: Partial<HTMLFragmentRendererOption>): HTMLFragmentRendererOption {
    return {
      replace: {
        drcs: new Map<string, string>(),
        ... option?.replace,
      },
      color: {
        foreground: true,
        background: null,
        ... option?.color,
      }
    };
  }
};

import { RendererOption } from "../renderer-option";

export type TextRendererOption = RendererOption & {
  replace: {
    half: boolean,
    drcs: Map<string, string>,
  }
};

export const TextRendererOption = {
  from (option?: Partial<TextRendererOption>): TextRendererOption {
    return {
      replace: {
        half: true,
        drcs: new Map<string, string>(),
        ... option?.replace,
      },
    };
  }
};

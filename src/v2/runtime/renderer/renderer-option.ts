export type ARIBB24RendererOption = {};

export const ARIBB24RendererOption = {
  from (option?: Partial<ARIBB24RendererOption>): ARIBB24RendererOption {
    return {
      ... option,
    };
  }
}

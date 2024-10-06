export type ARIBB24RenderOption = {};

export const ARIBB24RenderOption = {
  from (option?: Partial<ARIBB24RenderOption>): ARIBB24RenderOption {
    return {
      ... option,
    };
  }
}

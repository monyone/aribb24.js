export type RendererOption = {};

export const RendererOption = {
  from (option?: Partial<RendererOption>): RendererOption {
    return {
      ... option,
    };
  }
}

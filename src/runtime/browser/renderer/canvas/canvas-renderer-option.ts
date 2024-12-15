import { RendererOption, PartialRendererOption } from "../../../common/canvas/renderer-option";

export type CanvasRendererOption = RendererOption;
export type PartialCanvasRendererOption = PartialRendererOption;

export const CanvasRendererOption = {
  from (option?: PartialCanvasRendererOption): CanvasRendererOption {
    return RendererOption.from(option);
  }
};

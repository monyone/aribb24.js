import { ARIBB24ParserState } from "../../../parser";
import { ARIBB24Token } from "../../../tokenizer/token";
import { CanvasRendererOption } from "./canvas-renderer-option";

export type FromMainToWorkerEventInitialize = {
  type: 'initialize',
  present: OffscreenCanvas,
  buffer: OffscreenCanvas,
};
export const FromMainToWorkerEventInitialize = {
  from (present: OffscreenCanvas, buffer: OffscreenCanvas): FromMainToWorkerEventInitialize {
    return {
      type: 'initialize',
      present,
      buffer
    };
  }
};
export type FromMainToWorkerEventClear = {
  type: 'clear';
};
export const FromMainToWorkerEventClear = {
  from (): FromMainToWorkerEventClear {
    return {
      type: 'clear',
    };
  }
};
export type FromMainToWorkerEventTerminate = {
  type: 'terminate';
};
export const FromMainToWorkerEventTerminate = {
  from (): FromMainToWorkerEventTerminate {
    return {
      type: 'terminate',
    };
  }
};
export type FromMainToWorkerEventResize = {
  type: 'resize';
  width: number;
  height: number;
};
export const FromMainToWorkerEventResize = {
  from (width: number, height: number): FromMainToWorkerEventResize {
    return {
      type: 'resize',
      width,
      height
    };
  }
};
export type FromMainToWorkerEventRender = {
  type: 'render';
  state: ARIBB24ParserState,
  tokens: ARIBB24Token[],
  option: CanvasRendererOption,
};
export const FromMainToWorkerEventRender = {
  from (state: ARIBB24ParserState, tokens: ARIBB24Token[], option: CanvasRendererOption): FromMainToWorkerEventRender {
    return {
      type: 'render',
      state,
      tokens,
      option,
    };
  }
}

export type FromMainToWorkerEvent = FromMainToWorkerEventInitialize | FromMainToWorkerEventClear | FromMainToWorkerEventTerminate | FromMainToWorkerEventResize | FromMainToWorkerEventRender;

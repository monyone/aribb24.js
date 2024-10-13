import render from "./canvas-renderer-strategy"
import { FromMainToWorkerEvent } from "./canvas-renderer-worker.event";

let present: OffscreenCanvas | null = null;
let buffer: OffscreenCanvas | null = null;

self.addEventListener('message', (event: MessageEvent<FromMainToWorkerEvent>) => {
  switch (event.data.type) {
    case 'initialize': {
      present = event.data.present;
      buffer = event.data.buffer;
      break;
    }
    case 'resize': {
      const { width, height } = event.data;
      if (present == null) { break; }
      present.width = width;
      present.height = height;
      break;
    }
    case 'terminate': {
      if (present != null) {
        present.width = present.height = 0;
        present = null;
      }
      if (buffer != null) {
        buffer.width = buffer.height = 0;
        buffer = null;
      }
      break;
    }
    case 'clear': {
      if (present == null) { break;}
      const context = present.getContext('2d');
      if (context == null) { break; }

      context.clearRect(0, 0, present.width, present.height);
      break;
    }
    case 'render': {
      if (present == null) { break; }
      if (buffer == null) { break;}

      const { state, tokens, option } = event.data;
      render(present, buffer, state, tokens, option);

      break;
    }
    default: {
      const exhaustive: never = event.data;
      throw new Error(`Exhaustive check: ${exhaustive} reached!`);
    }
  }
});


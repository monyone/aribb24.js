#!/usr/bin/env node

import ARIBB24JapaneseJIS8Tokenizer from '../../../lib/tokenizer/b24/jis8/ARIB';
import { ARIBB24ParsedToken, ARIBB24Parser, initialState } from '../../../lib/parser/parser';
import read from '../../../lib/demuxer/mpegts';
import { exit } from '../exit';
import { writeFS } from '../file';
import { readableStream } from '../stream';
import canvasRendererStrategy from '../../common/canvas/renderer-strategy';
import { RendererOption } from '../../common/canvas/renderer-option';

const draw = (tokens: ARIBB24ParsedToken[], magnification: number, plane: [number, number], source: typeof import('@napi-rs/canvas')) => {
  let sx = Number.POSITIVE_INFINITY, sy = Number.POSITIVE_INFINITY, dx = 0, dy = 0;
  let elapsed_time = Number.POSITIVE_INFINITY;
  for (const token of tokens) {
    if (token.tag === 'ClearScreen') {
      elapsed_time = token.time;
      continue;
    }
    sx = Math.min(sx, token.state.margin[0] + token.state.position[0]);
    sy = Math.min(sy, token.state.margin[1] + token.state.position[1] - ARIBB24Parser.box(token.state)[1]);
    dx = Math.max(dx, token.state.margin[0] + token.state.position[0] + ARIBB24Parser.box(token.state)[0]);
    dy = Math.max(dy, token.state.margin[1] + token.state.position[1]);
  }
  const offset = [sx, sy];
  const area = [dx - sx, dy - sy];
  if (area[0] == Number.NEGATIVE_INFINITY || area[1] === Number.NEGATIVE_INFINITY) {
    return null;
  }

  const canvas = source.createCanvas(plane[0], plane[1]);
  canvasRendererStrategy(canvas as unknown as OffscreenCanvas, [1, 1], tokens, { association: 'ARIB', language: 'und'}, RendererOption.from({ font: { normal: 'IPAPGothic' }}));

  const screen = source.createCanvas(area[0], area[1]);
  const context = screen.getContext('2d');
  context.drawImage(canvas, offset[0], offset[1], area[0], area[1], 0, 0, area[0], area[1]);

  const png = screen.encodeSync('png');
  return png;
}

(async () => {
  const napi = await import('@napi-rs/canvas').catch(() => {
    console.error('Please install @napi-rs/canvas');
    return exit(-1);
  });

  const process = (globalThis as any).process;
  const filepath = process.argv[2];
  {
    let count = 0;
    for await (const caption of read(await readableStream(filepath))) {
      if (caption.tag !== 'Caption') { continue; }
      if (caption.data.tag !== 'CaptionStatement') { continue; }

      const tokenizer = new ARIBB24JapaneseJIS8Tokenizer();
      const parser = new ARIBB24Parser(initialState, { magnification: 2 });

      const png = draw(parser.parse(tokenizer.tokenize(caption.data)), parser.getMagnification(), parser.currentState().plane, napi)
      if (png == null) { continue; }
      await writeFS('test.png', png.buffer);
      break;
    }
  }
})();

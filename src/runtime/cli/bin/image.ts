#!/usr/bin/env node

import ARIBB24JapaneseJIS8Tokenizer from '../../../lib/tokenizer/b24/jis8/ARIB';
import { ARIBB24ParsedToken, ARIBB24Parser, initialState } from '../../../lib/parser/parser';
import read from '../../../lib/demuxer/mpegts';
import { exit } from '../exit';
import { writeFS } from '../file';
import { readableStream } from '../stream';
import render from '../../common/canvas/renderer-strategy';
import { RendererOption } from '../../common/canvas/renderer-option';
import { makeEmptySup, makeImageDataSup } from '../../common/sup'
import colortable from '../../common/colortable';
import concat from '../../../util/concat';

const draw = (pts: number, dts: number, tokens: ARIBB24ParsedToken[], plane: [number, number], source: typeof import('@napi-rs/canvas')): ArrayBuffer => {
  let sx = Number.POSITIVE_INFINITY, sy = Number.POSITIVE_INFINITY, dx = 0, dy = 0;
  let elapsed_time = 0;
  const codes = new Set<string>(['#00000000']);
  for (const token of tokens) {
    if (token.tag === 'ClearScreen') {
      elapsed_time = token.time;
      continue;
    }
    sx = Math.min(sx, token.state.margin[0] + token.state.position[0]);
    sy = Math.min(sy, token.state.margin[1] + token.state.position[1] - ARIBB24Parser.box(token.state)[1]);
    dx = Math.max(dx, token.state.margin[0] + token.state.position[0] + ARIBB24Parser.box(token.state)[0]);
    dy = Math.max(dy, token.state.margin[1] + token.state.position[1]);
    codes.add(colortable[token.state.background]);
    codes.add(colortable[token.state.foreground]);
  }
  const offset = [sx, sy] satisfies [number, number];
  const area = [dx - sx, dy - sy] satisfies [number, number];
  if (area[0] == Number.NEGATIVE_INFINITY || area[1] === Number.NEGATIVE_INFINITY) {
    return makeEmptySup(pts, dts, plane);
  }

  const palette = Array.from(codes).map((code) => {
    return [
      Number.parseInt(code.slice(1, 3), 16),
      Number.parseInt(code.slice(3, 5), 16),
      Number.parseInt(code.slice(5, 7), 16),
      Number.parseInt(code.slice(7, 9), 16),
    ];
  }) satisfies [number, number, number, number][];

  const canvas = source.createCanvas(plane[0], plane[1]);
  render(canvas as unknown as OffscreenCanvas, [1, 1], tokens, { association: 'ARIB', language: 'und' }, RendererOption.from({ font: { normal: 'IPAPGothic' }}));

  const screen = source.createCanvas(area[0], area[1]);
  const context = screen.getContext('2d');
  context.drawImage(canvas, offset[0], offset[1], area[0], area[1], 0, 0, area[0], area[1]);
  const image = context.getImageData(0, 0, area[0], area[1]);

  if (elapsed_time !== 0) {
    return concat(
      makeImageDataSup(pts, dts, image, palette, plane, offset, area),
      makeEmptySup(pts + elapsed_time, dts + elapsed_time, plane)
    );
  } else {
    return makeImageDataSup(pts, dts, image, palette, plane, offset, area);
  }
}

(async () => {
  const napi = await import('@napi-rs/canvas').catch(() => {
    console.error('Please install @napi-rs/canvas');
    return exit(-1);
  });

  const process = (globalThis as any).process;
  const filepath = process.argv[2];
  const sup = [];
  {
    for await (const caption of read(await readableStream(filepath))) {
      if (caption.tag !== 'Caption') { continue; }
      if (caption.data.tag !== 'CaptionStatement') { continue; }

      const tokenizer = new ARIBB24JapaneseJIS8Tokenizer();
      const parser = new ARIBB24Parser(initialState, { magnification: 2 });

      sup.push(draw(caption.pts, caption.dts, parser.parse(tokenizer.tokenize(caption.data)), parser.currentState().plane, napi));
    }
  }
  writeFS('test.sup', concat(... sup));
})();

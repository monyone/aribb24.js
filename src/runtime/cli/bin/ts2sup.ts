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
import { args, ArgsOption, parseArgs } from '../args';
import { ARIBB24CaptionManagement, CaptionAssociationInformation } from '../../../lib/demuxer/b24/datagroup';
import { getTokenizeInformation } from '../info';

const generate = (pts: number, dts: number, tokens: ARIBB24ParsedToken[], info: CaptionAssociationInformation, plane: [number, number], option: RendererOption, source: typeof import('@napi-rs/canvas')): ArrayBuffer => {
  let sx = Number.POSITIVE_INFINITY, sy = Number.POSITIVE_INFINITY, dx = 0, dy = 0;
  let elapsed_time = 0;
  const foreground_codes = new Set<string>();
  const background_codes = new Set<string>(['#000000FF']);
  for (const token of tokens) {
    if (token.tag === 'ClearScreen') {
      elapsed_time = token.time;
      continue;
    }
    sx = Math.min(sx, token.state.margin[0] + token.state.position[0]);
    sy = Math.min(sy, token.state.margin[1] + token.state.position[1] - ARIBB24Parser.box(token.state)[1]);
    dx = Math.max(dx, token.state.margin[0] + token.state.position[0] + ARIBB24Parser.box(token.state)[0]);
    dy = Math.max(dy, token.state.margin[1] + token.state.position[1]);
    background_codes.add(colortable[token.state.background]);
    foreground_codes.add(colortable[token.state.foreground]);
  }
  const offset = [sx, sy] satisfies [number, number];
  const area = [dx - sx, dy - sy] satisfies [number, number];
  if (area[0] == Number.NEGATIVE_INFINITY || area[1] === Number.NEGATIVE_INFINITY) {
    return makeEmptySup(pts, dts, plane);
  }

  const background_palette = Array.from(background_codes).map((code) => {
    return [
      Number.parseInt(code.slice(1, 3), 16),
      Number.parseInt(code.slice(3, 5), 16),
      Number.parseInt(code.slice(5, 7), 16),
      Number.parseInt(code.slice(7, 9), 16),
    ];
  }) satisfies [number, number, number, number][];
  const foreground_palette = Array.from(foreground_codes).map((code) => {
    return [
      Number.parseInt(code.slice(1, 3), 16),
      Number.parseInt(code.slice(3, 5), 16),
      Number.parseInt(code.slice(5, 7), 16),
      Number.parseInt(code.slice(7, 9), 16),
    ];
  }) satisfies [number, number, number, number][];

  const palette = [[0, 0, 0, 0], ... foreground_palette, ... background_palette] satisfies [number, number, number, number][];
  for (const [fr, fg, fb, _] of foreground_palette) { palette.push([fr, fg, fb, 0]); }
  const gradations = Math.min(16, Math.floor((256 - palette.length) / (2 + (background_palette.length + 2) * (foreground_palette.length))));

  for (const [fr, fg, fb, fa] of foreground_palette) {
    for (const [br, bg, bb, ba] of [... background_palette, [fr, fg, fb, 0], [0, 0, 0, 0]]) {
      for (let gradation = 1; gradation < gradations - 1; gradation++) {
        const r = Math.floor(fr + (br - fr) * gradation / gradations);
        const g = Math.floor(fg + (bg - fg) * gradation / gradations);
        const b = Math.floor(fb + (bb - fb) * gradation / gradations);
        const a = Math.floor(fa + (ba - fa) * gradation / gradations);
        palette.push([r, g, b, a]);
      }
    }
  }
  {
    const [fr, fg, fb, fa] = [0, 0, 0, 255];
    const [br, bg, bb, ba] = [0, 0, 0, 128];
    for (let gradation = 1; gradation < gradations - 1; gradation++) {
      const r = Math.floor(fr + (br - fr) * gradation / gradations);
      const g = Math.floor(fg + (bg - fg) * gradation / gradations);
      const b = Math.floor(fb + (bb - fb) * gradation / gradations);
      const a = Math.floor(fa + (ba - fa) * gradation / gradations);
      palette.push([r, g, b, a]);
    }
  }
  {
    const [fr, fg, fb, fa] = [0, 0, 0, 128];
    const [br, bg, bb, ba] = [0, 0, 0, 0];
    for (let gradation = 1; gradation < gradations - 1; gradation++) {
      const r = Math.floor(fr + (br - fr) * gradation / gradations);
      const g = Math.floor(fg + (bg - fg) * gradation / gradations);
      const b = Math.floor(fb + (bb - fb) * gradation / gradations);
      const a = Math.floor(fa + (ba - fa) * gradation / gradations);
      palette.push([r, g, b, a]);
    }
  }

  const canvas = source.createCanvas(plane[0], plane[1]);
  render(canvas as unknown as OffscreenCanvas, [1, 1], tokens, info, option);

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

const cmdline = ([
  {
    long: '--input',
    short: '-i',
    help: 'Specify Input File (.ts)',
    action: 'default',
  },
  {
    long: '--output',
    short: '-o',
    help: 'Specify Output File (.sup)',
    action: 'default'
  },
  {
    long: '--stroke',
    short: '-s',
    help: 'Specify forced stroke',
    action: 'store_true',
  },
  {
    long: '--background',
    short: '-b',
    help: 'Specify background color',
    action: 'default',
  },
  {
    long: '--font',
    short: '-f',
    help: 'Specify font',
    action: 'default',
  },
  {
    long: '--language',
    short: '-l',
    help: 'Specify language',
    action: 'default',
  },
  {
    long: '--help',
    short: '-h',
    help: 'Show help message',
    action: 'help',
  }
]) satisfies ArgsOption[];

(async () => {
  const cmd = parseArgs(args(), cmdline, 'ts2sup', 'MPEG-TS ARIB Caption (Profile A) to SUP (HDMV-PGS)');
  const input = cmd['input'] ?? '-';
  const output = cmd['output'] ?? '-';
  const stroke = cmd['stroke'] ? 'black' : null;
  const background = cmd['background'] ?? null;
  const font = cmd['font'] ?? "'Hiragino Maru Gothic Pro', 'BIZ UDGothic', 'Yu Gothic Medium', 'IPAGothic', sans-serif";
  const language = Number.isNaN(Number.parseInt(cmd['language'])) ? (cmd['language'] ?? 0) : Number.parseInt(cmd['language']);

  const napi = await import('@napi-rs/canvas').catch(() => {
    console.error('Please install @napi-rs/canvas');
    return exit(-1);
  });

  const sup = [];
  {
    let management: ARIBB24CaptionManagement | null = null;
    let desired: number | null = null;
    for await (const independent of read(await readableStream(input))) {
      if (independent.tag !== 'Caption') { continue; }

      const caption = independent.data;
      if (caption.tag === 'CaptionManagement') {
        if (typeof(language) === 'number') {
          desired = language;
        } else {
          const lang = [... caption.languages].sort(({ lang: fst }, { lang: snd}) => fst - snd).filter(({ iso_639_language_code }) => iso_639_language_code === language);
          desired = lang?.[0]?.lang ?? null;
        }
        management = caption;
      } else if (management == null) {
        continue;
      } else {
        const entry = management.languages.find((entry) => entry.lang === caption.lang);
        if (entry == null) { continue; }
        if (desired !== caption.lang) { continue; }

        const specification = getTokenizeInformation(entry.iso_639_language_code, entry.TCS, 'UNKNOWN');
        if (specification == null) { continue; }
        const [association, tokenizer, state] = specification;
        const parser = new ARIBB24Parser(state, { magnification: 2 });
        const option = RendererOption.from({
          font: { normal: font },
          color: { stroke: stroke, background: background }
        });
        const info = {
          association,
          language: entry.iso_639_language_code,
        };

        sup.push(generate(independent.pts, independent.dts, parser.parse(tokenizer.tokenize(independent.data)), info, parser.currentState().plane, option, napi));
      }
    }
  }
  writeFS(output, concat(... sup));
})();

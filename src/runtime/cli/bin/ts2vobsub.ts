#!/usr/bin/env node

import { ARIBB24ParsedToken, ARIBB24Parser, initialState } from '../../../lib/parser/parser';
import read from '../../../lib/demuxer/mpegts';
import { encode } from '../../../lib/encoder/vobsub';
import { makePES, makePS } from '../../../lib/muxer/vobsub';
import { exit } from '../exit';
import { readableStream, writableStream } from '../stream';
import render from '../../common/renderer/canvas/renderer-strategy';
import { CanvasRendererOption } from '../../common/renderer/canvas/renderer-option';
import { makeEmptySup, makeImageDataSup } from '../../../lib/muxer/sup'
import colortable from '../../common/colortable';
import namedcolor from '../../common/namedcolor';
import concat from '../../../util/concat';
import { args, ArgsOption, parseArgs } from '../args';
import { ARIBB24CaptionManagement, CaptionAssociationInformation } from '../../../lib/demuxer/b24/datagroup';
import { getTokenizeInformation } from '../info';
import { PathElement } from '../../common/additional-symbols-glyph';

const generate = (tokens: ARIBB24ParsedToken[],  plane: [number, number], info: CaptionAssociationInformation, option: CanvasRendererOption, source: typeof import('@napi-rs/canvas')): ArrayBuffer | null => {
  let sx = Number.POSITIVE_INFINITY, sy = Number.POSITIVE_INFINITY, dx = 0, dy = 0;
  let elapsed_time = 0;
  /*
  const foreground_codes = new Set<string>();
  const background_codes = new Set<string>(option.color.stroke ? [namedcolor.get(option.color.stroke) ?? option.color.stroke] : []);
  */
  for (const token of tokens) {
    if (token.tag === 'ClearScreen') {
      elapsed_time = token.time;
      continue;
    }
    sx = Math.min(sx, token.state.margin[0] + token.state.position[0]);
    sy = Math.min(sy, token.state.margin[1] + token.state.position[1] - ARIBB24Parser.box(token.state)[1]);
    dx = Math.max(dx, token.state.margin[0] + token.state.position[0] + ARIBB24Parser.box(token.state)[0]);
    dy = Math.max(dy, token.state.margin[1] + token.state.position[1]);
    /*
    background_codes.add(option.color.background ? namedcolor.get(option.color.background) ?? option.color.background : colortable[token.state.background]);
    if (token.state.ornament != null) {
      background_codes.add(option.color.stroke ? namedcolor.get(option.color.stroke) ?? option.color.stroke : colortable[token.state.ornament]);
    }
    foreground_codes.add(colortable[token.state.foreground]);
    */
  }
  const offset = [sx, sy] satisfies [number, number];
  const area = [dx - sx, dy - sy] satisfies [number, number];
  if (area[0] === Number.NEGATIVE_INFINITY || area[1] === Number.NEGATIVE_INFINITY) {
    return null;
  }

  const canvas = source.createCanvas(plane[0], plane[1]);
  render(canvas as unknown as OffscreenCanvas, source.Path2D as unknown as typeof Path2D, [1, 1], tokens, info, option);
  const context = canvas.getContext('2d');
  const image = context.getImageData(offset[0], offset[1], area[0], area[1]);

  const colors = [
    '#FFFFFFFF',
    '#00000080',
    '#00000080',
    '#00000080',
  ] satisfies [string, string, string, string];
  const palette = [
    '#FFFFFF', '#000000', '#FFFFFF', '#FFFFFF',
    '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF',
    '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF',
    '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF',
  ];

  return encode(offset[0], offset[1], area[0], area[1], image.data, elapsed_time === 0 ? null : elapsed_time, colors, palette);
}

const timestamp = (seconds: number): string => {
  const mill = Math.floor(seconds * 1000) - Math.floor(seconds) * 1000;
  const sec = Math.floor(seconds) % 60;
  const min = Math.floor(seconds / 60) % 60;
  const hour = Math.floor(seconds / 3600) % 60;

  return `${hour.toString(10).padStart(2, '0')}:${min.toString(10).padStart(2, '0')}:${sec.toString(10).padStart(2, '0')}:${mill.toString(10).padStart(3, '0')}`;
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
    action: 'default',
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
    long: '--glyph',
    short: '-g',
    help: 'Specify use Embedded Glyph',
    action: 'store_true',
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
]) as const satisfies ArgsOption[];

(async () => {
  const cmd = parseArgs(args(), cmdline, 'ts2sup', 'MPEG-TS ARIB Caption (Profile A) to VOBSUB (DVD-Video)');
  const input = cmd['input'] ?? '-';
  const output = cmd['output'] ?? '-';
  const stroke = cmd['stroke'] ?? null;
  const background = cmd['background'] ?? null;
  const font = cmd['font'] ?? "'Hiragino Maru Gothic Pro', 'BIZ UDGothic', 'Yu Gothic Medium', 'IPAGothic', sans-serif";
  const language = Number.isNaN(Number.parseInt(cmd['language'])) ? (cmd['language'] ?? 0) : Number.parseInt(cmd['language']);
  const glyph = cmd['glyph']
    ? (await import('../../common/additional-symbols-glyph').catch(() => ({ default: new Map<string, PathElement>()}))).default
    : new Map<string, PathElement>();

  const napi = await import('@napi-rs/canvas').catch(() => {
    console.error('Please install @napi-rs/canvas');
    return exit(-1);
  });

  const writable = await writableStream(output);
  const writer = writable.getWriter();
  let filepos = 0;
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
        const option = CanvasRendererOption.from({
          font: { normal: font },
          replace: { glyph: glyph },
          color: { stroke: stroke, background: background, foreground: 'white' }
        });
        const info = {
          association,
          language: entry.iso_639_language_code,
        };

        const encoded = generate(parser.parse(tokenizer.tokenize(independent.data)), parser.currentState().plane, info, option, napi);
        if (encoded == null) { continue; }

        const ps = makePS(makePES(concat(Uint8Array.from([0x20]).buffer, encoded), Number.NaN), Number.NaN);
        console.log(`timestamp: ${timestamp(independent.pts)}, filepos: ${filepos.toString(16).padStart(8, '0')}`);
        filepos += ps.byteLength;
        writer.write(new Uint8Array(ps));
      }
    }
  }
  writer.close();
})();

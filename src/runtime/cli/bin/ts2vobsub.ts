#!/usr/bin/env node

import { ARIBB24ParsedToken, ARIBB24Parser, ARIBB24ParserState } from '../../../lib/parser/parser';
import read, { ARIBB24MPEGTSData } from '../../../lib/demuxer/mpegts';
import { encode } from '../../../lib/encoder/vobsub';
import { makePES, makePS } from '../../../lib/muxer/vobsub';
import { exit } from '../exit';
import { readableStream, writableStream } from '../stream';
import render from '../../common/renderer/canvas/renderer-strategy';
import { CanvasRendererOption } from '../../common/renderer/canvas/renderer-option';
import colortable from '../../common/colortable';
import namedcolor from '../../common/namedcolor';
import concat from '../../../util/concat';
import { args, ArgsOption, parseArgs } from '../args';
import { ARIBB24CaptionManagement, CaptionAssociationInformation, CaptionManagementLanguageEntry } from '../../../lib/demuxer/b24/datagroup';
import { Association, getTokenizeInformation } from '../info';
import { PathElement } from '../../common/additional-symbols-glyph';
import ARIBB24Tokenizer from '../../../lib/tokenizer/b24/tokenizer';
import { writeFS } from '../file';

const timestamp = (seconds: number): string => {
  const mill = Math.floor(seconds * 1000) - Math.floor(seconds) * 1000;
  const sec = Math.floor(seconds) % 60;
  const min = Math.floor(seconds / 60) % 60;
  const hour = Math.floor(seconds / 3600) % 60;

  return `${hour.toString(10).padStart(2, '0')}:${min.toString(10).padStart(2, '0')}:${sec.toString(10).padStart(2, '0')}:${mill.toString(10).padStart(3, '0')}`;
}

const generate = (palette: string[], tokens: ARIBB24ParsedToken[],  plane: [number, number], info: CaptionAssociationInformation, option: CanvasRendererOption, source: typeof import('@napi-rs/canvas')): ArrayBuffer | null => {
  let sx = Number.POSITIVE_INFINITY, sy = Number.POSITIVE_INFINITY, dx = 0, dy = 0;
  let elapsed_time = 0;
  const colors_set = new Set<string>(['#00000000']);

  for (const token of tokens) {
    if (token.tag === 'ClearScreen') {
      elapsed_time = token.time;
      continue;
    }
    sx = Math.min(sx, token.state.margin[0] + token.state.position[0]);
    sy = Math.min(sy, token.state.margin[1] + token.state.position[1] - ARIBB24Parser.box(token.state)[1]);
    dx = Math.max(dx, token.state.margin[0] + token.state.position[0] + ARIBB24Parser.box(token.state)[0]);
    dy = Math.max(dy, token.state.margin[1] + token.state.position[1]);
    colors_set.add(option.color.background ? namedcolor.get(option.color.background) ?? option.color.background : colortable[token.state.background]);
    colors_set.add(option.color.foreground ? namedcolor.get(option.color.foreground) ?? option.color.foreground : colortable[token.state.foreground]);
    if (token.state.ornament != null) {
      colors_set.add(option.color.stroke ? namedcolor.get(option.color.stroke) ?? option.color.stroke : colortable[token.state.ornament]);
    }
  }
  const offset = [sx, sy] satisfies [number, number];
  const area = [dx - sx, dy - sy] satisfies [number, number];
  if (area[0] === Number.NEGATIVE_INFINITY || area[1] === Number.NEGATIVE_INFINITY) {
    return null;
  }

  const colors = Array.from(colors_set.values());
  if (colors.length > 4) {
    console.error('Maxium SPU simultaneous displays color exceeded!');
    return exit(-1);
  }
  while (colors.length < 4) {
    colors.push('#00000000');
  }

  const canvas = source.createCanvas(plane[0], plane[1]);
  render(canvas as unknown as OffscreenCanvas, source.Path2D as unknown as typeof Path2D, [1, 1], tokens, info, option);
  const context = canvas.getContext('2d');
  const image = context.getImageData(offset[0], offset[1], area[0], area[1]);

  return encode(offset[0], offset[1], area[0], area[1], image.data, elapsed_time === 0 ? null : elapsed_time, colors as [string, string, string, string], palette);
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
    help: 'Specify Output Sub File (.sub)',
    action: 'default'
  },
  {
    long: '--index',
    short: '-x',
    help: 'Specify Output Idx File (.idx)',
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
    long: '--foreground',
    short: '-p',
    help: 'Specify foreground color',
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

const iterate = async (data: ARIBB24MPEGTSData[], language: string | number, cb: (entry: CaptionManagementLanguageEntry, association: Association, tokenizer: ARIBB24Tokenizer, state: ARIBB24ParserState, independent: ARIBB24MPEGTSData) => void) => {
  let management: ARIBB24CaptionManagement | null = null;
  let desired: number | null = null;
  for (const independent of data) {
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
      cb(entry, association, tokenizer, state, independent);
    }
  }
}

(async () => {
  const cmd = parseArgs(args(), cmdline, 'ts2vobsub', 'MPEG-TS ARIB Caption (Profile A) to VOBSUB (DVD-Video)');
  const input = cmd['input'] ?? '-';
  const output = cmd['output'] ?? null;
  const index = cmd['index'] ?? null;
  if (output == null || index == null) {
    console.error('Please Specify Output Sub/Idx file');
    return exit(-1);
  };
  const stroke = cmd['stroke'] ?? null;
  const background = cmd['background'] ?? null;
  const foreground = cmd['foreground'] ?? null;
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

  const captions = [];
  for await (const independent of read(await readableStream(input))) {
    captions.push(independent);
  }

  const palette_set = new Set<string>(['#000000']);
  let plane: [number, number] = [-1, -1];
  // retrieve pallete info
  iterate(captions, language, (entry, association, tokenizer, state, independent) => {
    const parser = new ARIBB24Parser(state, { magnification: 2 });
    const option = CanvasRendererOption.from({
      font: { normal: font },
      replace: { glyph: glyph },
      color: { stroke: stroke, background: background, foreground: foreground }
    });
    const info = {
      association,
      language: entry.iso_639_language_code,
    };

    for (const token of parser.parse(tokenizer.tokenize(independent.data))) {
      const background_color = option.color.background ? namedcolor.get(option.color.background) ?? option.color.background : colortable[token.state.background];
      palette_set.add(background_color.slice(0, 7));
      const foreground_color = option.color.foreground ? namedcolor.get(option.color.foreground) ?? option.color.foreground : colortable[token.state.foreground];
      palette_set.add(foreground_color.slice(0, 7));
      if (token.state.ornament != null) {
        const ornament_color = option.color.stroke ? namedcolor.get(option.color.stroke) ?? option.color.stroke : colortable[token.state.ornament];
        palette_set.add(ornament_color.slice(0, 7));
      }
    }

    plane = parser.currentState().plane;
  });
  if (plane[0] < 0 || plane[1] < 0) {
    console.error('Caption not found...');
    return exit(-1);
  }

  const palette = Array.from(palette_set.values());
  if (palette.length > 16) {
    console.error('Maxium SUP palette size exceeded!');
    return exit(-1);
  }
  while (palette.length < 16) {
    palette.push('#000000');
  }

  let filepos = 0;
  const cues: [seconds: number, filepos: number][] = [];
  iterate(captions, language, (entry, association, tokenizer, state, independent) => {
    const parser = new ARIBB24Parser(state, { magnification: 2 });
    const option = CanvasRendererOption.from({
      font: { normal: font },
      replace: { glyph: glyph },
      color: { stroke: stroke, background: background, foreground: foreground }
    });
    const info = {
      association,
      language: entry.iso_639_language_code,
    };

    const encoded = generate(palette, parser.parse(tokenizer.tokenize(independent.data)), parser.currentState().plane, info, option, napi);
    if (encoded == null) { return; }

    const ps = makePS(makePES(concat(Uint8Array.from([0x20]).buffer, encoded), Math.floor(independent.pts * 90000)), Math.floor(independent.pts * 90000));
    cues.push([independent.pts, filepos]);
    filepos += ps.byteLength;
    writer.write(new Uint8Array(ps));
  });
  writer.close();

  let idx = '';
  idx += '# VobSub index file, v7 (do not modify this line!)\n'
  idx += '\n\n';
  idx += '# Settings\n'
  idx += '\n';
  idx += '# Original frame size\n'
  idx += `size: ${plane[0]}x${plane[1]}\n`
  idx += '\n';
  idx += '# Origin, relative to the upper-left corner, can be overloaded by aligment\n';
  idx += 'org: 0, 0\n'
  idx += '\n';
  idx += '# Image scaling (hor,ver), origin is at the upper-left corner or at the alignment coord (x, y)\n';
  idx += 'scale: 100%, 100%\n';
  idx += '\n';
  idx += '# Alpha blending\n';
  idx += 'alpha: 100%\n';
  idx += '\n';
  idx += '# Smoothing for very blocky images (use OLD for no filtering)\n';
  idx += 'smooth: OFF\n';
  idx += '\n';
  idx += '# In millisecs\n';
  idx += 'fadein/out: 0, 0\n';
  idx += '\n';
  idx += '# Force subtitle placement relative to (org.x, org.y)\n'
  idx += 'align: OFF at LEFT TOP\n'
  idx += '\n';
  idx += '# For correcting non-progressive desync. (in millisecs or hh:mm:ss:ms)\n';
  idx += '# Note: Not effective in DirectVobSub, use "delay: ... " instead.\n';
  idx += 'time offset: 0\n';
  idx += '\n';
  idx += '# ON: displays only forced subtitles, OFF: shows everything\n';
  idx += 'forced subs: OFF\n';
  idx += '\n';
  idx += '# The original palette of the DVD\n'
  idx += `palette: ${palette.map((p) => p.slice(1).toLowerCase()).join(', ')}\n`;
  idx += '\n';
  idx += '# Custom colors (transp idxs and the four colors)\n';
  idx += 'custom colors: OFF, tridx: 1000, colors: ffffff, faff1a, 24e731, 000000\n';
  idx += '\n';
  idx += '# Language index in use\n';
  idx += 'langidx: 0\n'
  idx += '\n';
  idx += '# ARIB\n'
  idx += 'id: und, index: 0\n'
  idx += '# Decomment next line to activate alternative name in DirectVobSub / Windows Media Player 6.x\n';
  idx += '# alt: ARIB\n'
  idx += '# Vob/Cell ID: 1, 4 (PTS: 1221921)\n'
  for (const [pts, filepos] of cues) {
    idx += `timestamp: ${timestamp(pts)}, filepos: ${filepos.toString(16).padStart(8, '0')}\n`;
  }

  writeFS(index, idx);
})();

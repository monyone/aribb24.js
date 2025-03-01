#!/usr/bin/env node

import { ARIBB24ParsedToken, ARIBB24Parser, ARIBB24ParserState } from '../../../lib/parser/parser';
import read from '../../../lib/demuxer/mpegts';
import { exit } from '../exit';
import { readableStream } from '../stream';
import { CanvasRendererOption } from '../../common/renderer/canvas/renderer-option';
import canvasRender from '../../common/renderer/canvas/renderer-strategy';
import { SVGRendererOption } from '../../common/renderer/svg/renderer-option';
import svgRender, { serializeSVG } from '../../common/renderer/svg/renderer-strategy';
import { args, ArgsOption, parseArgs } from '../args';
import { ARIBB24CaptionManagement, CaptionAssociationInformation } from '../../../lib/demuxer/b24/datagroup';
import { getTokenizeInformation } from '../info';
import { ARIBB24Token } from '../../../lib/tokenizer/token';
import { writeFS } from '../file';
import { PathElement } from '../../common/additional-symbols-glyph';

type XMLNode = string | {
  name: string;
  attributes: Record<string, string>
  children: XMLNode[]
};
const XMLNode = {
  from(name: string, attributes: Record<string, string> = {}, children: XMLNode[] = []) {
    return { name, attributes, children };
  }
}

const serializeXML = (node: XMLNode, depth: number = 0): string => {
  if (typeof node === 'string') {
    return '  '.repeat(depth) + node + '\n';
  }

  const attributes = Array.from(Object.entries(node.attributes)).map(([k, v]) => `${k}="${v}"`).join(' ');
  let result = '  '.repeat(depth) + `<${node.name}${attributes === '' ? '' : ' ' + attributes}${node.children.length === 0 ? ' /' : ''}>\n`
  if (node.children.length === 0) { return result; }

  for (const child of node.children) {
    result += serializeXML(child, depth + 1);
  }
  result += '  '.repeat(depth) + `</${node.name}>\n`;
  return result;
}

type CaptionStatementData = {
  pts: number;
  duration: number;
  info: CaptionAssociationInformation;
  initialState: ARIBB24ParserState
  data: ARIBB24Token[];
};

type IMSCData = {
  regions: XMLNode[];
  styles: XMLNode[];
  contents: XMLNode[];
};

const imageByCanvas = (begin: number, end: number, id: string, tokens: ARIBB24ParsedToken[], plane: [number, number], info: CaptionAssociationInformation, option: CanvasRendererOption, source: typeof import('@napi-rs/canvas')): IMSCData | null => {
  const offscreen = source.createCanvas(plane[0], plane[1]);
  canvasRender(offscreen as unknown as OffscreenCanvas, source.Path2D as unknown as typeof Path2D, [1, 1], tokens, info, option);

  let sx = Number.POSITIVE_INFINITY, sy = Number.POSITIVE_INFINITY, dx = 0, dy = 0;
  let found = false;
  for (const token of tokens) {
    if (token.tag === 'ClearScreen') { continue; }
    sx = Math.min(sx, token.state.margin[0] + token.state.position[0]);
    sy = Math.min(sy, token.state.margin[1] + token.state.position[1] - ARIBB24Parser.box(token.state)[1]);
    dx = Math.max(dx, token.state.margin[0] + token.state.position[0] + ARIBB24Parser.box(token.state)[0]);
    dy = Math.max(dy, token.state.margin[1] + token.state.position[1]);
    found = true;
  }
  if (!found) { return null; }

  const images: [number, number, number, number, string][] = [];
  {
    const width = dx - sx;
    const height = dy - sy;
    const image = source.createCanvas(width, height);
    const context = image.getContext('2d');
    context.drawImage(offscreen, sx, sy, width, height, 0, 0, width, height);
    images.push([sx, sy, width, height, image.toDataURL('image/png')]);
  }

  const divs = images.map(([x, y, width, height, url], index) => {
    return XMLNode.from('div', {
      'region': `r_${id}_${index}`,
    }, [
      XMLNode.from('image', {
        'tts:extent': `${width}px ${height}px`,
        'type': "image/png",
        'src': url
      })
    ]);
  });

  return {
    regions: images.map(([x, y, width, height, _], index) => {
      return XMLNode.from('region', {
        'xml:id': `r_${id}_${index}`,
        'tts:extent': `${width}px ${height}px`,
        'tts:origin': `${x}px ${y}px`,
      });
    }),
    styles: [],
    contents: [
      XMLNode.from('div', { begin: `${begin.toFixed(3)}s`, end: `${end.toFixed(3)}s` }, divs)
    ]
  }
}

const imageBySVG = (begin: number, end: number, id: string, tokens: ARIBB24ParsedToken[], info: CaptionAssociationInformation, option: SVGRendererOption): IMSCData | null => {
  const svg = svgRender(tokens, info, option);

  let sx = Number.POSITIVE_INFINITY, sy = Number.POSITIVE_INFINITY, dx = 0, dy = 0;
  let found = false;
  for (const token of tokens) {
    if (token.tag === 'ClearScreen') { continue; }
    sx = Math.min(sx, token.state.margin[0]);
    sy = Math.min(sy, token.state.margin[1]);
    dx = Math.max(dx, token.state.margin[0] + token.state.area[0]);
    dy = Math.max(dy, token.state.margin[1] + token.state.area[1]);
    found = true;
  }
  if (!found) { return null; }

  const images: [number, number, number, number, string][] = [];
  {
    const width = dx - sx;
    const height = dy - sy;
    const serialized = serializeSVG(svg);
    const dataurl = `data:image/svg+xml,${encodeURIComponent(serialized)}`;
    images.push([sx, sy, width, height, dataurl]);
  }

  const divs = images.map(([x, y, width, height, url], index) => {
    return XMLNode.from('div', {
      'region': `r_${id}_${index}`,
    }, [
      XMLNode.from('image', {
        'tts:extent': `${width}px ${height}px`,
        'type': "image/svg+xml",
        'src': url
      })
    ]);
  });

  return {
    regions: images.map(([x, y, width, height, _], index) => {
      return XMLNode.from('region', {
        'xml:id': `r_${id}_${index}`,
        'tts:extent': `${width}px ${height}px`,
        'tts:origin': `${x}px ${y}px`,
      });
    }),
    styles: [],
    contents: [
      XMLNode.from('div', { begin: `${begin.toFixed(3)}s`, end: `${end.toFixed(3)}s` }, divs)
    ]
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
    long: '--method',
    short: '-m',
    help: 'Specify Rendering Method',
    action: 'default',
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
]) satisfies ArgsOption[];

(async () => {
  const cmd = parseArgs(args(), cmdline, 'ts2sup', 'MPEG-TS ARIB Caption (Profile A) to SUP (HDMV-PGS)');
  const input = cmd['input'] ?? '-';
  const output = cmd['output'] ?? '-';
  const stroke = cmd['stroke'] ? 'black' : null;
  const method = ((cmd['method'] ?? 'canvas') as string).toLowerCase();
  const background = cmd['background'] ?? null;
  const font = cmd['font'] ?? "'Hiragino Maru Gothic Pro', 'BIZ UDGothic', 'Yu Gothic Medium', 'IPAGothic', sans-serif";
  const language = Number.isNaN(Number.parseInt(cmd['language'])) ? (cmd['language'] ?? 0) : Number.parseInt(cmd['language']);
  const glyph = cmd['glyph']
    ? (await import('../../common/additional-symbols-glyph').catch(() => ({ default: new Map<string, PathElement>()}))).default
    : new Map<string, PathElement>();

  let management: ARIBB24CaptionManagement | null = null;
  let desired: number | null = null;

  const captions: CaptionStatementData[] = [];
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
      const tokens = tokenizer.tokenize(independent.data);

      let elapsed_time = 0;
      let clear_time = Number.POSITIVE_INFINITY;
      for (const token of tokens) {
        if (token.tag === 'TimeControlWait') {
          elapsed_time += token.seconds;
        } else if (token.tag === 'ClearScreen' && elapsed_time > 0) {
          clear_time = elapsed_time;
        }
      }

      captions.push({
        pts: independent.pts,
        duration: clear_time,
        info: {
          association,
          language: entry.iso_639_language_code,
        },
        initialState: state,
        data: tokens,
      });
    }
  }

  for (let i = 0; i < captions.length - 1; i++) {
    if (captions[i].duration !== Number.POSITIVE_INFINITY) { continue; }
    captions[i].duration = captions[i + 1].pts - captions[i + 0].pts;
  }

  const header = `<?xml version="1.0" encoding="UTF-8"?>`;
  const layout = XMLNode.from('layout');
  const styling = XMLNode.from('styling');
  const head = XMLNode.from('head');
  head.children.push(layout);
  // head.children.push(styling);
  const body = XMLNode.from('body');
  const tt = XMLNode.from('tt', {
    'xmlns': 'http://www.w3.org/ns/ttml',
    'xmlns:ttm': "http://www.w3.org/ns/ttml#metadata",
    'xmlns:tts': "http://www.w3.org/ns/ttml#styling",
    'xmlns:ttp': "http://www.w3.org/ns/ttml#parameter",
    'xmlns:itts': "http://www.w3.org/ns/ttml/profile/imsc1#styling",
    'tts:extent': "1920px 1080px",
    'ttp:contentProfiles': "http://www.w3.org/ns/ttml/profile/imsc1.1/image",
  }, [head, body]);

  let id = 0;
  if (method === 'canvas') {
    const napi = await import('@napi-rs/canvas').catch(() => {
      console.error('Please install @napi-rs/canvas');
      return exit(-1);
    });
    const option = CanvasRendererOption.from({
      font: { normal: font },
      replace: { glyph: glyph },
      color: { stroke: stroke, background: background }
    });

    for (const { pts, duration, data, initialState, info } of captions) {
      const begin = pts;
      const end = begin + duration;
      if (end === Number.POSITIVE_INFINITY) { continue; }
      const parser = new ARIBB24Parser(initialState, { magnification: 2 });
      const rendered = imageByCanvas(begin, end, `${id}`, parser.parse(data), [1920, 1080], info, option, napi);
      if (rendered == null) { continue; }

      const { regions, styles, contents, } = rendered;
      body.children.push(... contents);
      layout.children.push(... regions);
      styling.children.push(... styles);
      id++;
    }
  } else if (method === 'svg') {
    const option = SVGRendererOption.from({
      font: { normal: font },
      replace: { glyph: glyph },
      color: { stroke: stroke, background: background }
    });

    for (const { pts, duration, data, initialState, info } of captions) {
      const begin = pts;
      const end = begin + duration;
      if (end === Number.POSITIVE_INFINITY) { continue; }
      const parser = new ARIBB24Parser(initialState, { magnification: 2 });
      const rendered = imageBySVG(begin, end, `${id}`, parser.parse(data), info, option);
      if (rendered == null) { continue; }

      const { regions, styles, contents, } = rendered;
      body.children.push(... contents);
      layout.children.push(... regions);
      styling.children.push(... styles);
      id++;
    }
  } else {
    console.error('UnSupported Method: Please Specify canvas or svg');
    return exit(-1);
  }

  writeFS(output, header + '\n' + serializeXML(tt));
})();

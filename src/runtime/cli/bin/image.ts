#!/usr/bin/env node

import ARIBB24JapaneseJIS8Tokenizer from '../../../lib/tokenizer/b24/jis8/ARIB';
import { ARIBB24ParsedToken, ARIBB24Parser, initialState } from '../../../lib/parser/parser';
import read from '../../../lib/demuxer/mpegts';
import { exit } from '../exit';
import { writeFS } from '../file';
import { readableStream } from '../stream';
import render from '../../common/canvas/renderer-strategy';
import { RendererOption } from '../../common/canvas/renderer-option';
import { CompositionState, EndSegment, ObjectDefinitionSegment, PaletteDefinitionSegment, PresentationCompositionSegment, SegmentType, SequenceFlag, WindowDefinitionSegment, encodeSegment } from '../../../lib/muxer/pgs/segment';
import { encodeSupFormat, ycbcr } from '../../../lib/muxer/pgs/sup';
import colortable from '../../common/colortable';
import concat from '../../../util/concat';
import { ByteBuilder } from '../../../util/bytebuilder';

const draw = (tokens: ARIBB24ParsedToken[], plane: [number, number], magnification: number, source: typeof import('@napi-rs/canvas')) => {
  let sx = Number.POSITIVE_INFINITY, sy = Number.POSITIVE_INFINITY, dx = 0, dy = 0;
  let elapsed_time = Number.POSITIVE_INFINITY;

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
  const offset = [sx, sy];
  const area = [dx - sx, dy - sy];
  if (area[0] == Number.NEGATIVE_INFINITY || area[1] === Number.NEGATIVE_INFINITY) {
    return null;
  }

  const colors = Array.from(codes).map((code) => {
    return [
      Number.parseInt(code.slice(1, 3), 16),
      Number.parseInt(code.slice(3, 5), 16),
      Number.parseInt(code.slice(5, 7), 16),
      Number.parseInt(code.slice(7, 9), 16),
    ];
  });

  const canvas = source.createCanvas(plane[0], plane[1]);
  render(canvas as unknown as OffscreenCanvas, [1, 1], tokens, { association: 'ARIB', language: 'und' }, RendererOption.from({ font: { normal: 'IPAPGothic' }}));

  const screen = source.createCanvas(area[0], area[1]);
  const context = screen.getContext('2d');
  context.drawImage(canvas, offset[0], offset[1], area[0], area[1], 0, 0, area[0], area[1]);
  const image = context.getImageData(0, 0, area[0], area[1]);
  const indexed = [];
  for (let y = 0; y < area[1]; y++) {
    for (let x = 0; x < area[0]; x++) {
      const index = (y * area[0] + x) * 4;
      const r = image.data[index + 0];
      const g = image.data[index + 1];
      const b = image.data[index + 2];
      const a = image.data[index + 3];

      let nearest_value = Number.POSITIVE_INFINITY;
      let nearest_index = -1;
      for (let i = 0; i < colors.length; i++) {
        const [dr, dg, db, da] = colors[i];
        const value = (dr - r) ** 2 + (dg - g) ** 2 + (db - b) ** 2 + (da - a) ** 2;
        if (value < nearest_value) {
          nearest_value = value;
          nearest_index = i;
        }
      }
      indexed.push(nearest_index);
    }
  }
  const builder = new ByteBuilder();
  for (const index of indexed) {
    builder.writeU8(index + 1);
  }
  const rle = builder.build();

  const pcs = {
    width: plane[0],
    height: plane[1],
    frameRate: 30,
    compositionNumber: 0,
    compositionState: CompositionState.EpochStart,
    paletteUpdateFlag: true,
    paletteId: 0,
    numberOfCompositionObject: 1,
    compositionObjects: [{
      objectId: 0,
      windowId: 0,
      objectCroppedFlag: false,
      objectHorizontalPosition: offset[0],
      objectVerticalPosition: offset[1],
    }],
  } satisfies PresentationCompositionSegment;
  const wds = {
    numberOfWindow: 1,
    windows: [{
      windowId: 0,
      windowHorizontalPosition: offset[0],
      windowVerticalPosition: offset[1],
      windowWidth: area[0],
      windowHeight: area[1],
    }]
  } satisfies WindowDefinitionSegment;
  const pds = {
    paletteID: 0,
    paletteVersionNumber: 0,
    paletteEntries: colors.map(([r, g, b, a], index) => {
      const [y, cb, cr] = ycbcr(r, g, b);
      return {
        paletteEntryID: index + 1,
        luminance: y,
        colorDifferenceBlue: cb,
        colorDifferenceRed: cr,
        transparency: a,
      }
    }),
  } satisfies PaletteDefinitionSegment;
  const ods = {
    objectId: 0,
    objectVersionNumber: 0,
    lastInSequenceFlag: SequenceFlag.FirstAndLastInSequence,
    objectDataLength: rle.byteLength + 4,
    width: area[0],
    height: area[1],
    objectData: rle,
  } satisfies ObjectDefinitionSegment;

  const sup = concat(
    encodeSupFormat(0, 0, encodeSegment(SegmentType.PCS, PresentationCompositionSegment.into(pcs))),
    encodeSupFormat(0, 0, encodeSegment(SegmentType.WDS, WindowDefinitionSegment.into(wds))),
    encodeSupFormat(0, 0, encodeSegment(SegmentType.PDS, PaletteDefinitionSegment.into(pds))),
    encodeSupFormat(0, 0, encodeSegment(SegmentType.ODS, ObjectDefinitionSegment.into(ods))),
    encodeSupFormat(0, 0, encodeSegment(SegmentType.END, EndSegment.into())),
  );

  writeFS('test.sup', sup);

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
    for await (const caption of read(await readableStream(filepath))) {
      if (caption.tag !== 'Caption') { continue; }
      if (caption.data.tag !== 'CaptionStatement') { continue; }

      const tokenizer = new ARIBB24JapaneseJIS8Tokenizer();
      const parser = new ARIBB24Parser(initialState, { magnification: 2 });

      const png = draw(parser.parse(tokenizer.tokenize(caption.data)), parser.currentState().plane, parser.getMagnification(), napi)
      if (png == null) { continue; }
      await writeFS(`${Math.floor(caption.pts * 90000)}.png`, png.buffer);
      break;
    }
  }
})();

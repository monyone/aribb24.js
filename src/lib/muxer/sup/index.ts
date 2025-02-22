import { CompositionState, encodeSegment, EndSegment, ObjectDefinitionSegment, PaletteDefinitionSegment, PresentationCompositionSegment, SegmentType, SequenceFlag, WindowDefinitionSegment } from "../../encoder/pgs";
import { encodeSupFormat, ycbcr } from "../pgs";
import concat from "../../../util/concat";

export const makeImageDataSup = (pts: number, dts: number, image: ImageData, palette: [number, number, number, number][], cache: Map<number, number>, plane: [number, number], offset: [number, number], area: [number, number]): ArrayBuffer => {
  const indexed = [];
  for (let y = 0; y < area[1]; y++) {
    for (let x = 0; x < area[0]; x++) {
      const index = (y * area[0] + x) * 4;
      const r = image.data[index + 0];
      const g = image.data[index + 1];
      const b = image.data[index + 2];
      const a = image.data[index + 3];
      const hash = (r * (2 ** 24)) + (g * (2 ** 16)) + (b * (2 ** 8)) + a;
      if (cache.has(hash)) {
        indexed.push(cache.get(hash)!);
        continue;
      }

      let nearest_value = Number.POSITIVE_INFINITY;
      let nearest_index = -1;
      for (let i = 0; i < palette.length; i++) {
        const [dr, dg, db, da] = palette[i];
        const value = (dr - r) ** 2 + (dg - g) ** 2 + (db - b) ** 2 + (da - a) ** 2;
        if (value < nearest_value) {
          nearest_value = value;
          nearest_index = i;
        }
      }
      indexed.push(nearest_index);
    }
  }
  const rle: number[] = []
  for (let i = 0; i < indexed.length; ) {
    const paletteId = indexed[i] + 1;
    let run = 0;
    while (i + run < indexed.length) {
      if (indexed[i] !== indexed[i + run]) { break; }
      run++;
    }
    i += run;

    while (run > 0) {
      if (run === 1) {
        rle.push(paletteId);
        break;
      } else if (run <= 0x3F) {
        rle.push(0);
        rle.push(0x80 | run); // color flag
        rle.push(paletteId);
        break;
      } else {
        const max = (0x3F * 2 ** 8) - 1;
        const curr = Math.min(max, run);
        rle.push(0);
        rle.push(0x80 | 0x40 | Math.floor(curr / (2 ** 8))); // color + length flag
        rle.push(Math.floor(curr % (2 ** 8))) // length
        rle.push(paletteId);
        run -= curr;
      }
    }
  }
  const object = Uint8Array.from(rle).buffer;
  const objects: ArrayBuffer[] = [];
  for (let i = 0, data = 0; data < object.byteLength; i++) {
    const max = (2 ** 16 - 1) - (i === 0 ? 4 + 7 : 4);
    const slice = object.slice(data, data + max);
    objects.push(slice);
    data = data + max;
  }

  const pallete_pcs = {
    width: plane[0],
    height: plane[1],
    frameRate: 30,
    compositionNumber: 0,
    compositionState: CompositionState.EpochStart,
    paletteUpdateFlag: true,
    paletteId: 0,
    numberOfCompositionObject: 0,
    compositionObjects: [],
  } satisfies PresentationCompositionSegment;

  const object_pcs = {
    width: plane[0],
    height: plane[1],
    frameRate: 30,
    compositionNumber: 0,
    compositionState: CompositionState.EpochStart,
    paletteUpdateFlag: false,
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
    paletteEntries: palette.map(([r, g, b, a], index) => {
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
  const ods = objects.map((object, index) => {
    if (objects.length === 1 || index === 0) {
      return {
        objectId: 0,
        objectVersionNumber: 0,
        lastInSequenceFlag: objects.length === 1 ? SequenceFlag.FirstAndLastInSequence : SequenceFlag.FirstInSequence,
        objectDataLength: object.byteLength + 4,
        width: area[0],
        height: area[1],
        objectData: object,
      }
    } else {
      return {
        objectId: 0,
        objectVersionNumber: 0,
        lastInSequenceFlag: index === objects.length - 1 ? SequenceFlag.LastInSequence : SequenceFlag.IntermediateSequence,
        objectData: object,
      }
    }
  }) satisfies ObjectDefinitionSegment[];

  return concat(
    // update palette
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 6, encodeSegment(SegmentType.PCS, PresentationCompositionSegment.into(pallete_pcs))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 5, encodeSegment(SegmentType.PDS, PaletteDefinitionSegment.into(pds))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 4, encodeSegment(SegmentType.END, EndSegment.into())),
    // present object
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 3, encodeSegment(SegmentType.PCS, PresentationCompositionSegment.into(object_pcs))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 2, encodeSegment(SegmentType.WDS, WindowDefinitionSegment.into(wds))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 1, encodeSegment(SegmentType.PDS, PaletteDefinitionSegment.into(pds))),
    ... ods.map(segment => encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000), encodeSegment(SegmentType.ODS, ObjectDefinitionSegment.into(segment)))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 0, encodeSegment(SegmentType.END, EndSegment.into())),
  );
}

export const makeEmptySup = (pts: number, dts: number, plane: [number, number]): ArrayBuffer => {
  const pcs = {
    width: plane[0],
    height: plane[1],
    frameRate: 30,
    compositionNumber: 0,
    compositionState: CompositionState.EpochStart,
    paletteUpdateFlag: false,
    paletteId: 0,
    numberOfCompositionObject: 0,
    compositionObjects: [],
  } satisfies PresentationCompositionSegment;

  return concat(
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 1, encodeSegment(SegmentType.PCS, PresentationCompositionSegment.into(pcs))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000) - 0, encodeSegment(SegmentType.END, EndSegment.into())),
  );
}

import { CompositionState, encodeSegment, EndSegment, ObjectDefinitionSegment, PaletteDefinitionSegment, PresentationCompositionSegment, SegmentType, SequenceFlag, WindowDefinitionSegment } from "../../../lib/encoder/pgs";
import { encodeSupFormat, ycbcr } from "../../../lib/muxer/pgs";
import { ByteBuilder } from "../../../util/bytebuilder";
import concat from "../../../util/concat";

export const makeImageDataSup = (pts: number, dts: number, image: ImageData, palette: [number, number, number, number][], plane: [number, number], offset: [number, number], area: [number, number]): ArrayBuffer => {
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
  const builder = new ByteBuilder();
  for (const index of indexed) {
    builder.writeU8(index + 1);
  }
  const rle = builder.build();
  const objects: ArrayBuffer[] = [];
  for (let i = 0, data = 0; data < rle.byteLength; i++) {
    const max = (2 ** 16 - 1) - (i === 0 ? 4 + 7 : 4);
    const slice = rle.slice(data, data + max);
    objects.push(slice);
    data = data + max;
  }

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
        objectDataLength: rle.byteLength + 4,
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
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000), encodeSegment(SegmentType.PCS, PresentationCompositionSegment.into(pcs))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000), encodeSegment(SegmentType.WDS, WindowDefinitionSegment.into(wds))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000), encodeSegment(SegmentType.PDS, PaletteDefinitionSegment.into(pds))),
    ... ods.map(segment => encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000), encodeSegment(SegmentType.ODS, ObjectDefinitionSegment.into(segment)))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000), encodeSegment(SegmentType.END, EndSegment.into())),
  );
}

export const makeEmptySup = (pts: number, dts: number, plane: [number, number]): ArrayBuffer => {
  const pcs = {
    width: plane[0],
    height: plane[1],
    frameRate: 30,
    compositionNumber: 0,
    compositionState: CompositionState.EpochStart,
    paletteUpdateFlag: true,
    paletteId: 0,
    numberOfCompositionObject: 1,
    compositionObjects: [],
  } satisfies PresentationCompositionSegment;

  return concat(
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000), encodeSegment(SegmentType.PCS, PresentationCompositionSegment.into(pcs))),
    encodeSupFormat(Math.floor(pts * 90000), Math.floor(dts * 90000), encodeSegment(SegmentType.END, EndSegment.into())),
  );
}

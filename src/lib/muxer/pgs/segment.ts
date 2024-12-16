import { ByteBuilder } from "../../../util/bytebuilder";

export const SegmentType = {
  PDS: 0x14,
  ODS: 0x15,
  PCS: 0x16,
  WDS: 0x17,
  END: 0x80,
} as const;

export type CompositionObjectWithCropped = {
  objectId: number;
  windowId: number;
  objectCroppedFlag: true;
  objectHorizontalPosition: number;
  objectVerticalPosition: number;
  objectCroppingHorizontalPosition: number
  objectCroppingVerticalPosition: number
  objectCroppingWidth: number
  objectCroppingHeight: number
}
export type CompositionObjectWithoutCropped = {
  objectId: number;
  windowId: number;
  objectCroppedFlag: false;
  objectHorizontalPosition: number;
  objectVerticalPosition: number;
}
export type CompositionObject = CompositionObjectWithCropped | CompositionObjectWithoutCropped;
export const CompositionObject = {
  into(co: CompositionObject): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU16(co.objectId);
    builder.writeU8(co.windowId);
    builder.writeU8(co.objectCroppedFlag ? 0x80 : 0x00);
    builder.writeU16(co.objectHorizontalPosition);
    builder.writeU16(co.objectVerticalPosition);
    if (!co.objectCroppedFlag) { return builder.build(); }
    builder.writeU16(co.objectCroppingHorizontalPosition);
    builder.writeU16(co.objectCroppingVerticalPosition);
    builder.writeU16(co.objectCroppingWidth);
    builder.writeU16(co.objectCroppingHeight);
    return builder.build();
  }
}

export const CompositionState = {
  Normal: 0x00,
  AcquisitionPoint: 0x40,
  EpochStart: 0x80,
} as const;
export type PresentationCompositionSegment = {
  width: number;
  height: number;
  frameRate: number;
  compositionNumber: number;
  compositionState: (typeof CompositionState)[keyof typeof CompositionState];
  paletteUpdateFlag: boolean;
  paletteId: number;
  numberOfCompositionObject: number;
  compositionObjects: CompositionObject[];
}
export const PresentationCompositionSegment = {
  into(pcs: PresentationCompositionSegment): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU16(pcs.width);
    builder.writeU16(pcs.height);
    builder.writeU8(pcs.frameRate);
    builder.writeU16(pcs.compositionNumber);
    builder.writeU8(pcs.compositionState);
    builder.writeU8(pcs.paletteUpdateFlag ? 0x80 : 0x00);
    builder.writeU8(pcs.paletteId);
    builder.writeU8(pcs.numberOfCompositionObject);
    for (const composition of pcs.compositionObjects) {
      builder.write(CompositionObject.into(composition));
    }
    return builder.build();
  }
}

export type WindowDefinition = {
  windowId: number;
  windowHorizontalPosition: number;
  windowVerticalPosition: number;
  windowWidth: number;
  windowHeight: number;
};
export const WindowDefinition = {
  into(wd: WindowDefinition): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU8(wd.windowId);
    builder.writeU16(wd.windowHorizontalPosition);
    builder.writeU16(wd.windowVerticalPosition);
    builder.writeU16(wd.windowWidth);
    builder.writeU16(wd.windowHeight);
    return builder.build();
  }
}

export type WindowDefinitionSegment = {
  numberOfWindow: number;
  windows: WindowDefinition[];
}
export const WindowDefinitionSegment = {
  into(wds: WindowDefinitionSegment): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU8(wds.numberOfWindow);
    for (const window of wds.windows) {
      builder.write(WindowDefinition.into(window));
    }
    return builder.build();
  }
}

export type PaletteEntry = {
  paletteEntryID: number;
  luminance: number;
  colorDifferenceRed: number;
  colorDifferenceBlue: number;
  transparency: number;
}
export const PaletteEntry = {
  into(palette: PaletteEntry): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU8(palette.paletteEntryID);
    builder.writeU8(palette.luminance);
    builder.writeU8(palette.colorDifferenceRed);
    builder.writeU8(palette.colorDifferenceBlue);
    builder.writeU8(palette.transparency);
    return builder.build();
  }
}

export type PaletteDefinitionSegment = {
  paletteID: number;
  paletteVersionNumber: number;
  paletteEntries: PaletteEntry[];
}
export const PaletteDefinitionSegment = {
  into(pds: PaletteDefinitionSegment): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU8(pds.paletteID);
    builder.writeU8(pds.paletteVersionNumber);
    for (const palette of pds.paletteEntries) {
      builder.write(PaletteEntry.into(palette));
    }
    return builder.build();
  }
}

export const SequenceFlag = {
  LastInSequence: 0x40,
  FirstInSequence: 0x80,
  FirstAndLastInSequence: 0xC0,
  IntermediateSequence: 0x00
} as const;

type ObjectDefinitionSegmentFirstInSequence = {
  objectId: number;
  objectVersionNumber: number;
  lastInSequenceFlag: typeof SequenceFlag.FirstInSequence | typeof SequenceFlag.FirstAndLastInSequence;
  objectDataLength: number;
  width: number;
  height: number;
  objectData: ArrayBuffer;
}
type ObjectDefinitionSegmentOtherSequence = {
  objectId: number;
  objectVersionNumber: number;
  lastInSequenceFlag: typeof SequenceFlag.LastInSequence | typeof SequenceFlag.IntermediateSequence;
  objectData: ArrayBuffer;
}

export type ObjectDefinitionSegment = ObjectDefinitionSegmentFirstInSequence | ObjectDefinitionSegmentOtherSequence

export const ObjectDefinitionSegment = {
  into(ods: ObjectDefinitionSegment): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU16(ods.objectId);
    builder.writeU8(ods.objectVersionNumber);
    builder.writeU8(ods.lastInSequenceFlag);
    if (ods.lastInSequenceFlag === SequenceFlag.FirstInSequence || ods.lastInSequenceFlag === SequenceFlag.FirstAndLastInSequence) {
      builder.writeU24(ods.objectDataLength);
      builder.writeU16(ods.width);
      builder.writeU16(ods.height);
      builder.write(ods.objectData);
    } else {
      builder.write(ods.objectData);
    }
    return builder.build();
  }
}

export type EndSegment = {};
export const EndSegment = {
  into(): ArrayBuffer {
    return new ArrayBuffer(0);
  }
}

export const encodeSegment = (type: (typeof SegmentType)[keyof typeof SegmentType], data: ArrayBuffer): ArrayBuffer => {
  const builder = new ByteBuilder();
  const length = data.byteLength;
  if (length >= 2 ** 16) { throw new Error('Exceeded Segment Length'); }

  builder.writeU8(type);
  builder.writeU16(length);
  builder.write(data);
  return builder.build();
}

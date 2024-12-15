import { ByteBuilder } from "../../../util/bytebuilder";
import { ByteStream } from "../../../util/bytestream";
import { UnexpectedFormatError } from "../../../util/error";

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
  from(stream: ByteStream): CompositionObject {
    const objectId = stream.readU16();
    const windowId = stream.readU8();
    const objectCroppedFlag = stream.readU8() !== 0x00;
    const objectHorizontalPosition = stream.readU16();
    const objectVerticalPosition = stream.readU16();
    if (!objectCroppedFlag) {
      return {
        objectId,
        windowId,
        objectCroppedFlag,
        objectHorizontalPosition,
        objectVerticalPosition,
      };
    }

    const objectCroppingHorizontalPosition = stream.readU16();
    const objectCroppingVerticalPosition = stream.readU16();
    const objectCroppingWidth = stream.readU16();
    const objectCroppingHeight = stream.readU16();
    return {
      objectId,
      windowId,
      objectCroppedFlag,
      objectHorizontalPosition,
      objectVerticalPosition,
      objectCroppingHorizontalPosition,
      objectCroppingVerticalPosition,
      objectCroppingWidth,
      objectCroppingHeight,
    };
  },
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
  from(stream: ByteStream): PresentationCompositionSegment {
    const width = stream.readU16();
    const height = stream.readU16();
    const frameRate = stream.readU8();
    const compositionNumber = stream.readU16();
    const compositionState = stream.readU8();
    if (compositionState !== CompositionState.Normal && compositionState !== CompositionState.AcquisitionPoint && compositionState !== CompositionState.EpochStart) {
      throw new UnexpectedFormatError('Invalid compositionState');
    }
    const paletteUpdateFlag = stream.readU8() === 0x80;
    const paletteId = stream.readU8();
    const numberOfCompositionObject = stream.readU8();
    const compositionObjects: CompositionObject[] = [];
    for (let i = 0; i < numberOfCompositionObject; i++) {
      compositionObjects.push(CompositionObject.from(stream));
    }

    return {
      width,
      height,
      frameRate,
      compositionNumber,
      compositionState,
      paletteUpdateFlag,
      paletteId,
      numberOfCompositionObject,
      compositionObjects,
    };
  },
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
  from(stream: ByteStream): WindowDefinition {
    const windowId = stream.readU8();
    const windowHorizontalPosition = stream.readU16();
    const windowVerticalPosition = stream.readU16();
    const windowWidth = stream.readU16();
    const windowHeight = stream.readU16();

    return {
      windowId,
      windowHorizontalPosition,
      windowVerticalPosition,
      windowWidth,
      windowHeight,
    };
  },
  into(wd: WindowDefinition): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU8(wd.windowId);
    builder.writeU8(wd.windowHorizontalPosition);
    builder.writeU8(wd.windowVerticalPosition);
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
  from(stream: ByteStream): WindowDefinitionSegment {
    const numberOfWindow = stream.readU8();
    const windows: WindowDefinition[] = [];
    for (let i = 0; i < numberOfWindow; i++) {
      windows.push(WindowDefinition.from(stream));
    }

    return {
      numberOfWindow,
      windows,
    };
  },
  info(wds: WindowDefinitionSegment): ArrayBuffer {
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
  from(stream: ByteStream): PaletteEntry {
    const paletteEntryID = stream.readU8();
    const luminance = stream.readU8();
    const colorDifferenceRed = stream.readU8();
    const colorDifferenceBlue = stream.readU8();
    const transparency = stream.readU8();

    return {
      paletteEntryID,
      luminance,
      colorDifferenceRed,
      colorDifferenceBlue,
      transparency,
    };
  },
  into(palette: PaletteEntry): ArrayBuffer {
    const builder = new ByteBuilder();
    builder.writeU16(palette.paletteEntryID);
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
  from(stream: ByteStream): PaletteDefinitionSegment {
    const paletteID = stream.readU8()
    const paletteVersionNumber = stream.readU8()
    const paletteEntries: PaletteEntry[] = [];
    while (!stream.isEmpty()) {
      paletteEntries.push(PaletteEntry.from(stream));
    }

    return {
      paletteID,
      paletteVersionNumber,
      paletteEntries,
    };
  },
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
  from(stream: ByteStream): ObjectDefinitionSegment {
    const objectId = stream.readU16()
    const objectVersionNumber = stream.readU8()
    const lastInSequenceFlag = stream.readU8()
    if (lastInSequenceFlag === SequenceFlag.FirstInSequence || lastInSequenceFlag === SequenceFlag.FirstAndLastInSequence) {
      const objectDataLength = stream.readU24()
      const width = stream.readU16()
      const height = stream.readU16()
      const objectData = stream.readAll();
      return {
        objectId,
        objectVersionNumber,
        lastInSequenceFlag,
        objectDataLength,
        width,
        height,
        objectData
      };
    } else if (lastInSequenceFlag === SequenceFlag.LastInSequence || lastInSequenceFlag === SequenceFlag.IntermediateSequence) {
      const objectData = stream.readAll();
      return {
        objectId,
        objectVersionNumber,
        lastInSequenceFlag,
        objectData,
      };
    } else {
      throw new UnexpectedFormatError('lastInSequenceFlag Invalid')
    }
  },
  info(ods: ObjectDefinitionSegment): ArrayBuffer {
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
    return new ArrayBuffer()
  }
}


const encodeSegment = (type: (typeof SegmentType)[keyof typeof SegmentType], data: ArrayBuffer) => {
  const builder = new ByteBuilder();
  const length = data.byteLength;
  if (length >= 2 ** 16) { throw new Error('Exceeded Segment Length'); }

  builder.writeU8(type);
  builder.writeU16(length);
  builder.write(data);
}

export const encodeSupFormat = (pts: number, dts: number, data: ArrayBuffer) => {
  const builder = new ByteBuilder();
  builder.writeU16(0x5047); // magic
  builder.writeU32(pts);
  builder.writeU32(dts);
  builder.write(data);
  return builder.build();
}

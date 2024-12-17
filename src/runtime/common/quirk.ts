import { ARIBB24_CHARACTER_SIZE } from "../../lib/parser/parser";
import { CaptionAssociationInformation } from "../../lib/demuxer/b24/datagroup";

export const shouldHalfWidth = (size: (typeof ARIBB24_CHARACTER_SIZE)[keyof typeof ARIBB24_CHARACTER_SIZE], info: CaptionAssociationInformation): boolean => {
  if (info.association === 'SBTVD') {
    return size === ARIBB24_CHARACTER_SIZE.Small || size === ARIBB24_CHARACTER_SIZE.Middle;
  }

  return size === ARIBB24_CHARACTER_SIZE.Middle;
}

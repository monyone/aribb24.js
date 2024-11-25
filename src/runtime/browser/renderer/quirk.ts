import { CHARACTER_SIZE } from "../../../lib/parser/parser";
import { CaptionAssociationInformation } from "../../../lib/demuxer/b24/datagroup";

export const shouldHalfWidth = (size: (typeof CHARACTER_SIZE)[keyof typeof CHARACTER_SIZE], info: CaptionAssociationInformation): boolean => {
  if (info.association === 'SBTVD') {
    return size === CHARACTER_SIZE.Small || size === CHARACTER_SIZE.Middle;
  }

  return size === CHARACTER_SIZE.Middle;
}

export const shouldRemoveTransparentSpace = (info: CaptionAssociationInformation) => {
  if (info.association === 'SBTVD') { return true; }
  return false;
}

export const shouldNotAssumeUseClearScreen = (info: CaptionAssociationInformation) => {
  if (info.association === 'SBTVD') { return true; }
  return false;
}

export const shouldIgnoreSmallAsRuby = (size: (typeof CHARACTER_SIZE)[keyof typeof CHARACTER_SIZE], info: CaptionAssociationInformation): boolean => {
  // ARIB Caption in Japanese use SSZ to ruby
  if (info.association !== 'ARIB') { return false; }
  if (info.language !== 'jpn') { return false; }
  return size === CHARACTER_SIZE.Small;
}

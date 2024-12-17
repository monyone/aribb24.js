import { ARIBB24_CHARACTER_SIZE } from "../../../lib/parser/parser";
import { CaptionAssociationInformation } from "../../../lib/demuxer/b24/datagroup";

export { shouldHalfWidth } from "../../common/quirk";

export const shouldRemoveTransparentSpace = (info: CaptionAssociationInformation) => {
  if (info.association === 'SBTVD') { return true; }
  return false;
}

export const shouldNotAssumeUseClearScreen = (info: CaptionAssociationInformation) => {
  if (info.association === 'SBTVD') { return true; }
  return false;
}

export const shouldIgnoreSmallAsRuby = (size: (typeof ARIBB24_CHARACTER_SIZE)[keyof typeof ARIBB24_CHARACTER_SIZE], info: CaptionAssociationInformation): boolean => {
  // ARIB Caption in Japanese use SSZ to ruby
  if (info.association !== 'ARIB') { return false; }
  if (info.language !== 'jpn') { return false; }
  return size === ARIBB24_CHARACTER_SIZE.Small;
}

import { CHARACTER_SIZE } from "../../parser";
import { CaptionLanguageInformation } from "../../tokenizer/b24/datagroup";

export const shouldHalfWidth = (size: (typeof CHARACTER_SIZE)[keyof typeof CHARACTER_SIZE], info: CaptionLanguageInformation): boolean => {
  if (info.association === 'SBTVD') {
    return size === CHARACTER_SIZE.Small || size === CHARACTER_SIZE.Middle;
  }

  return size === CHARACTER_SIZE.Middle;
}

export const shouldIgnoreSmallAsRuby = (size: (typeof CHARACTER_SIZE)[keyof typeof CHARACTER_SIZE], info: CaptionLanguageInformation): boolean => {
  // ARIB Caption in Japanese
  if (info.association !== 'ARIB') { return false; }
  if (info.language !== 'jpn') { return false; }
  return size === CHARACTER_SIZE.Small;
}

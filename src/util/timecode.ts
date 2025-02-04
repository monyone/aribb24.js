import { UnexpectedFormatError } from "./error";

const timecodeRegex = /^(\d\d):(\d\d):(\d\d);(\d\d)$/;
const EPS = 1e-5;

export const timecodeToFramecount = (timecode: string): number => {
  const matched = timecode.match(timecodeRegex)
  if (matched == null) { throw new UnexpectedFormatError('Unexpected TimeCode'); }
  const HH = Number.parseInt(matched[1], 10);
  const MM = Number.parseInt(matched[2], 10);
  const SS = Number.parseInt(matched[3], 10);
  const FF = Number.parseInt(matched[4], 10);

  const minutes = (HH * 60) + MM;
  const nondrop = (((((HH * 60) + MM) * 60) + SS) * 30) + FF;
  const drop = nondrop - (minutes - Math.floor(minutes / 10)) * 2;
  return drop;
}

export const secondToFrameCount = (second: number): number => {
  return Math.floor(second * 30000 / 1001 + EPS);
}

export const framecountToTimecode = (framecount: number): string => {
  const HH = Math.floor(framecount / 107892);
  const MM = Math.floor((framecount + 2 * Math.floor((framecount - 107892 * HH) / 1800) - 2 * Math.floor((framecount - 107892 * HH) / 18000) - (107892 * HH)) / 1800);
  const SS = Math.floor((framecount - 1798 * MM - 2 * Math.floor(MM / 10) - (107892 * HH)) / 30);
  const FF = framecount - 30 * SS - 1798 * MM - 2 * Math.floor(MM / 10) - (107892 * HH);
  return `${HH.toString(10).padStart(2, '0')}:${MM.toString(10).padStart(2, '0')}:${SS.toString(10).padStart(2, '0')};${FF.toString(10).padStart(2, '0')}`;
}
export const framecountToSecond = (framecount: number): number => {
  return Math.ceil((framecount * 1001 / 30000) * 1000) / 1000;
}

export const secondsToTimecode = (second: number): string => {
  return framecountToTimecode(secondToFrameCount(second));
}

export const timecodeToSecond = (timecode: string): number => {
  return framecountToSecond(timecodeToFramecount(timecode));
}

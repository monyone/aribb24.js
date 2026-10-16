import { UnexpectedFormatError, ExhaustivenessError } from "./error";

export const FPS = [
  '30',
  '29.97',
] as const;
export type ALL_FPS_VALUES = (typeof FPS)[number];
export const isDropFrame = (fps: ALL_FPS_VALUES): boolean => {
  return fps === '29.97';
}

const timecodeDFRegex = /^(\d\d):(\d\d):(\d\d);(\d\d)$/;
const timecodeNDFRegex = /^(\d\d):(\d\d):(\d\d):(\d\d)$/;
const EPS = 1e-5;

export const timecodeToFramecount = (timecode: string, fps: ALL_FPS_VALUES): number => {
  switch (fps) {
    case '29.97': { // 29.97 で NDF の場合もあるにはあるが... 基本使わないので対応しない
      const matched = timecode.match(timecodeDFRegex);
      if (matched == null) { throw new UnexpectedFormatError('Unexpected TimeCode'); }
      const HH = Number.parseInt(matched[1], 10);
      const MM = Number.parseInt(matched[2], 10);
      const SS = Number.parseInt(matched[3], 10);
      const FF = Number.parseInt(matched[4], 10);

      const minutes = (HH * 60) + MM;
      const nondrop = (((((HH * 60) + MM) * 60) + SS) * 30) + FF;
      const drop = nondrop - (minutes - Math.floor(minutes / 10)) * 2;
      return drop
    }
    case '30': {
      const matched = timecode.match(timecodeNDFRegex);
      if (matched == null) { throw new UnexpectedFormatError('Unexpected TimeCode'); }
      const HH = Number.parseInt(matched[1], 10);
      const MM = Number.parseInt(matched[2], 10);
      const SS = Number.parseInt(matched[3], 10);
      const FF = Number.parseInt(matched[4], 10);

      const nondrop = (((((HH * 60) + MM) * 60) + SS) * 30) + FF;
      return nondrop;
    }
    default: throw new ExhaustivenessError(fps, 'Unsupported FPS Value!');
  }
}

export const secondToFrameCount = (second: number, fps: ALL_FPS_VALUES): number => {
  switch (fps) {
    case '29.97': return Math.floor(second * 30000 / 1001 + EPS);
    case '30': return Math.floor(second * 30 + EPS);
    default: throw new ExhaustivenessError(fps, 'Unsupported FPS Value!');
  }
}

export const framecountToTimecode = (framecount: number, fps: ALL_FPS_VALUES): string => {
  switch (fps) {
    case '29.97': { // 29.97 で NDF の場合もあるにはあるが使わないので対応しない
      const HH = Math.floor(framecount / 107892);
      const MM = Math.floor((framecount + 2 * Math.floor((framecount - 107892 * HH) / 1800) - 2 * Math.floor((framecount - 107892 * HH) / 18000) - (107892 * HH)) / 1800);
      const SS = Math.floor((framecount - 1798 * MM - 2 * Math.floor(MM / 10) - (107892 * HH)) / 30);
      const FF = framecount - 30 * SS - 1798 * MM - 2 * Math.floor(MM / 10) - (107892 * HH);
      return `${HH.toString(10).padStart(2, '0')}:${MM.toString(10).padStart(2, '0')}:${SS.toString(10).padStart(2, '0')};${FF.toString(10).padStart(2, '0')}`;
    }
    case '30': {
      const FF = framecount % 30;
      const SS = Math.floor(framecount / 30) % 60;
      const MM = Math.floor(framecount / (30 * 60)) % 60;
      const HH = Math.floor(framecount / (30 * 60 * 60));
      return `${HH.toString(10).padStart(2, '0')}:${MM.toString(10).padStart(2, '0')}:${SS.toString(10).padStart(2, '0')}:${FF.toString(10).padStart(2, '0')}`;
    }
    default: throw new ExhaustivenessError(fps, 'Unsupported FPS Value!');
  }
}
export const framecountToSecond = (framecount: number, fps: ALL_FPS_VALUES): number => {
  switch (fps) {
    case '29.97': return Math.ceil((framecount * 1001 / 30000) * 1000) / 1000;
    case '30': return framecount / 30;
    default: throw new ExhaustivenessError(fps, 'Unsupported FPS Value!');
  }
}

export const secondsToTimecode = (second: number, fps: ALL_FPS_VALUES ): string => {
  return framecountToTimecode(secondToFrameCount(second, fps), fps);
}

export const timecodeToSecond = (timecode: string, fps: ALL_FPS_VALUES): number => {
  return framecountToSecond(timecodeToFramecount(timecode, fps), fps);
}

import { describe, test, expect } from 'vitest';
import { timecodeToFramecount, framecountToTimecode, framecountToSecond, secondToFrameCount, secondsToTimecode, timecodeToSecond } from '@/util/timecode'
import { UnexpectedFormatError } from '@/util/error';

describe("ARIB STD-B36 Muxer Demuxer Consistenty", () => {
  test('Drop Timecode to Framecount', () => {
    expect(timecodeToFramecount('10:00:00;00', '29.97')).toStrictEqual(1078920);
    expect(timecodeToFramecount('00:00:59;29', '29.97')).toStrictEqual(1799);
    expect(timecodeToFramecount('00:01:00;02', '29.97')).toStrictEqual(1800);
    expect(timecodeToFramecount('00:10:00;00', '29.97')).toStrictEqual(17982);
  });

  test('NonDrop Timecode to 29.97 is throw UnexpectedFormatError', () => {
    expect(() => timecodeToFramecount('10:00:00:00', '29.97')).toThrowError(UnexpectedFormatError);
  });

  test('Drop Timecode to 30 is throw UnexpectedFormatError', () => {
    expect(() => timecodeToFramecount('10:00:00;00', '30')).toThrowError(UnexpectedFormatError);
  });

  test('Drop Timecode and Framecount roundtrip', () => {
    expect(framecountToTimecode(timecodeToFramecount('00:00:00;29', '29.97'), '29.97')).toStrictEqual('00:00:00;29');
    expect(framecountToTimecode(timecodeToFramecount('00:01:00;02', '29.97'), '29.97')).toStrictEqual('00:01:00;02');
    expect(framecountToTimecode(timecodeToFramecount('00:01:00;29', '29.97'), '29.97')).toStrictEqual('00:01:00;29');
    expect(framecountToTimecode(timecodeToFramecount('00:02:00;02', '29.97'), '29.97')).toStrictEqual('00:02:00;02');
    expect(framecountToTimecode(timecodeToFramecount('00:02:00;29', '29.97'), '29.97')).toStrictEqual('00:02:00;29');
    expect(framecountToTimecode(timecodeToFramecount('00:03:00;02', '29.97'), '29.97')).toStrictEqual('00:03:00;02');
    expect(framecountToTimecode(timecodeToFramecount('10:00:00;00', '29.97'), '29.97')).toStrictEqual('10:00:00;00');
    expect(framecountToTimecode(timecodeToFramecount('00:10:00;00', '29.97'), '29.97')).toStrictEqual('00:10:00;00');
    expect(framecountToTimecode(timecodeToFramecount('00:00:10;00', '29.97'), '29.97')).toStrictEqual('00:00:10;00');
    expect(framecountToTimecode(timecodeToFramecount('00:00:00;10', '29.97'), '29.97')).toStrictEqual('00:00:00;10');
    expect(framecountToTimecode(timecodeToFramecount('00:10:59;29', '29.97'), '29.97')).toStrictEqual('00:10:59;29');
    expect(framecountToTimecode(timecodeToFramecount('00:11:00;02', '29.97'), '29.97')).toStrictEqual('00:11:00;02');
    expect(framecountToTimecode(timecodeToFramecount('00:00:11;00', '29.97'), '29.97')).toStrictEqual('00:00:11;00');
    expect(framecountToTimecode(timecodeToFramecount('00:00:59;29', '29.97'), '29.97')).toStrictEqual('00:00:59;29');
    expect(framecountToTimecode(timecodeToFramecount('00:01:59;29', '29.97'), '29.97')).toStrictEqual('00:01:59;29');
    expect(framecountToTimecode(timecodeToFramecount('00:11:59;29', '29.97'), '29.97')).toStrictEqual('00:11:59;29');
    expect(framecountToTimecode(timecodeToFramecount('02:22:59;29', '29.97'), '29.97')).toStrictEqual('02:22:59;29');
    expect(framecountToTimecode(timecodeToFramecount('14:12:00;02', '29.97'), '29.97')).toStrictEqual('14:12:00;02');
    expect(framecountToTimecode(timecodeToFramecount('23:59:59;29', '29.97'), '29.97')).toStrictEqual('23:59:59;29');
  });

  test('NonDrop Timecode and Framecount roundtrip', () => {
    expect(framecountToTimecode(timecodeToFramecount('00:00:00:29', '30'), '30')).toStrictEqual('00:00:00:29');
    expect(framecountToTimecode(timecodeToFramecount('00:01:00:02', '30'), '30')).toStrictEqual('00:01:00:02');
    expect(framecountToTimecode(timecodeToFramecount('00:01:00:29', '30'), '30')).toStrictEqual('00:01:00:29');
    expect(framecountToTimecode(timecodeToFramecount('00:02:00:02', '30'), '30')).toStrictEqual('00:02:00:02');
    expect(framecountToTimecode(timecodeToFramecount('00:02:00:29', '30'), '30')).toStrictEqual('00:02:00:29');
    expect(framecountToTimecode(timecodeToFramecount('00:03:00:02', '30'), '30')).toStrictEqual('00:03:00:02');
    expect(framecountToTimecode(timecodeToFramecount('10:00:00:00', '30'), '30')).toStrictEqual('10:00:00:00');
    expect(framecountToTimecode(timecodeToFramecount('00:10:00:00', '30'), '30')).toStrictEqual('00:10:00:00');
    expect(framecountToTimecode(timecodeToFramecount('00:00:10:00', '30'), '30')).toStrictEqual('00:00:10:00');
    expect(framecountToTimecode(timecodeToFramecount('00:00:00:10', '30'), '30')).toStrictEqual('00:00:00:10');
    expect(framecountToTimecode(timecodeToFramecount('00:10:59:29', '30'), '30')).toStrictEqual('00:10:59:29');
    expect(framecountToTimecode(timecodeToFramecount('00:11:00:02', '30'), '30')).toStrictEqual('00:11:00:02');
    expect(framecountToTimecode(timecodeToFramecount('00:00:11:00', '30'), '30')).toStrictEqual('00:00:11:00');
    expect(framecountToTimecode(timecodeToFramecount('00:00:59:29', '30'), '30')).toStrictEqual('00:00:59:29');
    expect(framecountToTimecode(timecodeToFramecount('00:01:59:29', '30'), '30')).toStrictEqual('00:01:59:29');
    expect(framecountToTimecode(timecodeToFramecount('00:11:59:29', '30'), '30')).toStrictEqual('00:11:59:29');
    expect(framecountToTimecode(timecodeToFramecount('02:22:59:29', '30'), '30')).toStrictEqual('02:22:59:29');
    expect(framecountToTimecode(timecodeToFramecount('14:12:00:02', '30'), '30')).toStrictEqual('14:12:00:02');
    expect(framecountToTimecode(timecodeToFramecount('23:59:59:29', '30'), '30')).toStrictEqual('23:59:59:29');
  });

  test('Drop Timecode and Second roundtrip', () => {
    expect(secondsToTimecode(timecodeToSecond('00:00:00;29', '29.97'), '29.97')).toStrictEqual('00:00:00;29');
    expect(secondsToTimecode(timecodeToSecond('00:01:00;02', '29.97'), '29.97')).toStrictEqual('00:01:00;02');
    expect(secondsToTimecode(timecodeToSecond('00:01:00;29', '29.97'), '29.97')).toStrictEqual('00:01:00;29');
    expect(secondsToTimecode(timecodeToSecond('00:02:00;02', '29.97'), '29.97')).toStrictEqual('00:02:00;02');
    expect(secondsToTimecode(timecodeToSecond('00:02:00;29', '29.97'), '29.97')).toStrictEqual('00:02:00;29');
    expect(secondsToTimecode(timecodeToSecond('00:03:00;02', '29.97'), '29.97')).toStrictEqual('00:03:00;02');
    expect(secondsToTimecode(timecodeToSecond('10:00:00;00', '29.97'), '29.97')).toStrictEqual('10:00:00;00');
    expect(secondsToTimecode(timecodeToSecond('00:10:00;00', '29.97'), '29.97')).toStrictEqual('00:10:00;00');
    expect(secondsToTimecode(timecodeToSecond('00:00:10;00', '29.97'), '29.97')).toStrictEqual('00:00:10;00');
    expect(secondsToTimecode(timecodeToSecond('00:00:00;10', '29.97'), '29.97')).toStrictEqual('00:00:00;10');
    expect(secondsToTimecode(timecodeToSecond('00:10:59;29', '29.97'), '29.97')).toStrictEqual('00:10:59;29');
    expect(secondsToTimecode(timecodeToSecond('00:11:00;02', '29.97'), '29.97')).toStrictEqual('00:11:00;02');
    expect(secondsToTimecode(timecodeToSecond('00:00:11;00', '29.97'), '29.97')).toStrictEqual('00:00:11;00');
    expect(secondsToTimecode(timecodeToSecond('00:00:59;29', '29.97'), '29.97')).toStrictEqual('00:00:59;29');
    expect(secondsToTimecode(timecodeToSecond('00:01:59;29', '29.97'), '29.97')).toStrictEqual('00:01:59;29');
    expect(secondsToTimecode(timecodeToSecond('00:11:59;29', '29.97'), '29.97')).toStrictEqual('00:11:59;29');
    expect(secondsToTimecode(timecodeToSecond('02:22:59;29', '29.97'), '29.97')).toStrictEqual('02:22:59;29');
    expect(secondsToTimecode(timecodeToSecond('14:12:00;02', '29.97'), '29.97')).toStrictEqual('14:12:00;02');
    expect(secondsToTimecode(timecodeToSecond('23:59:59;29', '29.97'), '29.97')).toStrictEqual('23:59:59;29');
  });

  test('NonDrop Timecode and Second roundtrip', () => {
    expect(secondsToTimecode(timecodeToSecond('00:00:00:29', '30'), '30')).toStrictEqual('00:00:00:29');
    expect(secondsToTimecode(timecodeToSecond('00:01:00:02', '30'), '30')).toStrictEqual('00:01:00:02');
    expect(secondsToTimecode(timecodeToSecond('00:01:00:29', '30'), '30')).toStrictEqual('00:01:00:29');
    expect(secondsToTimecode(timecodeToSecond('00:02:00:02', '30'), '30')).toStrictEqual('00:02:00:02');
    expect(secondsToTimecode(timecodeToSecond('00:02:00:29', '30'), '30')).toStrictEqual('00:02:00:29');
    expect(secondsToTimecode(timecodeToSecond('00:03:00:02', '30'), '30')).toStrictEqual('00:03:00:02');
    expect(secondsToTimecode(timecodeToSecond('10:00:00:00', '30'), '30')).toStrictEqual('10:00:00:00');
    expect(secondsToTimecode(timecodeToSecond('00:10:00:00', '30'), '30')).toStrictEqual('00:10:00:00');
    expect(secondsToTimecode(timecodeToSecond('00:00:10:00', '30'), '30')).toStrictEqual('00:00:10:00');
    expect(secondsToTimecode(timecodeToSecond('00:00:00:10', '30'), '30')).toStrictEqual('00:00:00:10');
    expect(secondsToTimecode(timecodeToSecond('00:10:59:29', '30'), '30')).toStrictEqual('00:10:59:29');
    expect(secondsToTimecode(timecodeToSecond('00:11:00:02', '30'), '30')).toStrictEqual('00:11:00:02');
    expect(secondsToTimecode(timecodeToSecond('00:00:11:00', '30'), '30')).toStrictEqual('00:00:11:00');
    expect(secondsToTimecode(timecodeToSecond('00:00:59:29', '30'), '30')).toStrictEqual('00:00:59:29');
    expect(secondsToTimecode(timecodeToSecond('00:01:59:29', '30'), '30')).toStrictEqual('00:01:59:29');
    expect(secondsToTimecode(timecodeToSecond('00:11:59:29', '30'), '30')).toStrictEqual('00:11:59:29');
    expect(secondsToTimecode(timecodeToSecond('02:22:59:29', '30'), '30')).toStrictEqual('02:22:59:29');
    expect(secondsToTimecode(timecodeToSecond('14:12:00:02', '30'), '30')).toStrictEqual('14:12:00:02');
    expect(secondsToTimecode(timecodeToSecond('23:59:59:29', '30'), '30')).toStrictEqual('23:59:59:29');
  });

  test('Seconds and Drop Timecode roundtrip', () => {
    expect(timecodeToSecond(secondsToTimecode(1001, '29.97'), '29.97')).toStrictEqual(1001);
  });
});

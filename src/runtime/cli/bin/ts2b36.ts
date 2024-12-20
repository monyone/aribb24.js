#!/usr/bin/env node
import read from '../../../lib/demuxer/mpegts';
import { exit } from '../exit';
import { writeFS } from '../file';
import { readableStream } from '../stream';
import { args, ArgsOption, parseArgs } from '../args';
import { ARIBB24CaptionManagement } from '../../../lib/demuxer/b24/datagroup';
import muxDatagroup from '../../../lib/muxer/b36/datagroup';
import muxB36 from '../../../lib/muxer/b36'
import { ARIBB36Data, ARIBB36PageData } from '../../../lib/demuxer/b36';
import { getTokenizeInformation } from '../info';

const cmdline = ([
  {
    long: '--input',
    short: '-i',
    help: 'Specify Input File (.ts)',
    action: 'default',
  },
  {
    long: '--output',
    short: '-o',
    help: 'Specify Output File (.sup)',
    action: 'default'
  },
  {
    long: '--language',
    short: '-l',
    help: 'Specify language',
    action: 'default',
  },
  {
    long: '--help',
    short: '-h',
    help: 'Show help message',
    action: 'help',
  }
]) satisfies ArgsOption[];

(async () => {
  const cmd = parseArgs(args(), cmdline, 'ts2sup', 'MPEG-TS ARIB Caption (Profile A) to SUP (HDMV-PGS)');
  const input = cmd['input'] ?? '-';
  const output = cmd['output'] ?? '-';
  const language = Number.isNaN(Number.parseInt(cmd['language'])) ? (cmd['language'] ?? 0) : Number.parseInt(cmd['language']);

  const pages: ARIBB36PageData[] = [];
  {
    let management: ARIBB24CaptionManagement | null = null;
    let desired: number | null = null;
    let pageNumber = 1;
    for await (const independent of read(await readableStream(input))) {
      if (independent.tag !== 'Caption') { continue; }

      const caption = independent.data;
      if (caption.tag === 'CaptionManagement') {
        if (typeof(language) === 'number') {
          desired = language;
        } else {
          const lang = [... caption.languages].sort(({ lang: fst }, { lang: snd}) => fst - snd).filter(({ iso_639_language_code }) => iso_639_language_code === language);
          desired = lang?.[0]?.lang ?? null;
        }
        if (management == null) {
          management = caption;
          management.languages = management.languages.filter((language) => language.lang === desired);
          pages.push({
            tag: 'ReservedPage',
            pageNumber: '000000',
            pageMaterialType: '1',
            displayTimingType: '  ',
            timingUnitType: 'T',
            displayTiming: 0,
            clearTiming:Number.POSITIVE_INFINITY,
            timeControlMode: 'FR',
            displayFormat: 'HDH',
            clearScreen: false,
            displayWindowArea: null,
            displayAspectRatio: ' ',
            scrollType: 'F',
            scrollDirectionType: 'H',
            sound: false,
            pageDataBytes: 0,
            deleted: false,
            memo: '',
            completed: false,
            usersAreaUsed: false,
            management: caption,
          });
        }
      } else if (management == null) {
        continue;
      } else {
        const entry = management.languages.find((entry) => entry.lang === caption.lang);
        if (entry == null) { continue; }
        if (desired !== caption.lang) { continue; }

        const specification = getTokenizeInformation(entry.iso_639_language_code, entry.TCS);
        if (specification == null) { continue; }

        const [association, tokenizer, state] = specification;
        const tokens = tokenizer.tokenize(caption);
        let duration = Number.POSITIVE_INFINITY;
        let elapse = 0;
        for (const token of tokens) {
          if (token.tag === 'ClearScreen') {
            if (elapse === 0) { continue; }
            duration = elapse;
          } else if (token.tag === 'TimeControlWait') {
            elapse += token.seconds;
          }
        }

        pages.push({
          tag: 'ActualPage',
          pageNumber: pageNumber.toString(10).padStart(6, '0'),
          pageMaterialType: '1',
          displayTimingType: '  ',
          timingUnitType: 'T',
          displayTiming: independent.pts,
          clearTiming: independent.pts + duration,
          timeControlMode: 'FR',
          displayFormat: 'HDH',
          clearScreen: false,
          displayWindowArea: null,
          displayAspectRatio: ' ',
          scrollType: 'F',
          scrollDirectionType: 'H',
          sound: false,
          pageDataBytes: muxDatagroup(caption).byteLength,
          deleted: false,
          memo: '',
          completed: false,
          usersAreaUsed: false,
          management,
          statement: caption,
        });
        pageNumber++;
      }
    }
  }

  const data: ARIBB36Data = {
    label: 'DCAPTION',
    broadcasterIdentification: '',
    materialNumber: '',
    programTitle: '',
    programSubtitle: '',
    programMaterialType: '0',
    registrationMode: 'N',
    languageCode: 'jpn',
    displayMode: '22',
    programType: 'C',
    sound: false,
    totalPages: pages.length,
    totalBytes: 1,
    untime: false,
    realtimeTimingType: 'LT',
    timingUnitType: 'T',
    initialTime: 0,
    syncronizationMode: 'P',
    timeControlMode: 'FR',
    extensible: [false, false, false, true, false, false, false, false],
    compatible: [true, false, false, false, false, false, false, false],
    expireDate: null,
    author: 'monyone',
    creationDateTime: null,
    broadcastStartDate: null,
    broadcastEndDate: null,
    broadcastDaysOfWeek: [false, false, false, false, false, false, false],
    broadcastStartTime: null,
    broadcastEndTime: null,
    memo: 'Created by aribb24.js',
    completed: true,
    usersAreaUsed: false,
    pages
  };
  const totalBytes = muxB36(data);
  const b36: ARIBB36Data = {
    ... data,
    totalBytes: totalBytes.byteLength
  };
  writeFS(output, muxB36(b36));
})();

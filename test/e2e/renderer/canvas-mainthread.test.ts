import { describe, test, expect } from 'vitest';
import { page } from '@vitest/browser/context'

import { CanvasMainThreadRenderer } from '@/index';
import aribInitialState from '@/lib/parser/state/ARIB';
import { CaptionLanguageInformation } from '@/lib/tokenizer/b24/datagroup';
import { ActivePositionReturn, Character, ColorControlBackground, PalletControl, WhiteForeground } from '@/lib/tokenizer/token';

const generateCharacter = (str: string) => {
  const segmenter = new Intl.Segmenter();
  return Array.from(segmenter.segment(str), ({ segment }) => segment).map((seg) => Character.from(seg));
}

describe('ARIB B24 Canvas Renderer', () => {
  test('Rendering Test', async () => {
    const width = 960, height = 540;
    const info: CaptionLanguageInformation = {
      association: 'ARIB',
      language: 'und',
    };
    const renderer = new CanvasMainThreadRenderer({
      color: {
        stroke: 'black',
        foreground: null,
        background: null,
      },
      resize: {
        target: 'container',
        objectFit: 'none'
      },
    });

    page.viewport(width, height);
    renderer.onAttach(document.body);
    renderer.onContainerResize(width, height);

    renderer.render(aribInitialState, [
      PalletControl.from(4),
      ColorControlBackground.from(1),
      PalletControl.from(0),
      WhiteForeground.from(),
      ... generateCharacter('ARIB'),
      ActivePositionReturn.from(),
      ... generateCharacter('CAPTION'),
    ], info);

    await page.screenshot({ element: renderer.getPresentationCanvas() });
  });
});

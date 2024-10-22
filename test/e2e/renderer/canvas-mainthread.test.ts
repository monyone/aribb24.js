import { describe, test, expect } from 'vitest';
import { page } from '@vitest/browser/context'

import { CanvasMainThreadRenderer } from '@/index';
import aribInitialState from '@/parser/state/ARIB';
import { CaptionLanguageInformation } from '@/tokenizer/b24/datagroup';
import { ActivePositionReturn, Character, ColorControlBackground, PalletControl, WhiteForeground } from '@/tokenizer/token';

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
      Character.from('A'),
      Character.from('R'),
      Character.from('I'),
      Character.from('B'),
      ActivePositionReturn.from(),
      Character.from('C'),
      Character.from('A'),
      Character.from('P'),
      Character.from('T'),
      Character.from('I'),
      Character.from('O'),
      Character.from('N'),
    ], info);

    await page.screenshot({ element: renderer.getPresentationCanvas() });
  });
});

import { describe, test, expect } from 'vitest';
import { page } from '@vitest/browser/context'

import { CanvasMainThreadRenderer } from '@/index';
import { initialState } from '@/parser/parser';
import { CaptionLanguageInformation } from '@/tokenizer/b24/datagroup';
import { Character, ColorControlBackground, PalletControl, WhiteForeground } from '@/tokenizer/token';

describe('ARIB B24 Canvas Renderer', () => {
  test('Render', async () => {
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
    renderer.onAttach(document.body);
    renderer.onContainerResize(width, height);

    const canvas = renderer.getPresentationCanvas();
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    renderer.render(initialState, [
      PalletControl.from(4),
      ColorControlBackground.from(1),
      PalletControl.from(0),
      WhiteForeground.from(),
      Character.from('a'),
    ], info);

    await page.elementLocator(renderer.getPresentationCanvas()).screenshot();
  });
});

import { describe, test, expect } from 'vitest';
import { page } from '@vitest/browser/context'

import { CanvasMainThreadRenderer } from '@/index';
import aribInitialState from '@/lib/parser/state/ARIB';
import { CaptionAssociationInformation } from '@/lib/demuxer/b24/datagroup';
import { ARIBB24ActivePositionReturnToken, ARIBB24CharacterToken, ARIBB24ColorControlBackgroundToken, ARIBB24PalletControlToken, ARIBB24WhiteForegroundToken } from '@/lib/tokenizer/token';

const generateCharacter = (str: string) => {
  const segmenter = new Intl.Segmenter();
  return Array.from(segmenter.segment(str), ({ segment }) => segment).map((seg) => ARIBB24CharacterToken.from(seg));
}

describe('ARIB B24 Canvas Renderer', () => {
  test('Rendering Test', async () => {
    const width = 960, height = 540;
    const info: CaptionAssociationInformation = {
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
      ARIBB24PalletControlToken.from(4),
      ARIBB24ColorControlBackgroundToken.from(1),
      ARIBB24PalletControlToken.from(0),
      ARIBB24WhiteForegroundToken.from(),
      ... generateCharacter('ARIB'),
      ARIBB24ActivePositionReturnToken.from(),
      ... generateCharacter('CAPTION'),
    ], info);

    await page.screenshot({ element: renderer.getPresentationCanvas() });
  });
});

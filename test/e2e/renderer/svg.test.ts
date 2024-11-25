import { describe, test, expect } from 'vitest';
import { page } from '@vitest/browser/context'

import { SVGDOMRenderer } from '@/index';
import aribInitialState from '@/lib/parser/state/ARIB';
import { CaptionLanguageInformation } from '@/lib/demuxer/b24/datagroup';
import {ARIBB24ActivePositionForwardToken, ARIBB24ActivePositionSetToken, ARIBB24CharacterCompositionDotDesignationToken, ARIBB24CharacterToken, ARIBB24ClearScreenToken, ARIBB24ColorControlBackgroundToken, ARIBB24FlashingControlToken, ARIBB24FlashingControlType, ARIBB24MiddleSizeToken, ARIBB24NormalSizeToken, ARIBB24PalletControlToken, ARIBB24SetDisplayFormatToken, ARIBB24SetDisplayPositionToken, ARIBB24SetHorizontalSpacingToken, ARIBB24SetVerticalSpacingToken, ARIBB24SetWritingFormatToken, ARIBB24WhiteForegroundToken } from '@/lib/tokenizer/token';

const generateCharacter = (str: string) => {
  const segmenter = new Intl.Segmenter();
  return Array.from(segmenter.segment(str), ({ segment }) => segment).map((seg) => ARIBB24CharacterToken.from(seg));
}

describe('ARIB B24 Canvas Renderer', () => {
  test('Flashing Rendering', async () => {
    const width = 960, height = 540;
    const info: CaptionLanguageInformation = {
      association: 'ARIB',
      language: 'und',
    };
    const renderer = new SVGDOMRenderer({
      color: {
        stroke: 'black'
      },
    });

    page.viewport(width, height);
    renderer.onAttach(document.body);
    renderer.onContainerResize(width, height);

    renderer.render(aribInitialState, [
      ARIBB24ClearScreenToken.from(),
      ARIBB24SetWritingFormatToken.from(7),
      ARIBB24SetDisplayFormatToken.from(840, 480),
      ARIBB24SetDisplayPositionToken.from(58, 29),
      ARIBB24SetHorizontalSpacingToken.from(4),
      ARIBB24SetVerticalSpacingToken.from(24),
      ARIBB24CharacterCompositionDotDesignationToken.from(36, 36),
      ARIBB24MiddleSizeToken.from(),
      ARIBB24ActivePositionSetToken.from(4, 7),
      ARIBB24WhiteForegroundToken.from(),
      ARIBB24PalletControlToken.from(4),
      ARIBB24ColorControlBackgroundToken.from(1),
      ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.NORMAL),
      ARIBB24CharacterToken.from('['),
      ARIBB24NormalSizeToken.from(),
      ARIBB24CharacterToken.from('携'),
      ARIBB24CharacterToken.from('帯'),
      ARIBB24MiddleSizeToken.from(),
      ARIBB24CharacterToken.from(']'),
      ARIBB24FlashingControlToken.from(ARIBB24FlashingControlType.STOP),
      ARIBB24ActivePositionForwardToken.from(),
      ARIBB24NormalSizeToken.from(),
      ARIBB24CharacterToken.from('ブ'),
      ARIBB24CharacterToken.from('ル'),
      ARIBB24CharacterToken.from('ブ'),
      ARIBB24CharacterToken.from('ル'),
    ], info);

    await page.screenshot({ element: renderer.getPresentationSVGElement() });
    expect(renderer.getPresentationSVGElement()).toMatchFileSnapshot('__snapshots__/svg/flashing.svg');
  });
});

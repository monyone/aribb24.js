import { describe, test, expect } from 'vitest';
import { page } from '@vitest/browser/context'

import { CanvasMainThreadRenderer, SVGDOMRenderer } from '@/index';
import aribInitialState from '@/parser/state/ARIB';
import { CaptionLanguageInformation } from '@/tokenizer/b24/datagroup';
import { ActivePositionForward, ActivePositionReturn, ActivePositionSet, Character, CharacterCompositionDotDesignation, ClearScreen, ColorControlBackground, FlashingControl, FlashingControlType, MiddleSize, NormalSize, PalletControl, SetDisplayFormat, SetDisplayPosition, SetHorizontalSpacing, SetVerticalSpacing, SetWritingFormat, WhiteForeground } from '@/tokenizer/token';

const generateCharacter = (str: string) => {
  const segmenter = new Intl.Segmenter();
  return Array.from(segmenter.segment(str), ({ segment }) => segment).map((seg) => Character.from(seg));
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
      ClearScreen.from(),
      SetWritingFormat.from(7),
      SetDisplayFormat.from(840, 480),
      SetDisplayPosition.from(58, 29),
      SetHorizontalSpacing.from(4),
      SetVerticalSpacing.from(24),
      CharacterCompositionDotDesignation.from(36, 36),
      MiddleSize.from(),
      ActivePositionSet.from(4, 7),
      WhiteForeground.from(),
      PalletControl.from(4),
      ColorControlBackground.from(1),
      FlashingControl.from(FlashingControlType.NORMAL),
      Character.from('['),
      NormalSize.from(),
      Character.from('携'),
      Character.from('帯'),
      MiddleSize.from(),
      Character.from(']'),
      FlashingControl.from(FlashingControlType.STOP),
      ActivePositionForward.from(),
      NormalSize.from(),
      Character.from('ブ'),
      Character.from('ル'),
      Character.from('ブ'),
      Character.from('ル'),
    ], info);

    await page.screenshot({ element: renderer.getPresentationSVGElement() });
    expect(renderer.getPresentationSVGElement()).toMatchFileSnapshot('__snapshots__/svg/flashing.svg');
  });
});

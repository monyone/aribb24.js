import { ARIBB24ParserState } from "../../../../lib/parser/parser";
import { NotImplementedError, ExhaustivenessError } from "../../../../util/error";
import Renderer from "../renderer";
import { TextRendererOption } from "./text-renderer-option";
import halftext from "../halftext"
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { shouldHalfWidth, shouldIgnoreSmallAsRuby, shouldNotAssumeUseClearScreen, shouldRemoveTransparentSpace } from "../quirk";
import { ARIBB24BrowserParser, ARIBB24BrowserToken, replaceDRCS } from "../../types";

export default class TextRenderer implements Renderer {
  private option: TextRendererOption;
  private text: string | null = null;

  public constructor(option?: Partial<TextRendererOption>) {
    this.option = TextRendererOption.from(option);
  }

  public resize(width: number, height: number): void {}
  public destroy(): void {
    this.text = null;
  }
  public clear(): void {
    this.text = null;
  }
  public hide(): void {}
  public show(): void {}

  public render(initialState: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionAssociationInformation): void {
    // if SBTVD, it is overwritten screen and insert space to erase, so CS Insert
    if (shouldNotAssumeUseClearScreen(info)) {
      this.text = '';
    }

    let privious_y = null;
    const parser = new ARIBB24BrowserParser(initialState);
    for (const token of parser.parse(replaceDRCS(tokens, this.option.replace.drcs))) {
      switch (token.tag) {
        case 'Character': {
          const { state, character } = token;
          if (this.text == null) { break; }

          if ((character === ' ' || character === '　') && state.background === 8 && shouldRemoveTransparentSpace(info)) { break; }

          // if ARIB in Japanese, SSZ is almost ruby
          if (shouldIgnoreSmallAsRuby(state.size, info)) { break; }

          // if differ y, newline inserted
          if (privious_y != null && state.position[1] !== privious_y) {
            this.text += '\n';
          }
          privious_y = state.position[1];

          // Otherwise, apply half
          if (this.option.replace.half && shouldHalfWidth(state.size, info)) {
            this.text += halftext.get(character)!;
          } else {
            this.text += character;
          }
          break;
        }
        case 'DRCS': {
          const { state } = token;
          if (this.text == null) { break; }

          if (privious_y != null && state.position[1] !== privious_y) {
            this.text += '\n';
          }
          privious_y = state.position[1];

          this.text += '〓';
          break;
        }
        case 'Bitmap':
          token.normal_bitmap.close();
          token.flashing_bitmap?.close();
          break;
        case 'ClearScreen':
          if (token.time === 0) {
            this.text = '';
          }
          break;
        default:
          throw new ExhaustivenessError(token, `Unexpected ARIB Parsed Token in TextRenderer`);
      }
    }
  }

  public onAttach(element: HTMLElement): void {}
  public onDetach(): void {}
  public onContainerResize(width: number, height: number): boolean {
    return false;
  }
  public onVideoResize(width: number, height: number): boolean {
    return false;
  }

  public onPlay(): void {}
  public onPause(): void {}

  public onSeeking(): void {
    this.clear();
  }
}

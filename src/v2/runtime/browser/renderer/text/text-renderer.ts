import { ARIBB24ParserState } from "../../../../parser/parser";
import { NotImplementedError, UnreachableError } from "../../../../util/error";
import Renderer from "../renderer";
import { TextRendererOption } from "./text-renderer-option";
import halfwidth from "../halfwidth"
import { CaptionLanguageInformation } from "../../../../tokenizer/b24/datagroup";
import { shouldHalfWidth, shouldIgnoreSmallAsRuby, shouldNotAssumeUseClearScreen, shouldRemoveTransparentSpace } from "../quirk";
import { ARIBB24BrowserParser, ARIBB24BrowserToken, replaceDRCS } from "../../types";

export default class TextRenderer implements Renderer {
  private option: TextRendererOption;
  private text: string | null = null;

  static half = structuredClone(halfwidth);
  static {
    this.half.set('ア', 'ｱ');
    this.half.set('イ', 'ｲ');
    this.half.set('ウ', 'ｳ');
    this.half.set('エ', 'ｴ');
    this.half.set('オ', 'ｵ');
    this.half.set('カ', 'ｶ');
    this.half.set('キ', 'ｷ');
    this.half.set('ク', 'ｸ');
    this.half.set('ケ', 'ｹ');
    this.half.set('コ', 'ｺ');
    this.half.set('サ', 'ｻ');
    this.half.set('シ', 'ｼ');
    this.half.set('ス', 'ｽ');
    this.half.set('セ', 'ｾ');
    this.half.set('ソ', 'ｿ');
    this.half.set('タ', 'ﾀ');
    this.half.set('チ', 'ﾁ');
    this.half.set('ツ', 'ﾂ');
    this.half.set('テ', 'ﾃ');
    this.half.set('ト', 'ﾄ');
    this.half.set('ナ', 'ﾅ');
    this.half.set('ニ', 'ﾆ');
    this.half.set('ヌ', 'ﾇ');
    this.half.set('ネ', 'ﾈ');
    this.half.set('ノ', 'ﾉ');
    this.half.set('ハ', 'ﾊ');
    this.half.set('ヒ', 'ﾋ');
    this.half.set('フ', 'ﾌ');
    this.half.set('ヘ', 'ﾍ');
    this.half.set('ホ', 'ﾎ');
    this.half.set('マ', 'ﾏ');
    this.half.set('ミ', 'ﾐ');
    this.half.set('ム', 'ﾑ');
    this.half.set('メ', 'ﾒ');
    this.half.set('モ', 'ﾓ');
    this.half.set('ヤ', 'ﾔ');
    this.half.set('ユ', 'ﾕ');
    this.half.set('ヨ', 'ﾖ');
    this.half.set('ラ', 'ﾗ');
    this.half.set('リ', 'ﾘ');
    this.half.set('ル', 'ﾙ');
    this.half.set('レ', 'ﾚ');
    this.half.set('ロ', 'ﾛ');
    this.half.set('ワ', 'ﾜ');
    this.half.set('ヲ', 'ｦ');
    this.half.set('ン', 'ﾝ');
    this.half.set('ヴ', 'ｳﾞ');
    this.half.set('ガ', 'ｶﾞ');
    this.half.set('ギ', 'ｷﾞ');
    this.half.set('グ', 'ｸﾞ');
    this.half.set('ゲ', 'ｹﾞ');
    this.half.set('ゴ', 'ｺﾞ');
    this.half.set('ザ', 'ｻﾞ');
    this.half.set('ジ', 'ｼﾞ');
    this.half.set('ズ', 'ｽﾞ');
    this.half.set('ゼ', 'ｾﾞ');
    this.half.set('ゾ', 'ｿﾞ');
    this.half.set('ダ', 'ﾀﾞ');
    this.half.set('ヂ', 'ﾁﾞ');
    this.half.set('ヅ', 'ﾂﾞ');
    this.half.set('デ', 'ﾃﾞ');
    this.half.set('ド', 'ﾄﾞ');
    this.half.set('バ', 'ﾊﾞ');
    this.half.set('ビ', 'ﾋﾞ');
    this.half.set('ブ', 'ﾌﾞ');
    this.half.set('ベ', 'ﾍﾞ');
    this.half.set('ボ', 'ﾎﾞ');
    this.half.set('パ', 'ﾊﾟ');
    this.half.set('ピ', 'ﾋﾟ');
    this.half.set('プ', 'ﾌﾟ');
    this.half.set('ペ', 'ﾍﾟ');
    this.half.set('ポ', 'ﾎﾟ');
    this.half.set('ァ', 'ｧ');
    this.half.set('ィ', 'ｨ');
    this.half.set('ゥ', 'ｩ');
    this.half.set('ェ', 'ｪ');
    this.half.set('ォ', 'ｫ');
    this.half.set('ャ', 'ｬ');
    this.half.set('ュ', 'ｭ');
    this.half.set('ョ', 'ｮ'),
    this.half.set('ッ', 'ｯ');
    this.half.set('◌゙', ' ﾞ');
    this.half.set('◌゚', ' ﾟ');
  }

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

  public render(initialState: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionLanguageInformation): void {
    // if SBTVD, it is overwritten screen and insert space to erase, so CS Insert
    if (shouldNotAssumeUseClearScreen(info)) {
      this.text = '';
    }

    let privious_y = null;
    const parser = new ARIBB24BrowserParser(initialState);
    for (const token of parser.parse(replaceDRCS(tokens, this.option.replace.drcs))) {
      switch (token.tag) {
        case 'Character': {
          const { state, character: { character }} = token;
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
            this.text += TextRenderer.half.get(character)!;
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
          // TODO
          throw new NotImplementedError('Not Implemented Bitmap');
        case 'ClearScreen':
          if (token.time === 0) {
            this.text = '';
          }
          break;
        default:
          const exhaustive: never = token;
          throw new UnreachableError(`Unhandled ARIB Parsed Token (${exhaustive})`);
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

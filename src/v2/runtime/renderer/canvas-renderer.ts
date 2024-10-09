import { ARIBB24Token, Character } from "../../tokenizer/token";
import ARIBB24Renderer from "./renderer";
import { ARIBB24CanvasRendererOption } from "./canvas-renderer-option";
import { ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24Parser } from "../../parser/index";
import colortable from "./colortable";

export default abstract class ARIBB24CanvasRenderer implements ARIBB24Renderer {
  protected option: ARIBB24CanvasRendererOption;
  protected canvas: HTMLCanvasElement;

  public constructor(option?: Partial<ARIBB24CanvasRendererOption>) {
    this.option = ARIBB24CanvasRendererOption.from(option);
    // Setup Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.objectFit = 'contain';

    this.canvas.width = 1920;
    this.canvas.height = 1080;
  }

  public resize(width: number, height: number): void {
    if (this.canvas == null) { return; }

    this.canvas.width = width;
    this.canvas.height = height;
  }

  public destroy(): void {
    this.resize(0, 0);
  }

  protected static renderTokens(buffer: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, tokens: ARIBB24Token[], rendererOption: ARIBB24CanvasRendererOption) {
    const parser = new ARIBB24Parser();
    for (const token of parser.parse(tokens)) {
      const plane_width = token.state.plane[0];
      const plane_height = token.state.plane[1];
      if (buffer.width !== plane_width || buffer.height !== plane_height) {
        buffer.width = plane_width;
        buffer.height = plane_height;
        context.clearRect(0, 0, buffer.width, buffer.height);
      }

      switch (token.tag) {
        case 'Character': {
          this.renderCharacter(context, token, rendererOption);
          break;
        }
        case 'DRCS': {
          this.renderDRCS(context, token, rendererOption);
          break;
        }
        case 'ClearScreen':
          if (token.time === 0) {
            // erase internal buffer
            context.clearRect(0, 0, buffer.width, buffer.height);
          }
          break;
        case 'PRA':
          break;
        default:
          const exhaustive: never = token;
          throw new Error(`Unhandled ARIB Parsed Token (${exhaustive})`);
      }
    }
  }

  protected static renderBackground(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken, rendererOption: ARIBB24CanvasRendererOption) {
    const { state } = token;

    // background
    context.fillStyle = rendererOption.color.background ?? colortable[state.background];
    context.fillRect(
      state.margin[0] + state.position[0],
      state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.height(state),
      ARIBB24Parser.width(state),
      ARIBB24Parser.height(state)
    );
  }


  protected static renderCharacter(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24CharacterParsedToken, rendererOption: ARIBB24CanvasRendererOption) {
    const { state, option, character: { character } } = token;
    const font = rendererOption.font.normal;

    // background
    ARIBB24CanvasRenderer.renderBackground(context, token, rendererOption);

    const center_x = (state.margin[0] + state.position[0] + ARIBB24Parser.width(state) / 2);
    const center_y = (state.margin[1] + (state.position[1] + 1) - ARIBB24Parser.height(state) / 2);
    context.translate(center_x, center_y);
    context.scale(ARIBB24Parser.scale(state)[0], ARIBB24Parser.scale(state)[1]);

    // orn
    if (rendererOption.color.stroke != null || state.ornament != null) {
      context.font = `${state.fontsize[0]}px ${font}`;
      context.strokeStyle = rendererOption.color.stroke ?? colortable[state.ornament!];
      context.lineJoin = 'round';
      context.textBaseline = 'middle';
      context.textAlign = 'center';
      context.lineWidth = 4 * option.magnification;
      context.strokeText(character, 0, 0);
    }

    // text
    context.font = `${state.fontsize[0]}px ${font}`;
    context.fillStyle = rendererOption.color.foreground ?? colortable[state.foreground];
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(character, 0, 0);

    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  protected static renderDRCS(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, token: ARIBB24DRCSPrasedToken, rendererOption: ARIBB24CanvasRendererOption) {
    const { state, option, drcs: { width, height, depth, binary } } = token;
    const font = rendererOption.font.normal;

    // background
    ARIBB24CanvasRenderer.renderBackground(context, token, rendererOption);

  }

  public abstract render(tokens: ARIBB24Token[]): void;
  public abstract clear(): void;

  public onAttach(element: HTMLElement): void {
    element.appendChild(this.canvas);
  }

  public onDetach(): void {
    this.canvas.remove();
  }

  public onContainerResize(element: HTMLElement): void {
    this.clear();
  }

  public onVideoResize(video: HTMLVideoElement): void {
    // noop
  }

  public onSeeking(): void {
    this.clear();
  }
}

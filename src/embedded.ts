import CanvasRenderer from './v1/canvas-renderer'
import CanvasProvider from './v1/canvas-provider'
import SVGRenderer from './v1/svg-renderer'
import SVGProvider from './v1/svg-provider'
import HTMLRenderer from './v1/html-renderer-experimental'
import HTMLProvider from './v1/html-provider-experimental'

import EmbeddedGlyph from './v1/constants/mapping/additional-symbols-glyph'
CanvasProvider.setEmbeddedGlyph(EmbeddedGlyph);
SVGProvider.setEmbeddedGlyph(EmbeddedGlyph);
HTMLProvider.setEmbeddedGlyph(EmbeddedGlyph);

export {
  CanvasRenderer, CanvasProvider,
  SVGRenderer, SVGProvider,
  HTMLRenderer, HTMLProvider
}

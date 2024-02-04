import CanvasRenderer from './canvas-renderer'
import CanvasProvider from './canvas-provider'
import SVGRenderer from './svg-renderer'
import SVGProvider from './svg-provider'
import HTMLRenderer from './html-renderer-experimental'
import HTMLProvider from './html-provider-experimental'

import EmbeddedGlyph from './constants/mapping/additional-symbols-glyph'
CanvasProvider.setEmbeddedGlyph(EmbeddedGlyph);
SVGProvider.setEmbeddedGlyph(EmbeddedGlyph);
HTMLProvider.setEmbeddedGlyph(EmbeddedGlyph);

export {
  CanvasRenderer, CanvasProvider,
  SVGRenderer, SVGProvider,
  HTMLRenderer, HTMLProvider
}

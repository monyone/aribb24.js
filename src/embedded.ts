import CanvasRenderer from './canvas-renderer'
import CanvasProvider from './canvas-provider'
import SVGRenderer from './svg-renderer'
import SVGProvider from './svg-provider'

import EmbeddedGlyph from './constants/mapping/additional-symbols-glyph'
CanvasProvider.setEmbeddedGlyph(EmbeddedGlyph);
SVGProvider.setEmbeddedGlyph(EmbeddedGlyph);

export {CanvasRenderer, CanvasProvider, SVGRenderer, SVGProvider}

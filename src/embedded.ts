import CanvasRenderer from './canvas-renderer'
import CanvasProvider from './canvas-provider'

import EmbeddedGlyph from './constants/mapping/additional-symbols'
CanvasProvider.setEmbeddedGlyph(EmbeddedGlyph);

export {EmbeddedGlyph, CanvasRenderer, CanvasProvider}
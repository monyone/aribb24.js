import CanvasRenderer from './canvas-renderer'
import CanvasProvider from './canvas-provider'

import EmbeddedGlyph from './constants/mapping/additional-symbols-glyph'
CanvasProvider.setEmbeddedGlyph(EmbeddedGlyph);

export {CanvasRenderer, CanvasProvider}

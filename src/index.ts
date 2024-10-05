export { default as CanvasRenderer, RendererOption as CanvasRendererOption } from './v1/canvas-renderer'
export { default as CanvasProvider, ProviderOption as CanvasProviderOption, ProviderResult as CanvasProviderResult } from './v1/canvas-provider'

export { default as SVGRenderer, RendererOption as SVGRendererOption } from './v1/svg-renderer'
export { default as SVGProvider, ProviderOption as SVGProviderOption, ProviderResult as SVGProviderResult } from './v1/svg-provider'

export { default as HTMLRenderer, RendererOption as HTMLRendererOption } from './v1/html-renderer-experimental'
export { default as HTMLProvider, ProviderOption as HTMLProviderOption, ProviderResult as HTMLProviderResult } from './v1/html-provider-experimental'

import JPNJIS8Tokenizer from './v2/tokenizer/jis8/locale/japan'

console.log(new JPNJIS8Tokenizer());

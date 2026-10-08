// Controller
export { default as Controller } from './runtime/browser/controller/controller';
export type { Event } from './runtime/browser/controller/events';
export { EventType } from './runtime/browser/controller/events';

// Feeder
export { FeederOption } from './runtime/browser/feeder/feeder'
export { default as MPEGTSFeeder } from './runtime/browser/feeder/mpegts-feeder';
export { default as HLSFeeder } from './runtime/browser/feeder/hls-feeder';
export { default as B36Feeder } from './runtime/browser/feeder/b36-feeder';
export { default as SpeechRecognitionFeeder } from './runtime/browser/feeder/speech-recognition-feeder';

// Renderer
export { RendererOption } from './runtime/browser/renderer/renderer-option';
// Canvas
export { CanvasRendererOption, type PartialCanvasRendererOption } from './runtime/browser/renderer/canvas/canvas-renderer-option';
export { default as CanvasMainThreadRenderer } from './runtime/browser/renderer/canvas/canvas-renderer-mainthread';
export { default as CanvasWebWorkerRenderer } from './runtime/browser/renderer/canvas/canvas-renderer-worker';
// SVG
export type { SVGDOMRendererOption, PartialSVGDOMRendererOption } from './runtime/browser/renderer/svg/svg-dom-renderer-option';
export { default as SVGDOMRenderer } from './runtime/browser/renderer/svg/svg-dom-renderer';
// Text
export type { TextRendererOption } from './runtime/browser/renderer/text/text-renderer-option';
export { default as TextRenderer } from './runtime/browser/renderer/text/text-renderer';
// HTML
export type { HTMLFragmentRendererOption, PartialHTMLFragmentRendererOption } from './runtime/browser/renderer/html/html-fragment-renderer-option';
export { default as HTMLFragmentRenderer } from './runtime/browser/renderer/html/html-fragment-renderer';

// Strategy
export { CanvasRendererOption as CanvasRenderingOption, type PartialCanvasRendererOption as PartialCanvasRenderingOption } from './runtime/common/renderer/canvas/renderer-option';
export { default as canvasRenderingStrategy } from './runtime/common/renderer/canvas/renderer-strategy';
export { SVGRendererOption as SVGRenderingOption, type PartialSVGRendererOption as PartialSVGRenderingOption } from './runtime/common/renderer/svg/renderer-option';
export { default as svgRenderingStrategy } from './runtime/common/renderer/svg/renderer-strategy';

// Tokenizer
export * from './lib/tokenizer/token';
export { default as ARIBB24Tokenizer, replaceDRCS } from './lib/tokenizer/b24/tokenizer';
export { default as ARIBB24JIS8Tokenizer } from './lib/tokenizer/b24/jis8/tokenizer';
export { default as ARIBB24JapaneseJIS8Tokenizer } from './lib/tokenizer/b24/jis8/ARIB';
export type { ARIBB24JapaneseJIS8TokenizerOption } from './lib/tokenizer/b24/jis8/ARIB';
export { default as ARIBB24BrazilianJIS8Tokenizer } from './lib/tokenizer/b24/jis8/SBTVD';

// Encoder
export { default as ARIBB24UTF8Encoder } from './lib/encoder/b24/ucs';
export { default as ARIBB24JapaneseJIS8Encoder } from './lib/encoder/b24/jis8/ARIB';

// Demuxer (STD-B24)
export { default as demuxDatagroup } from './lib/demuxer/b24/datagroup';
export { TimeControlModeType as ARIBB24DatagroupTimeControlMode } from './lib/demuxer/b24/datagroup';
export { TCSType as ARIBB24DatagroupTCS } from './lib/demuxer/b24/datagroup';
export { RollupModeType as ARIBB24DatagroupRollupMode } from './lib/demuxer/b24/datagroup';
export type { CaptionAssociationInformation, ARIBB24DataUnit, ARIBB24CaptionData, ARIBB24CaptionStatement, ARIBB24CaptionManagement, ARIBB24CaptionManagementLanguageEntry } from './lib/demuxer/b24/datagroup';
export { default as demuxIndependentPES } from './lib/demuxer/b24/independent';
// Demuxer (STD-B36)
export type { ARIBB36Data, ARIBB36PageData, ARIBB36ProgramManagementInformation, ARIBB36PageManagementInformation } from './lib/demuxer/b36';
export { default as demuxB36 } from './lib/demuxer/b36';
// (Program Management Data)
export { TimingUnitType as ARIBB36TimingUnitType } from './lib/demuxer/b36';
export { TimeControlModeType as ARIBB36TimeControlMode } from './lib/demuxer/b36';
export { ProgramMaterialType as ARIBB36ProgramMaterialType } from './lib/demuxer/b36';
export { RegistrationModeType as ARIBB36RegistrationMode } from './lib/demuxer/b36';
export { DisplayModeType as ARIBB36DisplayMode } from './lib/demuxer/b36';
export { ProgramType as ARIBB36ProgramType } from './lib/demuxer/b36';
export { RealtimeTimingType as ARIBB36RealtimeTimingType } from './lib/demuxer/b36';
export { SynchronizationModeType as ARIBB36SynchronizationMode } from './lib/demuxer/b36';
// (Page Management Data)
export { PageMaterialType as ARIBB36PageMaterialType } from './lib/demuxer/b36';
export { DisplayTimingType as ARIBB36DisplayTimingType } from './lib/demuxer/b36';
export { FormatDensityType as ARIBB36FormatDensityType } from './lib/demuxer/b36';
export { FormatWritingModeType as ARIBB36FormatWritingMode } from './lib/demuxer/b36';
export { DisplayAspectRatioType as ARIBB36DisplayAspectRatioType } from './lib/demuxer/b36';
export { ScrollType as ARIBB36ScrollType } from './lib/demuxer/b36';
export { ScrollDirectionType as ARIBB36ScrollDirectionType } from './lib/demuxer/b36';
export { PresentationFormatConversionModeType as ARIBB36PresentationFormatConversionMode } from './lib/demuxer/b36';
export { DRCSConversionModeType as ARIBB36DRCSConversionMode } from './lib/demuxer/b36';
// Demuxer (MPEG-TS)
export type { ARIBB24MPEGTSData, ARIBB24MPEGTSDemuxOption } from './lib/demuxer/mpegts';
export { default as demuxMPEGTS } from './lib/demuxer/mpegts';

// Muxer
export { default as muxDatagroup } from './lib/muxer/b24/datagroup';
export { default as muxIndependentPES } from './lib/muxer/b24/independent';
export { default as muxB36 } from './lib/muxer/b36'

// Parser
export { ARIBB24Parser, ARIBB24ParserOption } from './lib/parser/parser';
export type { ARIBB24ParsedToken, ARIBB24ClearScreenParsedToken, ARIBB24CharacterParsedToken, ARIBB24DRCSParsedToken, ARIBB24BitmapParsedToken, ARIBB24ParserState } from './lib/parser/parser';
export { default as ARIBB24JapaneseInitialParserState } from './lib/parser/state/ARIB';
export { default as ARIBB24BrazilianInitialParserState } from './lib/parser/state/ARIB';
export { default as regionerForARIBB24ParsedToken } from './lib/parser/regioner'

// Utils
export { EOFError, NotImplementedError, ExhaustivenessError, UnreachableError } from './util/error';

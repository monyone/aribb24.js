# aribb24.js [![npm](https://img.shields.io/npm/v/aribb24.js.svg?style=flat)](https://www.npmjs.com/package/aribb24.js)
NOTE: v1 README is [here](./README_v1.md)

ARIB STD-B24 Captione Renderer

## Feature

* ARIB STD-B24 Caption Rendering
    * Caption (A Profile)
    * Superimpose (A Profile)
* Support various broadcast specification
    * ARIB STD-B24 (TR-B14, TR-B15)
    * SBTVD ABNT NBR 15606-1
* Support various streaming protocol embedded ARIB STD-B24
    * MPEG-TS ([xqq/mpegts.js](https://github.com/xqq/mpegts.js)):
        * Private Stream: Specified by ARIB STD-B24
        * ID3 Timed Metadata: Sent by [xtne6f/tsreadex](https://github.com/xtne6f/tsreadex)
    * HLS:
        * ID3 Timed Metadata: above MPEG-TS ID3 Timed Metadata
* Support various rendering methods
  * Canvas (CanvasMainThreadRenderer, CanvasWebWorkerRenderer)
  * SVG (SVGDOMRenderer)
  * HTML (HTMLFragmentRenderer)
  * Text (TextRenderer)
* also CLI Tools Availables
  * ts2sup: ARIB STD-B24 to SUP (PGS)
  * ts2vobsub: ARIB STD-B24 to VOBSUB (SPU)
  * ts2ass: ARIB STD-B24 to Advanced SubStation Alpha (ASS)
  * ts2imsc: ARIB STD-B24 to IMSC (Image Profile)
  * ts2b36: ARIB STD-B24 to ARIB STD-B36

## Special Thanks

* Use glyph data from [和田研中丸ゴシック2004ARIB](https://ja.osdn.net/projects/jis2004/wiki/FrontPage) for ARIB additional symbol rendering.
    * Embedded glyph data exported from the font which is released under public domain license.
* Inspired by [b24.js](https://github.com/xqq/b24.js).
    * The pioneer of ARIB caption rendering on Web.
* Influenced by [TVCaptionMod2](https://github.com/xtne6f/TVCaptionMod2).
    * Got lots of feedback form the project author and heavily inspired by it.

## Getting Started

### mpegts.js

```javascript
<script src="mpegts.js"></script>
<script type="module">
    import { Controller, MPEGTSFeeder, CanvasWebWorkerRenderer } from "./aribb24.mjs";
    const video = document.getElementById('video');

    const controller = new Controller();
    const feeder = new MPEGTSFeeder();
    const renderer = new CanvasWebWorkerRenderer();

    controller.attachFeeder(feeder);
    controller.attachRenderer(renderer);
    controller.attachMedia(video);

    player.on(mpegts.Events.PES_PRIVATE_DATA_ARRIVED, (data) => {
        feeder.feedB24(new Uint8Array(data.data).buffer, (data.pts ?? data.nearest_pts) / 1000, (data.dts ?? data.nearest_pts) / 1000);
    });
    player.on(mpegts.Events.TIMED_ID3_METADATA_ARRIVED, (data) => {
        feeder.feedID3(new Uint8Array(data.data).buffer, (data.pts ?? data.nearest_pts) / 1000, (data.dts ?? data.nearest_pts) / 1000);
    });
</script>
```

## Options

### Feeder
```typescript
type FeederOption = Partial<{
  recieve: {
    association: 'ARIB' | 'SBTVD' | null; // null is AutoDetect
    type: 'Caption' | 'Superimpose';
    language: number | string; // index or iso language code
  },
  tokenizer: {
    pua: boolean; // use PUA for ARIB NON-STANDARD CHARACTER
  };
  offset: {
    time: number,
  }
}>;
```

### Renderer
#### CanvasRenderer
```typescript
type CanvasRendererOption = Partial<{
  font: {
    normal: string;
    arib: string;
  },
  replace: {
    half: boolean, // default: true
    drcs: Map<string, string>,
    glyph: Map<string, PathElement>,
  }
  color: {
    stroke: string | null,
    foreground: string | null,
    background: string | null,
  },
  resize: {
    target: 'video' | 'container'
    objectFit: 'contain' | 'none'
  }
}>;
```
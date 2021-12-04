# aribb24.js [![npm](https://img.shields.io/npm/v/aribb24.js.svg?style=flat)](https://www.npmjs.com/package/aribb24.js)

An HTML5 subtitle renderer.  
It is alternative implementation for [b24.js](https://github.com/xqq/b24.js).  

## Feature

* HTML5 Canvas based dot by dot subtitle rendering
* Fully compatible of [b24.js](https://github.com/xqq/b24.js) API
* Colored rendering with font color and background color specified by data packet

## Special Thanks

* Use [和田研中丸ゴシック2004ARIB](https://ja.osdn.net/projects/jis2004/wiki/FrontPage) glyph data for embedded rendering to ARIB symbol.
    * It's a public domain font. aribb24-embedded.js use this font data for ARIB symbol rendering. Thanks!
* This Project based on [b24.js](https://github.com/xqq/b24.js).
    * The pioneer of ARIB caption feature for web browser. Much inspire it. Thanks!
* Many feature based on [TVCaptionMod2](https://github.com/xtne6f/TVCaptionMod2).
    * Much Feedback about this project and inspired by it. Thanks!

## Options

* data_identifer: Specify number 0x80 (caption) or 0x81 (superimpose). default: 0x80 (caption)
* data_group_id: Specify number 0x01 (1st language) or 0x02 (2nd language). default: 0x01 (1st language)
* forceStrokeColor: Specify a color for always drawing character's stroke.
* forceBackgroundColor: Specify a color for always drawing character's background
* normalFont: Specify a font for drawing normal characters
* gainiFont: Specify a font for drawing ARIB gaiji characters
* drcsReplacement: Replace DRCS to text if possible
* drcsReplaceMapping: add more DRCS Mapping by Object (ex. { md5: character })
    * currently, replace to full-width character only supported.
* keepAspectRatio: keep caption's aspect ratio in any container. (default: true)
* enableRawCanvas: enable raw video resolution canvas. it can get getRawCanvas method.
* useStroke: use render outer stroke by strokeText or stroke (strokeText or stroke) API. (default: true)
* useHighResTextTrack: use polling instead of native cuechange event for b24 TextTrackCue handling.
* useHighResTimeupdate: use polling instead of native timeupdate event for id3 TextTrackCue handling.
* enableAutoInBandMetadataTextTrackDetection: enable InBand Metadata (id3) TextTrack auto detection. (default: true)
    * Recommended enableAutoInBandMetadataTextTrackDetection Settings
        * Safari (iOS, iPadOS, Mac OS) Native HLS Player: true
        * Legacy Edge Native HLS Player: true 
        * hls.js : false (Please use FRAG_PARSING_METADATA event instead of this option)
        * video.js : false (Please set video.js's Timed Metadata TextTrack manually, not supported auto detection.)

## Build

### Preparing

```bash
git clone https://github.com/monyone/aribb24.js
cd aribb24.js
yarn
```

### Compiling aribb24.js library

```bash
yarn run build
```

## Getting Started 

### with native player and hls.js (for id3 timed-metadata inserted stream)

```html
<script src="hls.min.js"></script>
<script src="aribb24.js"></script>
<video id="videoElement"></video>
<script>
    var video = document.getElementById('videoElement');
    var videoSrc = 'something.m3u8';

    var renderer = new aribb24js.CanvasRenderer({
        // Options are here!

        // forceStrokeColor?: string,
        // forceBackgroundColor?: string,
        // normalFont?: string,
        // gaijiFont?: string,
        // drcsReplacement?: boolean
        enableAutoInBandMetadataTextTrackDetection: !Hls.isSupported(), // FRAG_PARSING_METADATA instead of auto detection
    });
    // renderer.attachMedia(video, subtitleElement) also accepted
    renderer.attachMedia(video);

    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.on(Hls.Events.FRAG_PARSING_METADATA, function (event, data) {
            for (var sample of data.samples) {
                renderer.pushID3v2Data(sample.pts, sample.data);
            }
        }

        hls.loadSource(videoSrc);
        hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
    }

    video.play();
</script>
```

### with video.js (for id3 timed-metadata inserted stream)

```html
<link href="video-js.css" rel="stylesheet" />
<script src="video.min.js"></script>
<script src="aribb24.js"></script>
<video id="videoElement"></video>
<script>
    var video = document.getElementById('videoElement');
    var videoSrc = 'something.m3u8';

    var aribb24Renderer = new aribb24js.CanvasRenderer({
        // Options are here!

        // forceStrokeColor?: string,
        // forceBackgroundColor?: string,
        // normalFont?: string,
        // gaijiFont?: string,
        // drcsReplacement?: boolean
        useHighResTextTrack: true, // for IE11 (avoid video.js error on IE11)
    })

    var player = videojs(video);
    aribb24Renderer.attachMedia(video);
    document.getElementById('video').querySelector('.vjs-control-bar').style.zIndex = 1;

    const track = player.addTextTrack('subtitles', 'aribb24.js')
    if (track.mode === 'showing') {
        aribb24Renderer.show();
    } else {
        aribb24Renderer.hide();
    }

    player.textTracks().addEventListener('addtrack', function (event) {
        var track = event.track;
        if (track.label === 'Timed Metadata') {
            aribb24Renderer.setInBandMetadataTextTrack(track);
        }
    })

    track.addEventListener('modechange', function (event) {
        if (track.mode === 'showing') {
            aribb24Renderer.show();
        } else {
            aribb24Renderer.hide();
        }
    })

    player.src(videoSrc);
</script>
```

### with shaka-player (for id3 timed-metadata inserted stream)

```html
<script src="mux.min.js"></script>
<script src="shaka-player.ui.js"></script>
<link rel="stylesheet" href="controls.css">
<video id="videoElement"></video>
<script>
    var video = document.getElementById('videoElement');
    var videoSrc = 'something.m3u8';

    var aribb24Renderer = new aribb24js.CanvasRenderer({
        // Options are here!

        // forceStrokeColor?: string,
        // forceBackgroundColor?: string,
        // normalFont?: string,
        // gaijiFont?: string,
        // drcsReplacement?: boolean
    })

    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
        var player = new shaka.Player(video);
        aribb24Renderer.attachMedia(video);

        player.addEventListener('metadata', function (payload) {
            var startTime = data.startTime;
            var key = data.payload.key;

            if (key === 'PRIV') {
                var owner = data.payload.owner;
                var binary = data.payload.data;
                aribb24Renderer.pushID3v2PRIVData(startTime, owner, binary);
            } else if(key === 'TXXX') {
                var description = data.payload.description;
                var base64 = data.payload.data;
                aribb24Renderer.pushID3v2TXXXData(startTime, description, base64);
            }
        })
     }
</script>
```

### with hls-b24.js (for private_stream_1 inserted stream)

```html
<script src="hls.min.js"></script>
<script src="aribb24.js"></script>
<video id="videoElement"></video>
<script>
    var video = document.getElementById('videoElement');
    var hls = new Hls();
    hls.loadSource('something.m3u8')
    hls.attachMedia(video);
    video.play();

    var renderer = new aribb24js.CanvasRenderer({
      // Options are here!

      // forceStrokeColor?: string,
      // forceBackgroundColor?: string,
      // normalFont?: string,
      // gaijiFont?: string,
      // drcsReplacement?: boolean
    });
    renderer.attachMedia(video);
    // renderer.attachMedia(video, subtitleElement) also accepted

    hls.on(Hls.Events.FRAG_PARSING_PRIVATE_DATA, function (event, data) {
        for (var sample of data.samples) {
            renderer.pushData(sample.pid, sample.data, sample.pts);
        }
    }
</script>
```

## Limitations

* CanvasRenderer in Android Chrome with native HLS player dose not work
    * Because not support id3 timedmetadata in Android Chrome

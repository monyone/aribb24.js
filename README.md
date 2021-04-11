# aribb24.js [![npm](https://img.shields.io/npm/v/aribb24.js.svg?style=flat)](https://www.npmjs.com/package/aribb24.js)

An HTML5 subtitle renderer.  
It is alternative implementation for [b24.js](https://github.com/xqq/b24.js).  

## Feature

* HTML5 Canvas based dot by dot subtitle rendering
* Fully compatible of [b24.js](https://github.com/xqq/b24.js) API
* Colored rendering with font color and background color specified by data packet

## Options

* data_identifer: Specify number 0x80 (caption) or 0x81 (superimpose). default: 0x80 (caption)
* data_group_id: Specify number 0x01 (1st language) or 0x02 (2nd language). default: 0x01 (1st language)
* forceStrokeColor: Specify a color for always drawing character's stroke.
* forceBackgroundColor: Specify a color for always drawing character's background
* normalFont: Specify a font for drawing normal characters
* gainiFont: Specify a font for drawing ARIB gaiji characters
* drcsReplacement: Replace DRCS to text if possible
* keepAspectRatio: keep caption's aspect ratio in any container. default: true
* enableRawCanvas: enable raw video resolution canvas. it can get getRawCanvas method.

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

### with native player and hls.js (for id3 timedmetadata inserted stream)

```html
<script src="hls.min.js"></script>
<script src="aribb24.js"></script>
<video id="videoElement"></video>
<script>
    var video = document.getElementById('videoElement');
    var videoSrc = 'something.m3u8';

    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
    }

    video.play();
    var b24Renderer = new aribb24js.CanvasID3Renderer({
      // Options are here!

      // forceStrokeColor?: string,
      // forceBackgroundColor?: string,
      // normalFont?: string,
      // gaijiFont?: string,
      // drcsReplacement?: boolean
    });
    b24Renderer.attachMedia(video);
    // b24Renderer.attachMedia(video, subtitleElement) also accepted
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

    var b24Renderer = new aribb24js.CanvasB24Renderer({
      // Options are here!

      // forceStrokeColor?: string,
      // forceBackgroundColor?: string,
      // normalFont?: string,
      // gaijiFont?: string,
      // drcsReplacement?: boolean
    });
    b24Renderer.attachMedia(video);
    // b24Renderer.attachMedia(video, subtitleElement) also accepted

    hls.on(Hls.Events.FRAG_PARSING_PRIVATE_DATA, function (event, data) {
        for (var sample of data.samples) {
            b24Renderer.pushData(sample.pid, sample.data, sample.pts);
        }
    }
</script>
```

## Limitations

* CanvasID3Renderer in Android Chrome with native HLS player dose not work
    * Because not support id3 timedmetadata in Android Chrome

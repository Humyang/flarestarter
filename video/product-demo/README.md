# Smart Clip product demo

`smart-clip-product-demo-16x9.mp4` is a 20-second, silent 16:9 synthetic interface demo for the public marketing page. It is generated entirely by `render.sh` with FFmpeg color sources, geometric shapes, text, and the checked-in macOS Arial Unicode font. It does not read screenshots, source videos, customer media, account records, or third-party assets. Every filename, job ID, status, and progress value is simulated and visibly labeled in the frame.

The public MP4 and poster are safe to distribute as product-workflow illustrations. The localized WebVTT files are the text alternative for the visible beats. The video shows observable workflow claims only: MP4 input up to the current 100 MB limit, subtitle style/language selection, queued/processing/completed states, retry, and download. Processing wait is omitted and no fixed duration, accuracy, performance, security, or comparative claim is made.

Rebuild the public asset and poster with:

```bash
bash video/product-demo/render.sh
```

The browser-recorded `smart-clip-full-flow-demo-16x9.mp4` and its capture scripts are local QA material. They are not part of the public marketing delivery and must not be distributed without a separate privacy and media-rights review.

## Provenance record

| Field | Value |
| --- | --- |
| Capture method | Procedural FFmpeg composition; no browser or external media input |
| Data source | Fictional values written in `render.sh`; no production account or customer data |
| Font | `/System/Library/Fonts/Supplemental/Arial Unicode.ttf` |
| Output | 1920x1080, 30 fps, H.264, silent, 20 seconds |
| Public files | MP4, poster JPG, upload/queue still JPGs, English VTT, Chinese VTT |
| Review state | Synthetic replacement complete; legal owner and production analytics approval still required |

After a rebuild, record the output hash in the release ticket or review packet. Do not replace the synthetic inputs with screenshots unless a new provenance and rights review is completed.

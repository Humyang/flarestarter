# Synthetic demo review packet

Status: **internal review complete for media provenance; external publication pending legal and production gates**.

## Brief

Show the current Smart Clip render loop in 20 seconds: add an MP4, choose subtitle language and style, follow queue states, then download the result. The asset is intended for the English and Chinese marketing pages and as a text-captioned website video.

## Capture and provenance

- `render.sh` is the sole source for the public MP4 and poster.
- All pixels come from FFmpeg `color`, `drawbox`, `drawtext`, `fade`, and `concat` filters.
- The fictional values `synthetic-focus-demo.mp4`, `SC-DEMO-001`, `SC-DEMO-002`, `SC-DEMO-003`, and `64% simulated progress` are not customer records.
- No screenshot, browser storage, email address, avatar, upload, or third-party media is read by the public build.
- The browser-recorded full-flow file is retained only for local product QA.

Current public MP4 SHA-256: `7c71ef71c826d85489bde78c2ca10ad047111be52e4db6314c4684a2ed40267c` (generated 2026-08-10).

## Claims ledger

| Claim shown | Evidence in product | Treatment |
| --- | --- | --- |
| MP4 up to 100 MB | Current upload validation and marketing copy | Keep; re-check production limit before launch |
| Subtitle styles and language choices | Current render form and catalog | Keep; re-check catalog before launch |
| Queued, rendering, completed, failed/retry, download | Current render-job state and actions | Keep as workflow description |
| Processing time | Not evidenced by this asset | Explicitly omitted; no duration claim |
| Synthetic data | `SYNTHETIC UI`, `SIMULATED DATA`, captions | Keep visible in every scene |

## QA checklist

- [x] No customer, admin, email, avatar, or source-media pixels in public asset.
- [x] Synthetic label appears in intro, UI scenes, CTA, and captions.
- [x] English and Chinese captions cover all four beats.
- [x] MP4 is silent, 16:9, 20 seconds, and has a poster.
- [x] No unsupported speed, quality, security, pricing, or comparative claim.
- [ ] Product owner confirms current 100 MB limit and catalog counts in production.
- [ ] Legal owner approves public destinations and registration copy.
- [ ] Production analytics configuration and consent decision are recorded.

## Delivery matrix

| Destination | Asset | State |
| --- | --- | --- |
| `/` and `/zh` comparison section | Synthetic MP4 + poster + matching VTT | Ready after final launch gates |
| WeChat/Bilibili support images | Synthetic upload and queue stills | Ready after final launch gates |
| YouTube or social upload | Synthetic MP4 + caption file | Do not publish before legal/production approval |
| Local browser flow | Full-flow recording | QA only; do not distribute |

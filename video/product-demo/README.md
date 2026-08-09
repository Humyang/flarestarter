# Smart Clip product demo

`smart-clip-product-demo-16x9.mp4` is a 20-second, silent 16:9 product demo assembled from the repository's Smart Clip UI captures. The accompanying WebVTT file is the text alternative for the visible beats.

`smart-clip-full-flow-demo-16x9.mp4` is the browser-recorded version. It uses a synthetic local account and drives the real upload, subtitle-style selection, render-status, completed-state, and download flow. The processing wait is removed in the edit and explicitly labeled.

Rebuild it with:

```bash
bash video/product-demo/render.sh
```

Record and render the real browser flow while FlareStarter and Smart Clip are running locally:

```bash
node video/product-demo/record-full-flow.mjs
bash video/product-demo/render-full-flow.sh
```

The video intentionally uses only observable workflow language and existing sample UI/media. It contains no performance, security, pricing, or comparative claims.

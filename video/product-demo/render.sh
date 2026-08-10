#!/usr/bin/env bash
set -euo pipefail

out_dir="$(cd "$(dirname "$0")" && pwd)"
font='/System/Library/Fonts/Supplemental/Arial Unicode.ttf'

if [[ ! -f "$font" ]]; then
  echo "Required font not found: $font" >&2
  exit 1
fi

# Every visible element is generated below from colors, boxes, and text. The
# fictional file, job identifiers, and progress values are deliberately marked
# as simulated so this asset never depends on customer or third-party media.
ffmpeg -hide_banner -y \
  -f lavfi -t 3 -i 'color=c=0x0b0d12:s=1920x1080:r=30' \
  -f lavfi -t 6 -i 'color=c=0xf5f5f2:s=1920x1080:r=30' \
  -f lavfi -t 6 -i 'color=c=0xf5f5f2:s=1920x1080:r=30' \
  -f lavfi -t 5 -i 'color=c=0x0b0d12:s=1920x1080:r=30' \
  -filter_complex "
    [0:v]
      drawbox=x=0:y=0:w=1920:h=8:color=0xff5a1f:t=fill,
      drawtext=fontfile='$font':text='Smart Clip':fontcolor=0xff5a1f:fontsize=48:x=(w-text_w)/2:y=326,
      drawtext=fontfile='$font':text='MP4 subtitle workflow':fontcolor=white:fontsize=76:x=(w-text_w)/2:y=420,
      drawtext=fontfile='$font':text='Upload  ·  Style  ·  Render  ·  Download':fontcolor=0xc5c7cc:fontsize=34:x=(w-text_w)/2:y=545,
      drawbox=x=660:y=650:w=600:h=62:color=0x1b1f28:t=fill,
      drawtext=fontfile='$font':text='SYNTHETIC UI DEMO  ·  合成界面演示':fontcolor=0xffb08f:fontsize=24:x=(w-text_w)/2:y=668,
      fade=t=in:st=0:d=0.3,fade=t=out:st=2.7:d=0.3[intro];

    [1:v]
      drawbox=x=0:y=0:w=278:h=1080:color=0x11141a:t=fill,
      drawtext=fontfile='$font':text='Smart Clip':fontcolor=0xff6a32:fontsize=31:x=42:y=42,
      drawtext=fontfile='$font':text='WORKSPACE':fontcolor=0x747985:fontsize=17:x=42:y=126,
      drawbox=x=25:y=171:w=228:h=54:color=0x242832:t=fill,
      drawtext=fontfile='$font':text='New render':fontcolor=white:fontsize=23:x=52:y=186,
      drawtext=fontfile='$font':text='Render queue':fontcolor=0xaeb2bb:fontsize=23:x=52:y=263,
      drawtext=fontfile='$font':text='Feedback':fontcolor=0xaeb2bb:fontsize=23:x=52:y=327,
      drawtext=fontfile='$font':text='SYNTHETIC UI':fontcolor=0xff8a59:fontsize=18:x=52:y=985,
      drawtext=fontfile='$font':text='New render':fontcolor=0x11141a:fontsize=49:x=346:y=64,
      drawtext=fontfile='$font':text='SIMULATED DATA':fontcolor=0x8a4200:fontsize=18:x=1553:y=76:box=1:boxcolor=0xffdccd:boxborderw=14,
      drawtext=fontfile='$font':text='Project title':fontcolor=0x62666e:fontsize=20:x=346:y=178,
      drawbox=x=346:y=216:w=690:h=68:color=white:t=fill,
      drawbox=x=346:y=216:w=690:h=68:color=0xc8c9c5:t=2,
      drawtext=fontfile='$font':text='Focus demo - synthetic':fontcolor=0x1a1c20:fontsize=25:x=370:y=237,
      drawtext=fontfile='$font':text='MP4 source':fontcolor=0x62666e:fontsize=20:x=346:y=330,
      drawbox=x=346:y=368:w=690:h=218:color=white:t=fill,
      drawbox=x=346:y=368:w=690:h=218:color=0xc8c9c5:t=2,
      drawbox=x=378:y=412:w=84:h=104:color=0x1b1f28:t=fill,
      drawtext=fontfile='$font':text='MP4':fontcolor=0xff8a59:fontsize=20:x=397:y=455,
      drawtext=fontfile='$font':text='synthetic-focus-demo.mp4':fontcolor=0x1a1c20:fontsize=27:x=494:y=420,
      drawtext=fontfile='$font':text='18 MB  ·  generated test file':fontcolor=0x6f737a:fontsize=21:x=494:y=468,
      drawtext=fontfile='$font':text='No customer media':fontcolor=0x198754:fontsize=20:x=494:y=510,
      drawtext=fontfile='$font':text='Subtitle language':fontcolor=0x62666e:fontsize=20:x=1110:y=178,
      drawbox=x=1110:y=216:w=462:h=68:color=white:t=fill,
      drawbox=x=1110:y=216:w=462:h=68:color=0xc8c9c5:t=2,
      drawtext=fontfile='$font':text='Original language':fontcolor=0x1a1c20:fontsize=25:x=1135:y=237,
      drawtext=fontfile='$font':text='Subtitle style':fontcolor=0x62666e:fontsize=20:x=1110:y=330,
      drawbox=x=1110:y=368:w=462:h=218:color=0x161920:t=fill,
      drawbox=x=1110:y=368:w=462:h=218:color=0xff6a32:t=3,
      drawtext=fontfile='$font':text='DEPOSIT TIMELINE':fontcolor=0xff8a59:fontsize=18:x=1142:y=399,
      drawtext=fontfile='$font':text='Keep the key line':fontcolor=white:fontsize=31:x=1142:y=452,
      drawtext=fontfile='$font':text='visible and timed.':fontcolor=white:fontsize=31:x=1142:y=495,
      drawbox=x=346:y=677:w=1226:h=92:color=0xff5a1f:t=fill,
      drawtext=fontfile='$font':text='Submit render':fontcolor=0x11141a:fontsize=31:x=(346+1226/2-text_w/2):y=706,
      drawtext=fontfile='$font':text='01  Upload an MP4 and choose language + style':fontcolor=0x3b3e44:fontsize=25:x=346:y=850,
      drawtext=fontfile='$font':text='Current limit  ·  MP4 up to 100 MB':fontcolor=0x6c7078:fontsize=22:x=346:y=900,
      fade=t=in:st=0:d=0.3,fade=t=out:st=5.7:d=0.3[upload];

    [2:v]
      drawbox=x=0:y=0:w=278:h=1080:color=0x11141a:t=fill,
      drawtext=fontfile='$font':text='Smart Clip':fontcolor=0xff6a32:fontsize=31:x=42:y=42,
      drawtext=fontfile='$font':text='WORKSPACE':fontcolor=0x747985:fontsize=17:x=42:y=126,
      drawtext=fontfile='$font':text='New render':fontcolor=0xaeb2bb:fontsize=23:x=52:y=186,
      drawbox=x=25:y=238:w=228:h=54:color=0x242832:t=fill,
      drawtext=fontfile='$font':text='Render queue':fontcolor=white:fontsize=23:x=52:y=253,
      drawtext=fontfile='$font':text='Feedback':fontcolor=0xaeb2bb:fontsize=23:x=52:y=327,
      drawtext=fontfile='$font':text='SYNTHETIC UI':fontcolor=0xff8a59:fontsize=18:x=52:y=985,
      drawtext=fontfile='$font':text='Render queue':fontcolor=0x11141a:fontsize=49:x=346:y=64,
      drawtext=fontfile='$font':text='SIMULATED DATA':fontcolor=0x8a4200:fontsize=18:x=1553:y=76:box=1:boxcolor=0xffdccd:boxborderw=14,
      drawbox=x=346:y=183:w=1290:h=186:color=white:t=fill,
      drawbox=x=346:y=183:w=1290:h=186:color=0xd0d1cd:t=2,
      drawtext=fontfile='$font':text='SC-DEMO-001':fontcolor=0x747880:fontsize=18:x=378:y=215,
      drawtext=fontfile='$font':text='Focus demo - synthetic':fontcolor=0x1a1c20:fontsize=29:x=378:y=258,
      drawtext=fontfile='$font':text='QUEUED':fontcolor=0x805900:fontsize=18:x=1390:y=221:box=1:boxcolor=0xffeab2:boxborderw=13,
      drawtext=fontfile='$font':text='Waiting for an available render slot':fontcolor=0x70747b:fontsize=21:x=378:y=317,
      drawbox=x=346:y=397:w=1290:h=222:color=white:t=fill,
      drawbox=x=346:y=397:w=1290:h=222:color=0xd0d1cd:t=2,
      drawtext=fontfile='$font':text='SC-DEMO-002':fontcolor=0x747880:fontsize=18:x=378:y=429,
      drawtext=fontfile='$font':text='Launch clip - synthetic':fontcolor=0x1a1c20:fontsize=29:x=378:y=472,
      drawtext=fontfile='$font':text='RENDERING':fontcolor=0x7c3900:fontsize=18:x=1360:y=435:box=1:boxcolor=0xffd4bf:boxborderw=13,
      drawbox=x=378:y=545:w=1090:h=12:color=0xe2e2de:t=fill,
      drawbox=x=378:y=545:w=698:h=12:color=0xff5a1f:t=fill,
      drawtext=fontfile='$font':text='64 percent simulated progress':fontcolor=0x70747b:fontsize=19:x=378:y=574,
      drawbox=x=346:y=647:w=1290:h=222:color=white:t=fill,
      drawbox=x=346:y=647:w=1290:h=222:color=0xd0d1cd:t=2,
      drawtext=fontfile='$font':text='SC-DEMO-003':fontcolor=0x747880:fontsize=18:x=378:y=679,
      drawtext=fontfile='$font':text='Subtitle cut - synthetic':fontcolor=0x1a1c20:fontsize=29:x=378:y=722,
      drawtext=fontfile='$font':text='COMPLETED':fontcolor=0x10623b:fontsize=18:x=1350:y=685:box=1:boxcolor=0xc9f0dd:boxborderw=13,
      drawbox=x=1295:y=776:w=294:h=58:color=0x15181e:t=fill,
      drawtext=fontfile='$font':text='Download MP4':fontcolor=white:fontsize=23:x=1360:y=793,
      drawtext=fontfile='$font':text='02  Track status, retry failures, and download':fontcolor=0x3b3e44:fontsize=25:x=346:y=932,
      drawtext=fontfile='$font':text='Actual processing wait omitted':fontcolor=0x7a7e85:fontsize=20:x=1320:y=937,
      fade=t=in:st=0:d=0.3,fade=t=out:st=5.7:d=0.3[queue];

    [3:v]
      drawbox=x=0:y=0:w=1920:h=8:color=0xff5a1f:t=fill,
      drawtext=fontfile='$font':text='Smart Clip':fontcolor=0xff5a1f:fontsize=46:x=(w-text_w)/2:y=300,
      drawtext=fontfile='$font':text='Try the controlled free beta':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=402,
      drawtext=fontfile='$font':text='dve2.com':fontcolor=0x0b0d12:fontsize=34:x=(w-text_w)/2:y=561:box=1:boxcolor=0xff5a1f:boxborderw=24,
      drawtext=fontfile='$font':text='Synthetic interface  ·  simulated data  ·  no customer media':fontcolor=0xaeb2bb:fontsize=25:x=(w-text_w)/2:y=690,
      drawtext=fontfile='$font':text='Processing time varies':fontcolor=0x777c86:fontsize=21:x=(w-text_w)/2:y=744,
      fade=t=in:st=0:d=0.3,fade=t=out:st=4.7:d=0.3[outro];

    [intro][upload][queue][outro]concat=n=4:v=1:a=0,format=yuv420p[v]" \
  -map '[v]' -r 30 -c:v libx264 -preset medium -crf 20 -movflags +faststart \
  "$out_dir/smart-clip-product-demo-16x9.mp4"

ffmpeg -hide_banner -y \
  -ss 00:00:10.500 \
  -i "$out_dir/smart-clip-product-demo-16x9.mp4" \
  -frames:v 1 -update 1 -q:v 2 \
  "$out_dir/smart-clip-product-demo-poster.jpg"

ffmpeg -hide_banner -y \
  -ss 00:00:05.000 \
  -i "$out_dir/smart-clip-product-demo-16x9.mp4" \
  -frames:v 1 -update 1 -q:v 2 \
  "$out_dir/smart-clip-product-demo-upload.jpg"

ffmpeg -hide_banner -y \
  -ss 00:00:10.500 \
  -i "$out_dir/smart-clip-product-demo-16x9.mp4" \
  -frames:v 1 -update 1 -q:v 2 \
  "$out_dir/smart-clip-product-demo-queue.jpg"

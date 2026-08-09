#!/usr/bin/env bash
set -euo pipefail

out_dir="$(cd "$(dirname "$0")" && pwd)"
repo_dir="$(cd "$out_dir/../.." && pwd)"
font='/System/Library/Fonts/Supplemental/Arial Unicode.ttf'

ffmpeg -hide_banner -y \
  -f lavfi -t 3 -i 'color=c=0x0b0d12:s=1920x1080:r=30' \
  -loop 1 -t 6 -i "$repo_dir/.github/assets/render-form-en.png" \
  -loop 1 -t 6 -i "$repo_dir/.github/assets/render-en.png" \
  -f lavfi -t 5 -i 'color=c=0x0b0d12:s=1920x1080:r=30' \
  -filter_complex "
    [0:v]drawbox=x=0:y=0:w=1920:h=8:color=0xff5a1f:t=fill,
      drawtext=fontfile='$font':text='Smart Clip':fontcolor=0xff5a1f:fontsize=44:x=(w-text_w)/2:y=365,
      drawtext=fontfile='$font':text='从长视频到可发布短片':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=445,
      drawtext=fontfile='$font':text='上传源视频，选择字幕样式，然后下载成片':fontcolor=0xc5c7cc:fontsize=34:x=(w-text_w)/2:y=550,
      fade=t=in:st=0:d=0.35,fade=t=out:st=2.65:d=0.35[intro];
    [1:v]scale=1200:930:force_original_aspect_ratio=decrease,setsar=1[formfg];
    color=c=0x10131a:s=1920x1080:r=30:d=6[formbg];
    [formbg][formfg]overlay=x=(W-w)/2:y=90,
      drawbox=x=0:y=0:w=1920:h=74:color=0x0b0d12@0.94:t=fill,
      drawtext=fontfile='$font':text='01  添加源视频':fontcolor=white:fontsize=34:x=72:y=21,
      drawtext=fontfile='$font':text='填写项目名称，上传 MP4':fontcolor=0xc5c7cc:fontsize=25:x=1410:y=26,
      fade=t=in:st=0:d=0.35,fade=t=out:st=5.65:d=0.35[upload];
    [2:v]scale=1400:900:force_original_aspect_ratio=decrease,setsar=1[renderfg];
    color=c=0x10131a:s=1920x1080:r=30:d=6[renderbg];
    [renderbg][renderfg]overlay=x=(W-w)/2:y=120,
      drawbox=x=0:y=0:w=1920:h=74:color=0x0b0d12@0.94:t=fill,
      drawtext=fontfile='$font':text='02  预览字幕并提交渲染':fontcolor=white:fontsize=34:x=72:y=21,
      drawtext=fontfile='$font':text='在任务列表中查看结果并下载':fontcolor=0xc5c7cc:fontsize=25:x=1320:y=26,
      fade=t=in:st=0:d=0.35,fade=t=out:st=5.65:d=0.35[render];
    [3:v]drawbox=x=0:y=0:w=1920:h=8:color=0xff5a1f:t=fill,
      drawtext=fontfile='$font':text='Smart Clip':fontcolor=0xff5a1f:fontsize=42:x=(w-text_w)/2:y=365,
      drawtext=fontfile='$font':text='准备开始？':fontcolor=white:fontsize=76:x=(w-text_w)/2:y=445,
      drawtext=fontfile='$font':text='Create a video':fontcolor=0x0b0d12:fontsize=34:x=(w-text_w)/2:y=588:box=1:boxcolor=0xff5a1f:boxborderw=22,
      drawtext=fontfile='$font':text='示例界面和样例媒体':fontcolor=0x8f949e:fontsize=24:x=(w-text_w)/2:y=685,
      fade=t=in:st=0:d=0.35,fade=t=out:st=4.65:d=0.35[outro];
    [intro][upload][render][outro]concat=n=4:v=1:a=0,format=yuv420p[v]" \
  -map '[v]' -r 30 -c:v libx264 -preset medium -crf 20 -movflags +faststart \
  "$out_dir/smart-clip-product-demo-16x9.mp4"

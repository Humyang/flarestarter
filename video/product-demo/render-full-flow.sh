#!/usr/bin/env bash
set -euo pipefail

out_dir="$(cd "$(dirname "$0")" && pwd)"
font='/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
submit="$out_dir/raw/full-flow-submit.webm"
download="$out_dir/raw/full-flow-download.webm"
output="$out_dir/smart-clip-full-flow-demo-16x9.mp4"

test -f "$submit"
test -f "$download"

ffmpeg -hide_banner -y \
  -f lavfi -t 3 -i 'color=c=0x0b0d12:s=1920x1080:r=30' \
  -i "$submit" \
  -f lavfi -t 2.4 -i 'color=c=0x0b0d12:s=1920x1080:r=30' \
  -i "$download" \
  -f lavfi -t 3.6 -i 'color=c=0x0b0d12:s=1920x1080:r=30' \
  -filter_complex "
    [0:v]drawbox=x=0:y=0:w=1920:h=8:color=0xff5a1f:t=fill,
      drawtext=fontfile='$font':text='Smart Clip':fontcolor=0xff5a1f:fontsize=44:x=(w-text_w)/2:y=380,
      drawtext=fontfile='$font':text='完整浏览器流程':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=460,
      drawtext=fontfile='$font':text='上传 · 字幕样式 · 渲染 · 下载':fontcolor=0xc5c7cc:fontsize=32:x=(w-text_w)/2:y=565,
      fade=t=in:st=0:d=0.3,fade=t=out:st=2.7:d=0.3[intro];
    [1:v]fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,
      pad=1920:1080:(ow-iw)/2:(oh-ih)/2:0x0b0d12,setsar=1[submit];
    [2:v]drawtext=fontfile='$font':text='Smart Clip 正在处理':fontcolor=white:fontsize=66:x=(w-text_w)/2:y=440,
      drawtext=fontfile='$font':text='跳过等待时间':fontcolor=0xff5a1f:fontsize=34:x=(w-text_w)/2:y=545,
      fade=t=in:st=0:d=0.25,fade=t=out:st=2.15:d=0.25[processing];
    [3:v]fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,
      pad=1920:1080:(ow-iw)/2:(oh-ih)/2:0x0b0d12,setsar=1[download];
    [4:v]drawbox=x=0:y=0:w=1920:h=8:color=0xff5a1f:t=fill,
      drawtext=fontfile='$font':text='流程完成':fontcolor=white:fontsize=76:x=(w-text_w)/2:y=430,
      drawtext=fontfile='$font':text='Rendered and downloaded':fontcolor=0xff5a1f:fontsize=38:x=(w-text_w)/2:y=545,
      drawtext=fontfile='$font':text='示例账户、界面和媒体':fontcolor=0x8f949e:fontsize=25:x=(w-text_w)/2:y=640,
      fade=t=in:st=0:d=0.3,fade=t=out:st=3.3:d=0.3[outro];
    [intro][submit][processing][download][outro]concat=n=5:v=1:a=0,format=yuv420p[v]" \
  -map '[v]' -r 30 -c:v libx264 -preset medium -crf 20 -movflags +faststart "$output"

ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$output"

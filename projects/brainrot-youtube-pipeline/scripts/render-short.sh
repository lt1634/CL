#!/usr/bin/env bash
set -euo pipefail
AUDIO="${1:?need audio}"
SRT="${2:?need srt}"
BG="${3:-}"
OUT="${4:-${AUDIO%.*}-short.mp4}"
W=1080
H=1920
HAS_SUB=0
if ffmpeg -filters 2>/dev/null | grep -qE '^ *S.* subtitles'; then
  HAS_SUB=1
fi
if [[ "$HAS_SUB" -eq 1 ]]; then
  if [[ -n "$BG" && -f "$BG" ]]; then
    ffmpeg -y -loop 1 -i "$BG" -i "$AUDIO" \
      -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},subtitles=filename=${SRT}" \
      -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "$OUT"
  else
    ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=${W}x${H}:d=1" -i "$AUDIO" \
      -filter_complex "[0:v]scale=${W}:${H}[v0];[v0]subtitles=filename=${SRT}[v]" \
      -map "[v]" -map 1:a -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "$OUT"
  fi
else
  echo "Note: ffmpeg has no subtitles filter (install ffmpeg with libass). Output = audio + solid background only; upload $SRT separately to YouTube." >&2
  if [[ -n "$BG" && -f "$BG" ]]; then
    ffmpeg -y -loop 1 -i "$BG" -i "$AUDIO" \
      -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}" \
      -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "$OUT"
  else
    ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=${W}x${H}:d=1" -i "$AUDIO" \
      -vf "scale=${W}:${H}" \
      -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "$OUT"
  fi
fi
echo "Wrote: $OUT"

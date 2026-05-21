#!/usr/bin/env bash
# Download Instagram post preview photo via og:image.
#
# Usage:
#   bash tools/ga-ingest/download_instagram_photo.sh "https://www.instagram.com/p/<SHORTCODE>/"
#   bash tools/ga-ingest/download_instagram_photo.sh "https://www.instagram.com/p/<SHORTCODE>/" --outdir tools/ga-ingest/output/instagram
#
# Notes:
# - This grabs the public page HTML and extracts the `og:image` URL.
# - If the post is private / requires login, this will likely fail.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <instagram_post_url> [--outdir <dir>]" >&2
  exit 2
fi

POST_URL="$1"
shift || true

OUTDIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --outdir)
      OUTDIR="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -z "$OUTDIR" ]]; then
  OUTDIR="$ROOT/tools/ga-ingest/output/instagram"
fi
mkdir -p "$OUTDIR"

SHORTCODE="$(python3 - "$POST_URL" <<'PY'
import re, sys
u = sys.argv[1].strip()
m = re.search(r"/p/([^/?#]+)/?", u)
print(m.group(1) if m else "instagram_post")
PY
)"

TMP_HTML="$(mktemp)"
curl --http1.1 -L -A 'Mozilla/5.0' -H 'Accept: text/html' -H 'Accept-Language: en-US,en;q=0.9' -s "$POST_URL" > "$TMP_HTML" || true
OG_IMAGE="$(python3 - "$TMP_HTML" <<'PY'
import html
import re
import sys
from pathlib import Path

p = Path(sys.argv[1])
text = p.read_text(encoding="utf-8", errors="ignore")
m = re.search(r'property="og:image"\s+content="([^"]+)"', text)
print(html.unescape(m.group(1)) if m else "")
PY
)"
rm -f "$TMP_HTML"

if [[ -z "$OG_IMAGE" ]]; then
  echo "Could not find og:image in HTML (maybe login wall/private post)." >&2
  exit 1
fi

OUTFILE="$OUTDIR/${SHORTCODE}.jpg"
curl -L -A "Mozilla/5.0" -o "$OUTFILE" "$OG_IMAGE"
echo "Saved: $OUTFILE"


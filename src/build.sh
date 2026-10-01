#!/usr/bin/env bash
# src/*.html → site/docs/*.pdf (headless Chrome). macOS 기준 Chrome 경로, 다르면 CHROME 환경변수로 지정.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
for name in career mysql-upgrade; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="../site/docs/${name}.pdf" "file://$PWD/${name}.html" 2>/dev/null
  echo "built site/docs/${name}.pdf"
done

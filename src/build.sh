#!/usr/bin/env bash
# src/*.html → site/docs/*.pdf (headless Chrome). macOS 기준 Chrome 경로, 다르면 CHROME 환경변수로 지정.
# 교육과정 PDF(edu-*.pdf)는 HTML이 아니라 원본 PDF를 래스터화·마스킹해 만든 사본이다.
# 마스킹 규칙에 팀원 실명이 들어가므로 도구와 규칙은 레포에 두지 않는다.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
for name in career mysql-upgrade gitops-platform monitoring waf incidents; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="../site/docs/${name}.pdf" "file://$PWD/${name}.html" 2>/dev/null
  echo "built site/docs/${name}.pdf"
done

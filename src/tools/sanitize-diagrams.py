#!/usr/bin/env python3
"""draw.io 다이어그램 → 공개용 PNG (site/img/).

왜 필요한가
  draw.io가 내보낸 PNG에는 편집 가능한 원본 XML이 tEXt 청크(mxfile)로 박혀 있다.
  그대로 올리면 숨긴 도형·다른 레이어·메모까지 추출된다.
  이 스크립트는 ① 라벨 치환으로 내부 정보를 지우고 ② PNG를 다시 내보내고
  ③ 그림 데이터 외의 모든 청크를 제거한다.

사용법
  python3 src/tools/sanitize-diagrams.py            # 전체 재생성
  python3 src/tools/sanitize-diagrams.py cicd-gitops  # 일부만

전제
  - 원본: ~/Downloads/작업자료/Architecture (비공개)
  - draw.io 데스크톱 앱 설치 (CLI 내보내기에 사용)
"""
import base64
import html
import os
import re
import struct
import subprocess
import sys
import urllib.parse
import zlib

SRC = os.path.expanduser("~/Downloads/작업자료/Architecture")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "site", "img")
TMP = "/tmp/diagram-build"
DRAWIO = "/Applications/draw.io.app/Contents/MacOS/draw.io"
MAX_W = 2200  # 웹 표시 폭 상한 (라이트박스 확대까지 감안)

# (원본파일, 출력이름, 내보내기 배율, [(찾을 문자열, 바꿀 문자열), ...])
JOBS = [
    ("CI:CD AS-IS.drawio", "cicd-as-is", 2, []),
    ("CI:CD TO-BE.drawio", "cicd-to-be", 2, []),
    ("GitOps CICD.png", "cicd-gitops", 2, [
        ("집닥 CI/CD 파이프라인", "GitOps 기반 CI/CD 파이프라인"),
        ("QA_Application VPC", "Application VPC"),
    ]),
    ("ArgoCD TO-BE.drawio", "cicd-argocd", 2, []),
    ("RDS Dump TO-BE.drawio", "db-sync", 3, [
        ("zws-zipdockr-vpc-cluster", "운영 DB"),
        ("qa-zipdockr-cluster", "QA DB"),
        ("zipdockr", "운영 DB"),
        ("CUR_VPC", "QA VPC"),
        ("OP_VPC", "운영 VPC"),
        ("(10.0.0.0/16)", ""),
        ("(172.31.0.0/16)", ""),
        ("&nbsp;", " "),
    ]),
    ("Monitoring TO-BE-v2.drawio", "monitoring", 2, []),
]

# 공개 금지 패턴 (라벨 검사 + 최종 PNG 바이트 검사)
BAD_TEXT = re.compile(
    r"(\b\d{1,3}(\.\d{1,3}){3}\b|\b\d{12}\b|zipdoc|zip-[a-z0-9]+|\.co\.kr"
    r"|amazonaws\.com|arn:aws|AKIA|\bi-[0-9a-f]{8,}|집닥)", re.I)
BAD_BYTES = re.compile(
    rb"(mxfile|mxGraphModel|zipdoc|10\.0\.0\.0|172\.31|\xec\xa7\x91\xeb\x8b\xa5)", re.I)

# PNG에서 남길 청크 (그림을 그리는 데 필요한 것만)
KEEP = {b"IHDR", b"PLTE", b"IDAT", b"IEND", b"tRNS", b"gAMA",
        b"cHRM", b"sRGB", b"iCCP", b"pHYs", b"bKGD"}


def read_source(path):
    """.drawio 또는 PNG에 내장된 mxfile XML을 읽는다."""
    if not path.lower().endswith(".png"):
        return open(path, encoding="utf-8").read()
    data = open(path, "rb").read()
    i, xml = 8, None
    while i < len(data):
        ln = struct.unpack(">I", data[i:i + 4])[0]
        if data[i + 4:i + 8] == b"tEXt":
            key, val = data[i + 8:i + 8 + ln].split(b"\0", 1)
            if key == b"mxfile":
                xml = urllib.parse.unquote(val.decode("latin1"))
        i += 12 + ln
    if xml is None:
        raise SystemExit(f"{path}: 내장 XML 없음")
    return xml


def inflate(mxfile):
    """<diagram>의 압축 페이로드를 평문 mxGraphModel로 바꾼다."""
    def repl(m):
        body = m.group(2).strip()
        if body.startswith("<mxGraphModel"):
            return m.group(0)
        raw = zlib.decompress(base64.b64decode(body), -15).decode("utf-8")
        return f"{m.group(1)}{urllib.parse.unquote(raw)}</diagram>"
    return re.sub(r"(<diagram[^>]*>)(.*?)</diagram>", repl, mxfile, flags=re.S)


def strip_chunks(src, dst):
    """그림 데이터 외 모든 청크(메타데이터)를 제거해 저장한다."""
    d = open(src, "rb").read()
    out, i, dropped = bytearray(d[:8]), 8, []
    while i < len(d):
        ln = struct.unpack(">I", d[i:i + 4])[0]
        typ = d[i + 4:i + 8]
        if typ in KEEP:
            out += d[i:i + 12 + ln]
        else:
            dropped.append(typ.decode("latin1"))
        i += 12 + ln
    open(dst, "wb").write(bytes(out))
    return dropped


def main(argv):
    only = set(argv)
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    bad = []

    for src, name, scale, edits in JOBS:
        if only and name not in only:
            continue
        path = os.path.join(SRC, src)
        if not os.path.exists(path):
            print(f"[건너뜀] {name}: 원본 없음 ({src})")
            continue

        # ① 살균
        xml = inflate(read_source(path))
        for old, new in edits:
            for a, b in ((old, new), (html.escape(old), html.escape(new))):
                xml = xml.replace(a, b)
        clean = os.path.join(TMP, f"{name}.drawio")
        open(clean, "w", encoding="utf-8").write(xml)

        labels = [html.unescape(re.sub("<[^>]+>", "", v)).strip()
                  for v in re.findall(r'value="([^"]*)"', xml)]
        hits = sorted({l for l in labels if l and BAD_TEXT.search(l)})
        for h in hits:
            print(f"[라벨 확인 필요] {name}: {h[:110]}")
            bad.append(name)

        # ② PNG 내보내기 (메타데이터 미포함 모드)
        raw = os.path.join(TMP, f"{name}.raw.png")
        subprocess.run([DRAWIO, "--no-sandbox", "-x", "-f", "png",
                        "-s", str(scale), "-b", "20", "-o", raw, clean],
                       check=True, capture_output=True)

        # 폭 상한 (업스케일 금지)
        w = struct.unpack(">I", open(raw, "rb").read()[16:20])[0]
        if w > MAX_W:
            subprocess.run(["sips", "-Z", str(MAX_W), raw],
                           check=True, capture_output=True)

        # ③ 메타데이터 제거 + 검사
        dst = os.path.normpath(os.path.join(OUT, f"{name}.png"))
        dropped = strip_chunks(raw, dst)
        body = open(dst, "rb").read()
        leftover = BAD_BYTES.findall(body)
        w, h = struct.unpack(">II", body[16:24])
        print(f"[{'OK' if not leftover and not hits else 'NG'}] {name:12s} "
              f"{w}x{h} {len(body) // 1024}KB  제거={dropped or '없음'}  "
              f"잔존={leftover or '없음'}")
        if leftover:
            bad.append(name)

    if bad:
        print(f"\n확인 필요: {sorted(set(bad))}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

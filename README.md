# portfolio

DevOps 엔지니어 김선호 소개 페이지입니다. 정적 HTML/CSS/JS로 만들었고, GitHub Actions로 GitHub Pages에 배포합니다.

## 구조

```
site/            배포 대상 (GitHub Pages가 이 폴더만 올림)
  index.html
  assets/        style.css, main.js
  docs/          열람용 PDF
src/             PDF 원본 HTML과 빌드 스크립트 (배포되지 않음)
.github/workflows/deploy.yml   검증 → 배포
```

## 수정 후 배포

```bash
./src/build.sh            # src/*.html 을 고쳤을 때만 (PDF 재생성)
git add -A && git commit -m "update" && git push
```

push하면 Actions가 두 가지를 먼저 검사한 뒤 배포합니다.
- index.html이 참조하는 파일이 실제로 있는지
- 전화번호나 키 같은 민감 문자열이 섞여 있지 않은지

## 로컬 미리보기

```bash
python3 -m http.server -d site 8000   # http://localhost:8000
```

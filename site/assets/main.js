// 스크롤 등장 효과
(() => {
  const sections = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('shown');
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  sections.forEach((s) => io.observe(s));
  // 처음 화면에 보이는 섹션은 바로 표시
  requestAnimationFrame(() => sections.forEach((s) => {
    if (s.getBoundingClientRect().top < window.innerHeight) s.classList.add('shown');
  }));
})();

// PDF 뷰어: data-pdf 요소를 누르면 모달로 연다. 모바일은 새 탭으로 연다(iOS iframe PDF 미지원).
(() => {
  const dlg = document.getElementById('viewer');
  const frame = document.getElementById('viewer-frame');
  const title = document.getElementById('viewer-title');
  const openTab = document.getElementById('viewer-open');
  const isMobile = window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
  let opener = null;

  document.querySelectorAll('[data-pdf]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.pdf;
      if (isMobile || typeof dlg.showModal !== 'function') { window.open(src, '_blank', 'noopener'); return; }
      opener = btn;
      title.textContent = btn.dataset.title || '';
      openTab.href = src;
      frame.src = src + '#view=FitH';
      dlg.showModal();
    });
  });

  document.getElementById('viewer-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { frame.src = 'about:blank'; if (opener) opener.focus(); });
})();

// HERO 목업 탭 전환
(() => {
  const tabs = document.querySelectorAll('.mock-side [role="tab"]');
  const path = document.getElementById('mock-path');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => {
      const on = x === t;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', on);
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    path.textContent = t.dataset.path;
  }));
})();

// 문제 해결 기록 캐러셀
(() => {
  const root = document.querySelector('.carousel');
  if (!root) return;
  const track = root.querySelector('.track');
  const slides = [...track.children];
  const prev = root.querySelector('.prev');
  const next = root.querySelector('.next');
  const dots = document.querySelector('.dots');
  let i = 0;

  slides.forEach((s, n) => {
    const d = document.createElement('button');
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', `${n + 1}번째 기록`);
    d.addEventListener('click', () => go(n));
    dots.appendChild(d);
  });

  function go(n) {
    i = (n + slides.length) % slides.length;   // 양 끝에서 반대편으로 순환
    track.style.transform = `translateX(-${i * 100}%)`;
    slides.forEach((s, k) => s.setAttribute('aria-hidden', k !== i));
    [...dots.children].forEach((d, k) => d.setAttribute('aria-selected', k === i));
  }
  prev.addEventListener('click', () => go(i - 1));
  next.addEventListener('click', () => go(i + 1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(i - 1);
    if (e.key === 'ArrowRight') go(i + 1);
  });
  // 터치 스와이프
  let x0 = null;
  track.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  go(0);
})();

// 보고서 항목 탭 (현상 / 원인 분석 / 조치 / 재발 방지)
document.querySelectorAll('.doc-tabs').forEach((list) => {
  const tabs = list.querySelectorAll('[role="tab"]');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => {
      const on = x === t;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', on);
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }));
});

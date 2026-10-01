// 커서 조명 (마우스가 있는 기기만)
if (window.matchMedia('(pointer: fine)').matches) {
  const root = document.documentElement;
  window.addEventListener('pointermove', (e) => {
    root.style.setProperty('--x', e.clientX + 'px');
    root.style.setProperty('--y', e.clientY + 'px');
  }, { passive: true });
}

// 스크롤 등장 효과 + 현재 섹션 메뉴 표시
(() => {
  const sections = document.querySelectorAll('main section');
  const links = document.querySelectorAll('.toc a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('shown');
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-30% 0px -55% 0px' });
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

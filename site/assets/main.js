// PDF 뷰어: data-pdf 속성이 있는 요소를 누르면 모달로 연다.
// 모바일(특히 iOS)은 iframe PDF 표시가 불안정하므로 새 탭으로 연다.
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

  const close = () => dlg.close();
  document.getElementById('viewer-close').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });   // 바깥 영역 클릭
  dlg.addEventListener('close', () => { frame.src = 'about:blank'; if (opener) opener.focus(); });
})();

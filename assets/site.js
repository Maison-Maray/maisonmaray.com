/* =========================================================
   MAISON MARAY — interactions
   ========================================================= */
(function () {
  // --- header scroll
  const header = document.querySelector('.site-header');
  if (header) {
    const lockSolid = header.classList.contains('static-solid') || header.classList.contains('scrolled');
    const onScroll = () => {
      if (lockSolid) { header.classList.add('scrolled'); return; }
      const t = window.scrollY > 40;
      header.classList.toggle('scrolled', t);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => {
    io.observe(el);
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
  });
  // scroll fallback — IntersectionObserver can be unreliable in iframes
  const revealCheck = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) el.classList.add('in');
  });
  window.addEventListener('scroll', revealCheck, { passive: true });
  window.addEventListener('resize', revealCheck);
  setTimeout(revealCheck, 100);
  setTimeout(revealCheck, 600);

  // --- custom cursor
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);
  let cx = -100, cy = -100, tx = -100, ty = -100;
  window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
  function tick() {
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .img-hover, [data-cursor="hover"]')) cursor.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .img-hover, [data-cursor="hover"]')) cursor.classList.remove('hover');
  });

  // --- mobile menu
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.add('open'));
    menu.querySelector('.mobile-close')?.addEventListener('click', () => menu.classList.remove('open'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }

  // --- newsletter sticky (scroll-triggered : 40 % de page OU 20 s)
  const ns = document.querySelector('.newsletter-sticky');
  if (ns && !sessionStorage.getItem('mm-ns-dismissed')) {
    let shown = false;
    const showNs = () => {
      if (shown) return;
      shown = true;
      ns.classList.add('in');
    };
    const onScrollNs = () => {
      if (window.scrollY > document.body.scrollHeight * 0.4) showNs();
    };
    window.addEventListener('scroll', onScrollNs, { passive: true });
    setTimeout(showNs, 20000);
    ns.querySelector('.x')?.addEventListener('click', () => {
      ns.classList.remove('in');
      sessionStorage.setItem('mm-ns-dismissed', '1');
    });
  }

  // --- horizontal scroll-snap arrows (signature cards)
  document.querySelectorAll('[data-hscroll]').forEach(scroller => {
    scroller.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scroller.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  });

  // --- before/after slider
  document.querySelectorAll('[data-ba]').forEach(el => {
    const handle = el.querySelector('.ba-handle');
    const after = el.querySelector('.ba-after');
    let dragging = false;
    const move = (clientX) => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      handle.style.left = (p * 100) + '%';
      after.style.clipPath = `inset(0 0 0 ${p * 100}%)`;
    };
    el.addEventListener('mousedown', (e) => { dragging = true; move(e.clientX); });
    window.addEventListener('mouseup', () => dragging = false);
    window.addEventListener('mousemove', (e) => { if (dragging) move(e.clientX); });
    el.addEventListener('touchstart', (e) => move(e.touches[0].clientX), { passive: true });
    el.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
  });

  // --- contact funnel
  const funnel = document.querySelector('[data-funnel]');
  if (funnel) {
    const steps = funnel.querySelectorAll('.f-step');
    const dots  = funnel.querySelectorAll('.f-dot');
    let i = 0;
    const show = (n) => {
      i = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      dots.forEach((d, k) => d.classList.toggle('on', k <= i));
    };
    funnel.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => show(i + 1)));
    funnel.querySelectorAll('[data-prev]').forEach(b => b.addEventListener('click', () => show(i - 1)));
    show(0);
  }

  // --- projets filter
  const filterRoot = document.querySelector('[data-filter]');
  if (filterRoot) {
    const items = filterRoot.querySelectorAll('[data-tag]');
    filterRoot.querySelectorAll('[data-filter-btn]').forEach(b => {
      b.addEventListener('click', () => {
        filterRoot.querySelectorAll('[data-filter-btn]').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        const k = b.getAttribute('data-filter-btn');
        items.forEach(it => {
          const show = k === 'all' || (it.getAttribute('data-tag') || '').includes(k);
          it.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // --- accordion
  document.querySelectorAll('[data-acc]').forEach(acc => {
    acc.querySelectorAll('.acc-row').forEach(row => {
      row.querySelector('.acc-h').addEventListener('click', () => row.classList.toggle('on'));
    });
  });
})();

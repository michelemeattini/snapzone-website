'use strict';

/* =====================================================
   SNAPZONE — script.js v3
   - Announce bar dismiss
   - Theme toggle
   - Noise canvas
   - Navbar scroll state
   - FancyZone showcase animation
   - Scroll reveal
   - SVG chart
   - Counter
   - Pricing currency toggle + device detach
   ===================================================== */


// ─────────────────────────────────────────────────────
// 0. INTERNATIONALIZATION (i18n)
// ─────────────────────────────────────────────────────
(function initI18n() {
  const translations = window.SnapZoneTranslations;
  if (!translations) return;

  const supportedLangs = ['en', 'it', 'es'];
  let currentLang = localStorage.getItem('sz-lang');

  if (!currentLang) {
    const browserLang = navigator.language ? navigator.language.split('-')[0] : 'en';
    currentLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
  } else if (!supportedLangs.includes(currentLang)) {
    currentLang = 'en';
  }

  function translate() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = translations[currentLang][key];
      if (text !== undefined) {
        const svg = el.querySelector('svg');
        const containsHtml = text.includes('<') || text.includes('&');
        
        if (svg) {
          const clonedSvg = svg.cloneNode(true);
          el.innerHTML = '';
          el.appendChild(clonedSvg);
          
          if (containsHtml) {
            const span = document.createElement('span');
            span.innerHTML = ' ' + text;
            el.appendChild(span);
          } else {
            el.appendChild(document.createTextNode(' ' + text));
          }
        } else {
          if (containsHtml) {
            el.innerHTML = text;
          } else {
            el.textContent = text;
          }
        }
      }
    });

    // Update active class on selector buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });

    // Save language to html tag for accessibility / layout tweaks
    document.documentElement.setAttribute('lang', currentLang);
  }

  // Bind click handlers
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-lang');
      if (selected && selected !== currentLang) {
        currentLang = selected;
        localStorage.setItem('sz-lang', currentLang);
        translate();
        
        // Trigger repaint event
        window.dispatchEvent(new CustomEvent('sz-lang-changed', { detail: currentLang }));
      }
    });
  });

  // Initial execution
  translate();
})();


// ─────────────────────────────────────────────────────
// 1. ANNOUNCE BAR
// ─────────────────────────────────────────────────────
(function initAnnounce() {
  const bar   = document.getElementById('announce-bar');
  const close = document.getElementById('announce-close');
  if (!bar || !close) return;

  // Restore dismissed state
  if (sessionStorage.getItem('sz-announce-dismissed') === '1') {
    bar.classList.add('dismissed');
    document.documentElement.style.setProperty('--announce-h', '0px');
  }

  close.addEventListener('click', () => {
    bar.classList.add('dismissed');
    // Animate nav down immediately via CSS var
    document.documentElement.style.setProperty('--announce-h', '0px');
    sessionStorage.setItem('sz-announce-dismissed', '1');
  });
})();


// ─────────────────────────────────────────────────────
// 2. THEME TOGGLE
// ─────────────────────────────────────────────────────
(function initTheme() {
  const html = document.documentElement;
  const btn  = document.getElementById('theme-toggle');
  if (!btn) return;

  const saved = localStorage.getItem('sz-theme') || 'light';
  html.setAttribute('data-theme', saved);

  function setTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('sz-theme', t);
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  btn.addEventListener('click', () => {
    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('sz-theme')) {
      html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
})();


// ─────────────────────────────────────────────────────
// 3. NOISE CANVAS
// ─────────────────────────────────────────────────────
(function initNoise() {
  const canvas = document.getElementById('noise-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let raf;

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

  function drawNoise() {
    const { width: w, height: h } = canvas;
    const img = ctx.createImageData(w, h);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    raf = requestAnimationFrame(drawNoise);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) drawNoise(); else cancelAnimationFrame(raf);
  }).observe(canvas);
})();


// ─────────────────────────────────────────────────────
// 4. NAVBAR SCROLL STATE
// ─────────────────────────────────────────────────────
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  let ticking = false;
  function update() { nav.classList.toggle('scrolled', window.scrollY > 24); ticking = false; }
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  update();
})();


// ─────────────────────────────────────────────────────
// 5. FANCYZONE SHOWCASE ANIMATION
// ─────────────────────────────────────────────────────
(function initFancyZoneShowcase() {
  const showcase = document.getElementById('fancyzone');
  const win = document.getElementById('fzd-window');
  const z1 = document.getElementById('fzd-z1');
  const z2 = document.getElementById('fzd-z2');
  const badge = document.getElementById('fzd-snap-badge');

  if (!showcase || !win || !z1 || !z2 || !badge) return;

  let activeTimeout = null;
  let running = false;
  let step = 0;

  const states = [
    // State 0: Float Center
    {
      style: { top: '22%', left: '22%', width: '55%', height: '55%' },
      activeZone: null,
      badgeText: '',
      delay: 1800
    },
    // State 1: Dragging towards Left Half
    {
      style: { top: '16%', left: '8%', width: '48%', height: '50%' },
      activeZone: z1,
      badgeText: '',
      delay: 800
    },
    // State 2: Snapped Left Half
    {
      style: { top: '6px', left: '6px', width: 'calc(50% - 9px)', height: 'calc(100% - 12px)' },
      activeZone: z1,
      badgeText_i18n: 'fz_toast_left',
      delay: 2400
    },
    // State 3: Float Center
    {
      style: { top: '22%', left: '22%', width: '55%', height: '55%' },
      activeZone: null,
      badgeText: '',
      delay: 1800
    },
    // State 4: Dragging towards Right Half
    {
      style: { top: '16%', left: '44%', width: '48%', height: '50%' },
      activeZone: z2,
      badgeText: '',
      delay: 800
    },
    // State 5: Snapped Right Half
    {
      style: { top: '6px', left: 'calc(50% + 3px)', width: 'calc(50% - 9px)', height: 'calc(100% - 12px)' },
      activeZone: z2,
      badgeText_i18n: 'fz_toast_right',
      delay: 2400
    }
  ];

  function runNextStep() {
    if (!running) return;

    const state = states[step];

    // Apply styles to window
    Object.keys(state.style).forEach(key => {
      win.style[key] = state.style[key];
    });

    // Toggle active zone styles
    z1.classList.remove('fzd-active');
    z2.classList.remove('fzd-active');
    if (state.activeZone) {
      state.activeZone.classList.add('fzd-active');
    }

    // Badge control (using i18n key lookup)
    if (state.badgeText_i18n) {
      const activeLang = localStorage.getItem('sz-lang') || 'en';
      const text = window.SnapZoneTranslations && window.SnapZoneTranslations[activeLang]
        ? window.SnapZoneTranslations[activeLang][state.badgeText_i18n]
        : 'Snapped';
      badge.textContent = text;
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }

    // Move to next step
    step = (step + 1) % states.length;

    // Schedule next
    activeTimeout = setTimeout(runNextStep, state.delay);
  }

  function start() {
    if (running) return;
    running = true;
    runNextStep();
  }

  function stop() {
    running = false;
    if (activeTimeout) clearTimeout(activeTimeout);
    // Reset window to center
    if (win) {
      win.style.top = '22%';
      win.style.left = '22%';
      win.style.width = '55%';
      win.style.height = '55%';
    }
    z1.classList.remove('fzd-active');
    z2.classList.remove('fzd-active');
    badge.classList.remove('visible');
    step = 0;
  }

  // Observe intersection to play animation only when visible
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      start();
    } else {
      stop();
    }
  }, { threshold: 0.15 }).observe(showcase);
})();


// ─────────────────────────────────────────────────────
// 6. SCROLL REVEAL
// ─────────────────────────────────────────────────────
(function initReveal() {
  const targets = document.querySelectorAll(
    '.method-card, .bento-card, .testi-card, .chart-card, .analytics-text, .section-h2, .section-sub, .pricing-card'
  );
  targets.forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = `${(i % 4) * 0.07}s`;
  });
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        // eslint-disable-next-line no-undef
        (new IntersectionObserver(() => {})).unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }).observe(
    ...targets.length ? targets : [document.body]
  );

  // Re-observe individually
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(el => obs.observe(el));
})();


// ─────────────────────────────────────────────────────
// 7. SVG CHART & SAVINGS CALCULATOR
// ─────────────────────────────────────────────────────
(function initChartAndCalculator() {
  const svg  = document.getElementById('chart-svg');
  const fill = document.getElementById('chart-fill');
  const line = document.getElementById('chart-line');
  const dots = document.getElementById('chart-dots');
  const slider = document.getElementById('calc-hours-slider');
  const sliderVal = document.getElementById('calc-hours-val');
  const totalValEl = document.getElementById('chart-total-val');
  const disclaimerEl = document.getElementById('info-disclaimer-card');

  if (!svg || !fill || !line || !dots) return;

  const values = [32, 41, 29, 47, 38, 51, 47];
  const W = 340, H_height = 120, padX = 8, padY = 10;
  const maxV = 87; // Fixed max value to make the line scale up and down dynamically
  
  let revealed = false;

  function updateChart(hours) {
    const scale = hours / 8;
    const currentValues = values.map(v => v * scale);

    const toX = i => padX + (i / (currentValues.length - 1)) * (W - padX * 2);
    const toY = v => padY + (1 - v / maxV) * (H_height - padY * 2);
    const pts = currentValues.map((v, i) => ({ x: toX(i), y: toY(v) }));

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const t = 0.4;
      d += ` C ${pts[i-1].x + (pts[i].x - pts[i-1].x) * t} ${pts[i-1].y}, ${pts[i].x - (pts[i].x - pts[i-1].x) * t} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }

    line.setAttribute('d', d);
    fill.setAttribute('d', d + ` L ${toX(currentValues.length-1)} ${H_height - padY} L ${toX(0)} ${H_height - padY} Z`);

    // Reset dash properties if already animated/revealed
    if (revealed) {
      line.style.strokeDasharray = 'none';
      line.style.strokeDashoffset = '0';
      line.style.transition = 'none';
    }

    dots.innerHTML = '';
    pts.forEach(p => {
      const o = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      o.setAttribute('cx', p.x); o.setAttribute('cy', p.y); o.setAttribute('r', '5');
      o.setAttribute('fill', 'var(--primary)'); o.setAttribute('opacity', '0.2');
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', '3');
      c.setAttribute('fill', 'var(--primary)');
      dots.appendChild(o); dots.appendChild(c);
    });
  }

  function updateDisclaimerText(hours) {
    if (!disclaimerEl) return;
    const p = disclaimerEl.querySelector('p');
    if (!p) return;

    const currentLang = document.documentElement.getAttribute('lang') || 'en';
    const translations = window.SnapZoneTranslations;
    if (!translations || !translations[currentLang]) return;

    const rawText = translations[currentLang]['chart_disclaimer'];
    if (!rawText) return;

    const snapsPerDay = Math.round(hours * 14.625);
    
    // Replace 8 with selected hours and 117 with dynamically computed snaps per day
    const updatedText = rawText
      .replace(/(\b8\b|8(?=h|o))/g, hours)
      .replace(/\b117\b/g, snapsPerDay);

    p.textContent = updatedText;
  }

  function updateSavings(hours) {
    if (sliderVal) {
      sliderVal.textContent = `${hours}h`;
    }

    // Calculate total time saved per month
    const totalMinutes = hours * 32.90625;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);

    if (totalValEl) {
      totalValEl.textContent = `${h}h ${m}m`;
    }

    updateDisclaimerText(hours);
    updateChart(hours);
  }

  // Set up initial state with slider default value (8)
  const initialHours = slider ? parseInt(slider.value, 10) : 8;
  updateSavings(initialHours);

  if (slider) {
    slider.addEventListener('input', (e) => {
      const H = parseInt(e.target.value, 10);
      updateSavings(H);
    });
  }

  // Handle language change event
  window.addEventListener('sz-lang-changed', () => {
    const H = slider ? parseInt(slider.value, 10) : 8;
    updateDisclaimerText(H);
  });

  // Reveal animation on intersection
  const length = line.getTotalLength?.() ?? 700;
  line.style.strokeDasharray  = length;
  line.style.strokeDashoffset = length;

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      line.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)';
      line.style.strokeDashoffset = '0';
      revealed = true;
      setTimeout(() => {
        if (revealed) {
          line.style.strokeDasharray = 'none';
        }
      }, 1800);
    }
  }, { threshold: 0.25 }).observe(svg);
})();


// ─────────────────────────────────────────────────────
// 9. PRICING — CURRENCY TOGGLE
// ─────────────────────────────────────────────────────
(function initPricing() {
  const btnUsd = document.getElementById('btn-usd');
  const btnEur = document.getElementById('btn-eur');
  if (!btnUsd || !btnEur) return;

  function switchCurrency(currency) {
    // Toggle active button styles
    [btnUsd, btnEur].forEach(b => b.classList.remove('curr-active'));
    (currency === 'usd' ? btnUsd : btnEur).classList.add('curr-active');

    // Update all elements with data-usd / data-eur attributes
    document.querySelectorAll('[data-usd][data-eur]').forEach(el => {
      el.textContent = el.getAttribute(`data-${currency}`) || el.textContent;
    });
  }

  btnUsd.addEventListener('click', () => switchCurrency('usd'));
  btnEur.addEventListener('click', () => switchCurrency('eur'));
})();


// ─────────────────────────────────────────────────────
// 10. PRICING — DEVICE MANAGEMENT (ADD / DETACH SIMULATOR)
// ─────────────────────────────────────────────────────
(function initDevices() {
  const container = document.querySelector('.pd-slots');
  if (!container) return;

  const macNamesPool = ["MacBook Air", "Mac Studio", "iMac", "Mac Pro", "MacBook Pro 16\""];

  function getAvailableMacName() {
    // Find all currently occupied Mac names
    const occupiedNames = Array.from(container.querySelectorAll('.pd-occupied .pd-name')).map(el => el.textContent.trim());
    // Pick the first one from pool that is not currently occupied
    const available = macNamesPool.filter(name => !occupiedNames.includes(name));
    if (available.length > 0) {
      return available[0];
    }
    // Fallback if all are occupied
    return macNamesPool[Math.floor(Math.random() * macNamesPool.length)];
  }

  container.addEventListener('click', (e) => {
    // 1. DETACH CLICK
    const detachBtn = e.target.closest('.pd-detach');
    if (detachBtn) {
      e.stopPropagation();
      const slot = detachBtn.closest('.pd-slot');
      if (!slot) return;

      // Animate out the device slot
      slot.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      slot.style.opacity = '0';
      slot.style.transform = 'scale(0.95)';

      setTimeout(() => {
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        const label = (window.SnapZoneTranslations && window.SnapZoneTranslations[currentLang] && window.SnapZoneTranslations[currentLang]['pricing_slot_empty']) || 'Add a Mac';

        slot.className = 'pd-slot pd-empty';
        slot.innerHTML = `
          <svg class="pd-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span class="pd-name" data-i18n="pricing_slot_empty">${label}</span>
        `;
        slot.style.opacity = '1';
        slot.style.transform = 'scale(1)';
      }, 200);
      return;
    }

    // 2. ADD CLICK
    const emptySlot = e.target.closest('.pd-empty');
    if (emptySlot) {
      e.stopPropagation();
      const newName = getAvailableMacName();

      // Animate transition
      emptySlot.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      emptySlot.style.opacity = '0';
      emptySlot.style.transform = 'scale(0.95)';

      setTimeout(() => {
        emptySlot.className = 'pd-slot pd-occupied';
        emptySlot.innerHTML = `
          <svg class="pd-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
          <span class="pd-name">${newName}</span>
          <button class="pd-detach" aria-label="Detach ${newName}">×</button>
        `;
        emptySlot.style.opacity = '1';
        emptySlot.style.transform = 'scale(1)';
      }, 200);
    }
  });
})();


// ─────────────────────────────────────────────────────
// 11. SMOOTH SCROLL
// ─────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});


// ─────────────────────────────────────────────────────
// 12. GESTURE ANIMATIONS — Canvas 2D, natural easing
// ─────────────────────────────────────────────────────
(function initGestureAnimations() {

  // Resolve CSS custom property from :root
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Ease-in-out cubic
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Natural swipe: slow start, peak speed in middle, decelerate. Returns [0..1] progress.
  function naturalSwipe(t) {
    // cubic ease-in-out but with slight overshoot feel
    return easeInOut(t);
  }

  // Direction vectors (normalised dx, dy) from card dataset
  const DIRS = {
    right: { dx:  1,    dy:  0   },
    left:  { dx: -1,    dy:  0   },
    up:    { dx:  0,    dy: -1   },
    tr:    { dx:  1,    dy: -1   },
    tl:    { dx: -1,    dy: -1   },
    br:    { dx:  1,    dy:  1   },
    bl:    { dx: -1,    dy:  1   },
    down:  { dx:  0,    dy:  1   },
  };

  // Finger separation and size
  const FINGER_R      = 10;   // px on 260-wide canvas
  const FINGER_SEP    = 22;   // px perpendicular to swipe direction
  const SWIPE_LENGTH  = 78;   // px travel distance
  const TRAIL_STEPS   = 36;   // number of trail ghost circles
  const PAUSE_FRAMES  = 60;   // frames of rest before loop

  // Calculate perpendicular vector (rotate 90°)
  function perp(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { px: -dy / len, py: dx / len };
  }

  // ── Draw a single frame ──
  function drawFrame(ctx, canvas, dir, progress, isDark) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background — trackpad surface
    const padBg   = isDark ? '#111419' : '#f0f1f4';
    const padRim  = isDark ? '#1d2029' : '#e0e2e8';
    const padW    = W * 0.78;
    const padH    = H * 0.72;
    const padX    = (W - padW) / 2;
    const padY    = (H - padH) / 2 + H * 0.02;
    const padR    = 14;

    // Trackpad shadow
    ctx.save();
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.10)';
    ctx.shadowBlur  = 14;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = padBg;
    ctx.beginPath();
    ctx.roundRect(padX, padY, padW, padH, padR);
    ctx.fill();
    ctx.restore();

    // Trackpad border
    ctx.strokeStyle = padRim;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(padX, padY, padW, padH, padR);
    ctx.stroke();

    // Trackpad click line (physical click line near bottom)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(padX + 12, padY + padH * 0.88);
    ctx.lineTo(padX + padW - 12, padY + padH * 0.88);
    ctx.stroke();

    const { dx, dy } = DIRS[dir];
    const { px, py } = perp(dx, dy);

    // Swipe starts more towards bottom-centre, ends towards the direction
    const cx  = W / 2;
    const cy  = H / 2 + H * 0.02;

    // Offset the start: bias slightly opposite the swipe direction
    const startX = cx - dx * SWIPE_LENGTH * 0.5;
    const startY = cy - dy * SWIPE_LENGTH * 0.5;

    // Primary colour from brand
    const primary = isDark ? 'oklch(0.60 0.18 230)' : 'oklch(0.45 0.18 230)';
    const primaryRgb = isDark ? [80, 130, 240] : [55, 100, 210];

    // Draw trail (ghost circles, fading out)
    const swipeProg = naturalSwipe(Math.min(progress, 1));
    const currentDist = swipeProg * SWIPE_LENGTH;

    for (let i = TRAIL_STEPS; i >= 1; i--) {
      const tFrac    = (i / TRAIL_STEPS);
      const trailDist = swipeProg * SWIPE_LENGTH * tFrac;
      const alpha    = (1 - tFrac) * 0.22 * swipeProg;
      const r        = FINGER_R * (0.55 + 0.45 * tFrac);

      for (let f = -1; f <= 1; f += 2) {
        const tx = startX + dx * trailDist + px * FINGER_SEP * 0.5 * f;
        const ty = startY + dy * trailDist + py * FINGER_SEP * 0.5 * f;
        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryRgb[0]},${primaryRgb[1]},${primaryRgb[2]},${alpha})`;
        ctx.fill();
      }
    }

    // Draw finger circles (two fingers)
    for (let f = -1; f <= 1; f += 2) {
      const fx = startX + dx * currentDist + px * FINGER_SEP * 0.5 * f;
      const fy = startY + dy * currentDist + py * FINGER_SEP * 0.5 * f;

      // Outer glow
      const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, FINGER_R * 2.2);
      glow.addColorStop(0, `rgba(${primaryRgb[0]},${primaryRgb[1]},${primaryRgb[2]},0.28)`);
      glow.addColorStop(1, `rgba(${primaryRgb[0]},${primaryRgb[1]},${primaryRgb[2]},0)`);
      ctx.beginPath();
      ctx.arc(fx, fy, FINGER_R * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Finger body gradient
      const grad = ctx.createRadialGradient(fx - FINGER_R * 0.3, fy - FINGER_R * 0.3, 1, fx, fy, FINGER_R);
      grad.addColorStop(0, isDark ? '#89b4f7' : '#6ea6f5');
      grad.addColorStop(1, isDark ? '#4a80e0' : '#3764c8');
      ctx.beginPath();
      ctx.arc(fx, fy, FINGER_R, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Specular highlight
      ctx.beginPath();
      ctx.arc(fx - FINGER_R * 0.3, fy - FINGER_R * 0.3, FINGER_R * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
    }
  }

  // ── Animate a single canvas ──
  function animateCard(card) {
    const canvas = card.querySelector('.gesture-canvas');
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const dir  = card.dataset.dir;
    if (!DIRS[dir]) return;

    const DURATION   = 900;   // ms for the swipe stroke
    const PAUSE_MS   = 700;   // ms of rest before restart
    const LOOP_MS    = DURATION + PAUSE_MS;

    let startTime = null;
    let rafId     = null;
    let running   = false;

    function tick(now) {
      if (!running) return;
      if (!startTime) startTime = now;
      const elapsed  = (now - startTime) % LOOP_MS;
      const progress = Math.min(elapsed / DURATION, 1);
      const isDark   = document.documentElement.getAttribute('data-theme') === 'dark'
                    || (!document.documentElement.getAttribute('data-theme')
                        && window.matchMedia('(prefers-color-scheme: dark)').matches);

      drawFrame(ctx, canvas, dir, progress, isDark);
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running   = true;
      startTime = null;
      rafId     = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    // Start/stop based on viewport visibility
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start(); else stop();
    }, { threshold: 0.1 });
    io.observe(card);

    // Also restart when theme changes (colours update)
    window.addEventListener('sz-theme-changed', () => {
      if (running) { startTime = null; }
    });
  }

  // Initialise all gesture cards
  document.querySelectorAll('.gesture-card[data-dir]').forEach(animateCard);

  // Emit theme-changed event so gesture canvases repaint with correct colours
  const origSetTheme = window.__szSetTheme;
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      setTimeout(() => window.dispatchEvent(new Event('sz-theme-changed')), 50);
    });
  }

  // ─────────────────────────────────────────────────────
  // 13. ANALYTICS DISCLAIMER POPUP
  // ─────────────────────────────────────────────────────
  (function initAnalyticsDisclaimer() {
    const infoBtn = document.getElementById('info-btn');
    const card = document.getElementById('info-disclaimer-card');
    if (!infoBtn || !card) return;

    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.toggle('visible');
    });

    document.addEventListener('click', (e) => {
      if (!card.contains(e.target) && e.target !== infoBtn) {
        card.classList.remove('visible');
      }
    });
  })();
})();

/* يلا رياضة — تجربة المشاهدة: بطاقة المشاهدة + شاشة المشاهدة (Bottom Sheet) + مشغّل MP4/HLS/Embed + Mini Player
   الروابط بتيجي من جدول match_sources (لوحة الإدارة) أو fixture_streams القديم. مفيش روابط = مفيش زر. */
(function () {
  'use strict';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const safe = (u) => { try { const x = new URL(String(u || '').trim()); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const S = (d, f) => `<svg viewBox="0 0 24 24" aria-hidden="true"${f ? ' class="f"' : ''}>${d}</svg>`;
  const I = {
    play: S('<path d="M8 5.5v13l11-6.5z"/>', 1), pause: S('<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>', 1),
    back: S('<path d="M4 12a8 8 0 108-8H8"/><path d="M8 1.5L4.5 4 8 6.5"/><text x="12" y="15.4" font-size="7.5" font-weight="900" text-anchor="middle" fill="currentColor" stroke="none">10</text>'),
    fwd: S('<path d="M20 12a8 8 0 11-8-8h4"/><path d="M16 1.5L19.5 4 16 6.5"/><text x="12" y="15.4" font-size="7.5" font-weight="900" text-anchor="middle" fill="currentColor" stroke="none">10</text>'),
    vol: S('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>'),
    mute: S('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    fs: S('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'), pip: S('<rect x="3" y="5" width="18" height="14" rx="2.5"/><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor"/>'),
    gear: S('<circle cx="12" cy="12" r="3"/><path d="M19.4 14a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
    cc: S('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 10.2a2.2 2.2 0 100 3.6M17 10.2a2.2 2.2 0 100 3.6"/>'),
    down: S('<path d="M6 9l6 6 6-6"/>'), close: S('<path d="M6 6l12 12M18 6L6 18"/>'), more: S('<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>'),
    expand: S('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'), tv: S('<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M8 21h8M9 3l3 3 3-3"/>'),
    chev: S('<path d="M9 6l6 6-6 6"/>'),
  };
  const HLS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js';
  let hlsLoad = null;
  const loadHls = () => hlsLoad || (hlsLoad = new Promise((ok, no) => { if (window.Hls) return ok(window.Hls); const s = document.createElement('script'); s.src = HLS_SRC; s.crossOrigin = 'anonymous'; s.onload = () => ok(window.Hls); s.onerror = () => { hlsLoad = null; no(new Error('hls')); }; document.head.appendChild(s); }));
  const loadYT = () => new Promise((ok, no) => { if (window.yrYT) return ok(); const s = document.createElement('script'); s.src = 'yt-player.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  const fmt = (t) => { if (!isFinite(t) || t < 0) return '0:00'; t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
  const ytOf = (u) => { try { const h = new URL(u).hostname; return /(^|\.)youtube(-nocookie)?\.com$|(^|\.)youtu\.be$/.test(h) && window.yrYT ? window.yrYT.parse(u) : (/(youtube|youtu\.be)/.test(h) ? (String(u).match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{11})/) || [])[1] : null); } catch { return null; } };

  /* ============ مشغّل MP4 / HLS بتحكّم كامل ============ */
  function videoEngine(stage, src, hooks) {
    const root = document.createElement('div'); root.className = 'wp';
    root.innerHTML = `<video playsinline preload="metadata" ${safe(src.preview_url) ? `poster="${esc(safe(src.preview_url))}"` : ''}></video>
      <div class="wp-load"><i></i></div><div class="wp-err" hidden><p>تعذّر تشغيل البث حاليًا</p><button type="button" class="wp-retry">إعادة المحاولة</button></div>
      <button type="button" class="wp-big" aria-label="تشغيل">${I.play}</button>
      <div class="wp-bar"><div class="wp-seek" dir="ltr"><i class="b"></i><i class="p"></i><b></b></div>
        <div class="wp-row"><button type="button" data-k="play" aria-label="تشغيل / إيقاف">${I.play}</button><button type="button" data-k="back" aria-label="رجوع 10 ثواني">${I.back}</button><button type="button" data-k="fwd" aria-label="تقديم 10 ثواني">${I.fwd}</button>
          <span class="wp-vol"><button type="button" data-k="mute" aria-label="الصوت">${I.vol}</button><input type="range" min="0" max="1" step="0.05" value="1" aria-label="مستوى الصوت"></span>
          <span class="wp-time" dir="ltr">0:00 / 0:00</span><span class="wp-live" hidden><i></i>LIVE</span><span class="wp-sp"></span>
          <button type="button" data-k="cc" aria-label="الترجمة" hidden>${I.cc}</button><button type="button" data-k="pip" aria-label="صورة داخل صورة" hidden>${I.pip}</button><button type="button" data-k="gear" aria-label="الإعدادات">${I.gear}</button><button type="button" data-k="fs" aria-label="ملء الشاشة">${I.fs}</button></div></div>
      <div class="wp-menu" hidden></div>`;
    stage.replaceChildren(root);
    const v = root.querySelector('video'); const $q = (s) => root.querySelector(s);
    const load = $q('.wp-load'), err = $q('.wp-err'), big = $q('.wp-big'), seek = $q('.wp-seek'), prog = $q('.p'), buf = $q('.b'), knob = $q('.wp-seek b'), time = $q('.wp-time'), liveEl = $q('.wp-live'), menu = $q('.wp-menu'), vol = $q('.wp-vol input');
    const btn = (k) => root.querySelector(`[data-k="${k}"]`);
    let hls = null; let idleT = 0; let dead = false; let live = false; let level = -1; let speed = 1; let drag = false;
    const wake = () => { root.classList.add('show'); clearTimeout(idleT); idleT = setTimeout(() => { if (!v.paused && menu.hidden && !drag) root.classList.remove('show'); }, 3000); };
    const setErr = (on) => { err.hidden = !on; if (on) load.hidden = true; };
    const sync = () => {
      const pl = !v.paused && !v.ended; root.classList.toggle('playing', pl);
      btn('play').innerHTML = pl ? I.pause : I.play; big.innerHTML = I.play; if (hooks.onState) hooks.onState(pl);
    };
    const upd = () => {
      const d = v.duration; live = !isFinite(d) || d === 0;
      liveEl.hidden = !live; seek.hidden = live; btn('back').hidden = btn('fwd').hidden = live && !(v.seekable && v.seekable.length && isFinite(v.seekable.end(0) - v.seekable.start(0)) && v.seekable.end(0) > 30);
      time.hidden = live; if (!live) { const r = v.currentTime / d; prog.style.width = knob.style.left = (r * 100) + '%'; time.textContent = `${fmt(v.currentTime)} / ${fmt(d)}`; try { const b = v.buffered; if (b.length) buf.style.width = (b.end(b.length - 1) / d * 100) + '%'; } catch { /* */ } }
    };
    const toggle = () => { if (v.paused || v.ended) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause(); };
    const seekTo = (x) => { const d = v.duration; if (!isFinite(d)) return; const r = seek.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (x - r.left) / r.width)); v.currentTime = p * d; upd(); };
    seek.addEventListener('pointerdown', (e) => { drag = true; seek.setPointerCapture(e.pointerId); seekTo(e.clientX); wake(); });
    seek.addEventListener('pointermove', (e) => { if (drag) seekTo(e.clientX); });
    seek.addEventListener('pointerup', () => { drag = false; wake(); });
    v.addEventListener('waiting', () => { load.hidden = false; }); v.addEventListener('playing', () => { load.hidden = true; setErr(false); sync(); });
    v.addEventListener('canplay', () => { load.hidden = true; }); v.addEventListener('loadedmetadata', () => { load.hidden = true; upd(); });
    v.addEventListener('play', sync); v.addEventListener('pause', () => { sync(); root.classList.add('show'); }); v.addEventListener('ended', sync);
    v.addEventListener('timeupdate', upd); v.addEventListener('progress', upd); v.addEventListener('durationchange', upd);
    v.addEventListener('volumechange', () => { btn('mute').innerHTML = v.muted || v.volume === 0 ? I.mute : I.vol; vol.value = v.muted ? 0 : v.volume; });
    v.addEventListener('error', () => { if (!hls) setErr(true); });
    root.addEventListener('pointermove', wake); root.addEventListener('pointerdown', wake); root.addEventListener('keydown', wake);
    big.addEventListener('click', toggle); v.addEventListener('click', () => { if (menu.hidden) toggle(); else menu.hidden = true; });
    btn('play').addEventListener('click', toggle);
    btn('back').addEventListener('click', () => { v.currentTime = Math.max(0, v.currentTime - 10); });
    btn('fwd').addEventListener('click', () => { v.currentTime = Math.min(isFinite(v.duration) ? v.duration : v.currentTime + 10, v.currentTime + 10); });
    btn('mute').addEventListener('click', () => { v.muted = !v.muted; });
    vol.addEventListener('input', () => { v.muted = false; v.volume = Number(vol.value); });
    btn('fs').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (root.requestFullscreen) await root.requestFullscreen(); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); if (screen.orientation && screen.orientation.lock && document.fullscreenElement) screen.orientation.lock('landscape').catch(() => {}); } catch { /* */ } });
    if (document.pictureInPictureEnabled) { btn('pip').hidden = false; btn('pip').addEventListener('click', async () => { try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await v.requestPictureInPicture(); } catch { /* */ } }); }
    // الإعدادات: بنعرض بس اللي المصدر بيدعمه فعلًا
    const drawMenu = (page) => {
      const rows = []; const levels = hls && hls.levels && hls.levels.length > 1 ? hls.levels : null;
      if (page === 'q' && levels) { menu.innerHTML = `<button data-b="1" class="mh">‹ الجودة</button><button data-lv="-1" class="${level === -1 ? 'on' : ''}">تلقائية (Auto)</button>` + levels.map((l, i) => ({ l, i })).sort((a, b) => b.l.height - a.l.height).map(({ l, i }) => `<button data-lv="${i}" class="${level === i ? 'on' : ''}">${l.height ? l.height + 'p' + (l.height >= 1080 ? ' Full HD' : l.height >= 720 ? ' HD' : '') : Math.round(l.bitrate / 1000) + 'kbps'}</button>`).join(''); }
      else if (page === 's') { menu.innerHTML = `<button data-b="1" class="mh">‹ سرعة التشغيل</button>` + [0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => `<button data-sp="${s}" class="${speed === s ? 'on' : ''}">${s === 1 ? 'عادية' : s + 'x'}</button>`).join(''); }
      else if (page === 'src' && hooks.sources && hooks.sources.length > 1) { menu.innerHTML = `<button data-b="1" class="mh">‹ مصدر البث</button>` + hooks.sources.map((x, i) => `<button data-src="${i}" class="${i === hooks.index ? 'on' : ''}">${esc((x.kind === 'live' ? 'بث مباشر' : 'ملخص') + (x.channel ? ' — ' + x.channel : ''))}</button>`).join(''); }
      else {
        if (levels) rows.push(`<button data-p="q">الجودة<em>${level === -1 ? 'تلقائية' : (levels[level] && levels[level].height ? levels[level].height + 'p' : '')}</em></button>`);
        if (!live) rows.push(`<button data-p="s">سرعة التشغيل<em>${speed === 1 ? 'عادية' : speed + 'x'}</em></button>`);
        if (hooks.sources && hooks.sources.length > 1) rows.push(`<button data-p="src">مصدر البث<em>${esc(hooks.sources[hooks.index].channel || '')}</em></button>`);
        menu.innerHTML = rows.join('') || '<p class="mn">لا توجد إعدادات إضافية لهذا المصدر.</p>';
      }
    };
    btn('gear').addEventListener('click', (e) => { e.stopPropagation(); if (menu.hidden) { drawMenu(); menu.hidden = false; } else menu.hidden = true; wake(); });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      if (b.dataset.b) drawMenu(); else if (b.dataset.p) drawMenu(b.dataset.p);
      else if (b.dataset.lv != null) { level = Number(b.dataset.lv); if (hls) hls.currentLevel = level; menu.hidden = true; if (hooks.onQuality) hooks.onQuality(); }
      else if (b.dataset.sp) { speed = Number(b.dataset.sp); v.playbackRate = speed; menu.hidden = true; }
      else if (b.dataset.src != null) { menu.hidden = true; hooks.pick(Number(b.dataset.src)); }
    });
    root.addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase(); if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); } else if (k === 'arrowleft') v.currentTime -= 10; else if (k === 'arrowright') v.currentTime += 10; else if (k === 'm') v.muted = !v.muted; else if (k === 'f') btn('fs').click(); });
    root.tabIndex = 0;
    const start = async () => {
      setErr(false); load.hidden = false;
      try {
        if (src.src_type === 'hls') {
          if (v.canPlayType('application/vnd.apple.mpegurl')) v.src = src.url;
          else {
            const Hls = await loadHls(); if (dead) return;
            if (!Hls.isSupported()) throw new Error('unsupported');
            hls = new Hls({ enableWorker: true, lowLatencyMode: true });
            hls.on(Hls.Events.MANIFEST_PARSED, () => { load.hidden = true; if (hls.subtitleTracks && hls.subtitleTracks.length) { btn('cc').hidden = false; } upd(); });
            hls.on(Hls.Events.ERROR, (_e, d) => { if (!d.fatal) return; if (d.type === Hls.ErrorTypes.NETWORK_ERROR) { hls.startLoad(); setTimeout(() => { if (v.readyState < 2) setErr(true); }, 6000); } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError(); else { setErr(true); } });
            hls.loadSource(src.url); hls.attachMedia(v);
          }
        } else v.src = src.url;
        v.load();
      } catch (e) { setErr(true); }
    };
    btn('cc').addEventListener('click', () => { if (hls && hls.subtitleTracks && hls.subtitleTracks.length) { hls.subtitleDisplay = !hls.subtitleDisplay; if (hls.subtitleTrack < 0) hls.subtitleTrack = 0; btn('cc').classList.toggle('on', hls.subtitleDisplay); } });
    root.querySelector('.wp-retry').addEventListener('click', () => { if (hls) { hls.destroy(); hls = null; } v.removeAttribute('src'); start(); });
    start(); wake(); sync();
    return {
      el: root, toggle, playing: () => !v.paused && !v.ended, pause: () => v.pause(),
      info: () => ({ quality: level === -1 && hls ? (hls.levels && hls.levels[hls.currentLevel] && hls.levels[hls.currentLevel].height ? hls.levels[hls.currentLevel].height : 0) : (hls && hls.levels && hls.levels[level] ? hls.levels[level].height : v.videoHeight || 0), auto: level === -1 }),
      destroy: () => { dead = true; clearTimeout(idleT); try { if (hls) hls.destroy(); v.pause(); v.removeAttribute('src'); v.load(); } catch { /* */ } root.remove(); },
    };
  }

  /* ============ Embed عادي (iframe): مفيش ادّعاء تحكّم مش متاح ============ */
  function iframeEngine(stage, src) {
    const wrap = document.createElement('div'); wrap.className = 'wp wp-ifr';
    wrap.innerHTML = '<div class="wp-load"><i></i></div><div class="wp-err" hidden><p>تعذّر تحميل البث</p><button type="button" class="wp-retry">إعادة المحاولة</button></div>';
    stage.replaceChildren(wrap);
    const mk = () => {
      wrap.querySelectorAll('iframe').forEach((x) => x.remove()); wrap.querySelector('.wp-load').hidden = false; wrap.querySelector('.wp-err').hidden = true;
      const f = document.createElement('iframe'); f.src = src.url; f.title = 'مشاهدة المباراة'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin'; f.sandbox = 'allow-scripts allow-same-origin allow-presentation allow-popups';
      f.addEventListener('load', () => { wrap.querySelector('.wp-load').hidden = true; }); wrap.prepend(f);
      setTimeout(() => { wrap.querySelector('.wp-load').hidden = true; }, 15000);
    };
    wrap.querySelector('.wp-retry').addEventListener('click', mk); mk();
    return { el: wrap, destroy: () => wrap.remove(), info: () => ({ quality: 0, auto: true }) };
  }

  /* ============ الشاشة نفسها ============ */
  const state = { ctx: null, sources: [], index: 0, engine: null, root: null, social: null };
  function ensureSheet() {
    if (state.root) return state.root;
    const r = document.createElement('div'); r.className = 'ws'; r.hidden = true;
    r.innerHTML = `<div class="ws-back"></div>
      <section class="ws-panel" role="dialog" aria-modal="true" aria-label="مشاهدة المباراة">
        <header class="ws-hd"><button type="button" class="ws-ic" data-a="min" aria-label="تصغير">${I.down}</button><b>مشاهدة المباراة</b><button type="button" class="ws-ic" data-a="src" aria-label="مصادر المشاهدة">${I.more}</button><button type="button" class="ws-ic" data-a="close" aria-label="إغلاق">${I.close}</button></header>
        <div class="ws-spacer"></div>
        <div class="ws-scroll"><div class="ws-info" id="ws-info"></div><div id="ws-social"></div></div>
      </section>
      <div class="ws-vid" id="ws-vid"></div>
      <div class="ws-mini-ctl" data-a="expand"><button type="button" data-a="mtoggle" aria-label="تشغيل / إيقاف">${I.play}</button><button type="button" data-a="expand" aria-label="تكبير">${I.expand}</button><button type="button" data-a="close" aria-label="إغلاق">${I.close}</button></div>
      <div class="ws-pick" hidden></div>`;
    document.body.appendChild(r); state.root = r;
    r.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]'); if (!a) { if (e.target.closest('.ws-pick')) return; r.querySelector('.ws-pick').hidden = true; return; }
      const k = a.dataset.a;
      if (k === 'min') minimize(); else if (k === 'close') close(); else if (k === 'expand') expand();
      else if (k === 'mtoggle') { if (state.engine && state.engine.toggle) state.engine.toggle(); }
      else if (k === 'src') togglePicker();
    });
    r.querySelector('.ws-back').addEventListener('click', minimize);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !r.hidden && !r.classList.contains('ws--mini')) { if (document.fullscreenElement) return; minimize(); } });
    // سحب الهيدر لتحت = تصغير
    const hd = r.querySelector('.ws-hd'); let y0 = null;
    hd.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    hd.addEventListener('touchmove', (e) => { if (y0 != null && e.touches[0].clientY - y0 > 70) { y0 = null; minimize(); } }, { passive: true });
    return r;
  }
  const lock = (on) => { document.documentElement.classList.toggle('ws-lock', on); };
  function open() {
    const r = ensureSheet(); r.hidden = false; r.classList.remove('ws--mini'); lock(true);
    requestAnimationFrame(() => requestAnimationFrame(() => r.classList.add('open')));
    r.querySelector('.ws-panel').focus && r.querySelector('.ws-panel').setAttribute('tabindex', '-1');
  }
  function minimize() { const r = state.root; if (!r || r.hidden) return; r.classList.add('ws--mini'); lock(false); const b = r.querySelector('[data-a="mtoggle"]'); if (b) b.hidden = !(state.engine && state.engine.toggle); }
  function expand() { const r = state.root; if (!r) return; r.classList.remove('ws--mini'); lock(true); }
  function close() {
    const r = state.root; if (!r) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (state.engine) { state.engine.destroy(); state.engine = null; }
    r.classList.remove('open', 'ws--mini'); lock(false);
    if (state.social && state.social.stop) state.social.stop();
    setTimeout(() => { if (!r.classList.contains('open')) r.hidden = true; }, 380);
    if (window.yrWatchOnClose) window.yrWatchOnClose();
  }
  function togglePicker() {
    const p = state.root.querySelector('.ws-pick');
    if (!p.hidden) { p.hidden = true; return; }
    const list = state.sources;
    p.innerHTML = `<h4>مصادر المشاهدة</h4>` + (list.length ? list.map((x, i) => `<button type="button" data-i="${i}" class="${i === state.index ? 'on' : ''}"><span>${x.kind === 'live' ? '<i class="rd"></i>' : ''}${esc(x.kind === 'live' ? 'بث مباشر' : 'ملخص المباراة')}</span><small>${esc(x.channel || '')}</small></button>`).join('') : '<p>لا توجد مصادر.</p>');
    p.hidden = false;
    p.onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; p.hidden = true; play(Number(b.dataset.i)); };
  }
  function qualityLabel(src, eng) {
    if (src.src_type === 'embed') return 'تلقائية';
    const q = eng && eng.info ? eng.info() : { quality: 0, auto: true };
    if (!q.quality) return q.auto ? 'تلقائية' : '—';
    return q.quality + 'p' + (q.quality >= 1080 ? ' Full HD' : q.quality >= 720 ? ' HD' : '');
  }
  function drawInfo(src) {
    const c = state.ctx; const el = state.root.querySelector('#ws-info'); if (!el) return;
    const st = c.status === 'live' ? ['LIVE', 'live'] : c.status === 'finished' ? ['FULL TIME', 'fin'] : ['لم تبدأ', 'soon'];
    el.innerHTML = `<h2>${esc(c.title)}</h2><p class="ws-lg">${esc(c.league || '')}</p>
      <div class="ws-chips"><span class="ws-chip ${st[1]}">${st[1] === 'live' ? '<i></i>' : ''}${st[0]}</span><span class="ws-chip">${src.kind === 'live' ? 'بث مباشر' : 'ملخص المباراة'}</span></div>
      <div class="ws-src"><span class="ws-tv">${I.tv}</span><div><b>${esc(src.channel || 'مصدر البث')}</b><small id="ws-q">الجودة: ${esc(qualityLabel(src, state.engine))}</small></div></div>`;
  }
  async function play(i) {
    const src = state.sources[i]; if (!src) return;
    state.index = i;
    const stage = state.root.querySelector('#ws-vid');
    if (state.engine) { state.engine.destroy(); state.engine = null; }
    stage.replaceChildren(); stage.classList.remove('lockbox');
    const hooks = { sources: state.sources, index: i, pick: play, onState: (pl) => { const b = state.root.querySelector('[data-a="mtoggle"]'); if (b) b.innerHTML = pl ? I.pause : I.play; }, onQuality: () => setTimeout(() => { const q = state.root.querySelector('#ws-q'); if (q) q.textContent = 'الجودة: ' + qualityLabel(src, state.engine); }, 300) };
    const yt = src.src_type === 'embed' ? ytOf(src.url) : null;
    try {
      if (yt) {
        await loadYT(); const ctl = window.yrYT.mount(stage, yt, state.ctx.title, src.url);
        state.engine = { el: stage, destroy: () => { ctl.destroy(); stage.replaceChildren(); }, toggle: ctl.toggle, playing: ctl.playing, info: () => ({ quality: 0, auto: true }) };
      } else if (src.src_type === 'embed') state.engine = iframeEngine(stage, src);
      else state.engine = videoEngine(stage, src, hooks);
    } catch (e) { console.error('watch engine:', e); stage.innerHTML = '<div class="wp-err"><p>تعذّر تحميل المشغّل</p></div>'; }
    drawInfo(src); hooks.onQuality(); const mt = state.root.querySelector('[data-a="mtoggle"]'); if (mt) mt.hidden = !(state.engine && state.engine.toggle);
  }

  /* ============ فتح الشاشة من البطاقة ============ */
  async function launch(ctx, sources, primaryKind) {
    state.ctx = ctx; state.sources = sources;
    const r = ensureSheet(); open();
    const stage = r.querySelector('#ws-vid');
    if (!ctx.signedIn) { // الزائر: بنقفل المشغّل ونطلب تسجيل الدخول (الروابط للأعضاء فقط)
      stage.classList.add('lockbox'); stage.innerHTML = window.yrLockBox ? window.yrLockBox('المشاهدة للأعضاء فقط', 'سجّل دخولك بحسابك لمشاهدة هذه المباراة.') : '';
      r.querySelector('#ws-info').innerHTML = `<h2>${esc(ctx.title)}</h2><p class="ws-lg">${esc(ctx.league || '')}</p>`;
    } else {
      const i = Math.max(0, sources.findIndex((x) => x.kind === primaryKind && x.is_default)); const j = i >= 0 && sources[i] && sources[i].kind === primaryKind && sources[i].is_default ? i : Math.max(0, sources.findIndex((x) => x.kind === primaryKind));
      await play(j);
    }
    if (window.yrWatchSocial) { state.social = window.yrWatchSocial.mount(r.querySelector('#ws-social'), ctx); }
  }

  /* ============ بطاقة المشاهدة في صفحة المباراة ============ */
  const pickKind = (status, has) => {
    const order = status === 'finished' ? ['highlight', 'live'] : ['live', 'highlight'];
    return order.find((k) => has[k]) || null;
  };
  async function mount(o) {
    const host = o.host; if (!host) return;
    const { db, fixtureId } = o; let has = { live: false, highlight: false }; let sources = [];
    try {
      if (o.signedIn) {
        const q = await db.from('match_sources').select('*').eq('fixture_id', Number(fixtureId)).eq('active', true).order('is_default', { ascending: false }).order('sort_order').order('created_at');
        if (!q.error) sources = (q.data || []).map((x) => ({ ...x, url: safe(x.url), preview_url: safe(x.preview_url) })).filter((x) => x.url);
        if (!sources.length) { // النظام القديم: رابط واحد في fixture_streams
          const l = await db.from('fixture_streams').select('embed_url').eq('fixture_id', Number(fixtureId)).maybeSingle();
          const u = safe(l.data && l.data.embed_url);
          if (u) { const p = (() => { try { return new URL(u).pathname.toLowerCase(); } catch { return ''; } })(); sources = [{ id: 'legacy', fixture_id: Number(fixtureId), kind: o.status === 'finished' ? 'highlight' : 'live', url: u, src_type: /\.m3u8$/.test(p) ? 'hls' : /\.(mp4|webm)$/.test(p) ? 'mp4' : 'embed', channel: '', preview_url: '', active: true, is_default: true }]; }
        }
        has = { live: sources.some((x) => x.kind === 'live'), highlight: sources.some((x) => x.kind === 'highlight') };
      } else {
        const r = await db.rpc('watch_info', { p_fixture: Number(fixtureId) });
        if (r.error || !r.data) return;
        has = { live: Boolean(r.data.live), highlight: Boolean(r.data.highlight) };
        if (r.data.legacy) has[o.status === 'finished' ? 'highlight' : 'live'] = true;
      }
    } catch (e) { console.error('watch sources:', e); return; }
    const kind = pickKind(o.status, has);
    host.replaceChildren();
    if (!kind) return; // مفيش روابط → مفيش بطاقة ولا زر
    const first = sources.find((x) => x.kind === kind && x.preview_url);
    const live = kind === 'live';
    host.innerHTML = `<article class="wc ${live ? 'wc-live' : 'wc-hl'}"><div class="wc-bg"${first ? ` style="background-image:url('${esc(first.preview_url)}')"` : ''}></div><div class="wc-in">
      <span class="wc-tag">${live ? '<i></i>بث مباشر الآن' : 'ملخص المباراة'}</span>
      <h3>${live ? 'تابع المباراة لحظة بلحظة' : 'أهم لحظات المباراة'}</h3><p>${live ? 'استمتع بمشاهدة المباراة بجودة عالية' : 'شاهد أهم لحظات المباراة'}</p>
      <button type="button" class="wc-btn">${live ? 'شاهد المباراة بث مباشر الآن' : 'شاهد ملخص المباراة'}${I.play}</button></div></article>`;
    host.querySelector('.wc-btn').addEventListener('click', () => launch({ db, fixtureId: Number(fixtureId), title: o.title, league: o.league, status: o.status, signedIn: o.signedIn, userId: o.userId, shareUrl: o.shareUrl }, sources, kind));
    if (o.autoOpen) host.querySelector('.wc-btn').click();
    return true;
  }
  window.yrWatch = { mount, minimize, expand, close };
})();

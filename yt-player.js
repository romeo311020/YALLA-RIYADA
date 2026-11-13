/* مشغّل يلا رياضة الخاص لفيديوهات يوتيوب — شعار + أزرار + شريط تحميل. بيتحمّل تلقائيًا من app.js عند الحاجة. */
(function () {
  'use strict';
  const ID_RE = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:[^#]*&)?v=|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  let apiWait = null;
  const loadApi = () => {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (apiWait) return apiWait;
    apiWait = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { try { if (prev) prev(); } catch (e) { /* ignore */ } resolve(); };
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = () => { apiWait = null; reject(new Error('api')); };
      document.head.appendChild(s);
    });
    return apiWait;
  };

  function mount(box, videoId, title, plainUrl) {
    box.replaceChildren();
  const SV = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    play: SV('<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>'),
    pause: SV('<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>'),
    replay: SV('<path d="M4 12a8 8 0 108-8H8M8 1.5L4.5 4 8 6.5"/>'),
    back: SV('<path d="M5 8V4M5 8h4M5.4 8A8 8 0 1112 20"/><path d="M10 11.5v4M13.5 11.5h1.6a.9.9 0 01.9.9v2.2a.9.9 0 01-.9.9h-1.6a.9.9 0 01-.9-.9v-2.2a.9.9 0 01.9-.9z" stroke-width="1.4"/>'),
    fwd: SV('<path d="M19 8V4M19 8h-4M18.6 8A8 8 0 1012 20"/><path d="M10 11.5v4M13.5 11.5h1.6a.9.9 0 01.9.9v2.2a.9.9 0 01-.9.9h-1.6a.9.9 0 01-.9-.9v-2.2a.9.9 0 01.9-.9z" stroke-width="1.4"/>'),
    vol: SV('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>'),
    vol1: SV('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 010 6"/>'),
    mute: SV('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    fs: SV('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  };
    const root = document.createElement('div'); root.className = 'yr-player'; root.tabIndex = 0; root.setAttribute('aria-label', 'مشغّل الفيديو');
    root.innerHTML = `
      <div class="yr-video"><div class="yr-yt"></div></div>
      <div class="yr-hit"></div>
      <div class="yr-top">
        <div class="yr-logo" aria-label="يلا رياضة">
          <svg viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="30" fill="#000"/><path d="M32 40L64 78M96 40L64 78M64 78V106" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="64" cy="37" r="12.5" fill="#c6ff3d"/></svg>
          <span><b>يلا رياضة</b><small>YALLA RIYADA</small></span>
        </div>
        <span class="yr-title"></span>
      </div>
      <div class="yr-big"><span>${IC.play}</span></div>
      <div class="yr-toast"></div>
      <div class="yr-load"><i></i><div class="yr-msg">جارٍ تحميل الفيديو…</div><div class="yr-bar"><b></b></div><small class="yr-pct">0%</small></div>
      <div class="yr-ctl">
        <div class="yr-seek"><div class="yr-track"><div class="yr-buf"></div><div class="yr-prog"></div><div class="yr-knob"></div></div></div>
        <div class="yr-row">
          <button type="button" class="yr-btn main b-play" aria-label="تشغيل">${IC.play}</button>
          <button type="button" class="yr-btn b-back" aria-label="رجوع ١٠ ثواني">${IC.back}</button>
          <button type="button" class="yr-btn b-fwd" aria-label="تقديم ١٠ ثواني">${IC.fwd}</button>
          <div class="yr-vol"><button type="button" class="yr-btn b-mute" aria-label="الصوت">${IC.vol}</button><input class="b-vol" type="range" min="0" max="100" value="100" aria-label="مستوى الصوت"></div>
          <span class="yr-time">0:00 / 0:00</span><span class="yr-live">● مباشر</span><span class="yr-sp"></span>
          <button type="button" class="yr-btn yr-speed b-speed" aria-label="السرعة">1×</button>
          <button type="button" class="yr-btn b-fs" aria-label="ملء الشاشة">${IC.fs}</button>
        </div>
      </div>`;
    box.appendChild(root);
    const $ = (c) => root.querySelector('.' + c);
    $('yr-title').textContent = title || '';
    let yt = null; let ready = false; let dead = false; let timer; let idleT; let dragging = false; let isLive = false; let si = 1; const speeds = [0.75, 1, 1.25, 1.5, 2];
    const t0 = Date.now();
    const tick = setInterval(() => {
      if (ready || dead) return; const el = Date.now() - t0; const p = Math.min(93, Math.round(100 * (1 - Math.exp(-el / 3200)) * 0.93 + 2));
      $('yr-bar').firstChild.style.width = p + '%'; $('yr-pct').textContent = p + '%';
      $('yr-msg').textContent = el > 10000 ? 'التحميل بياخد وقت… ممكن تضغط تحديث' : el > 6000 ? 'لحظات ويبدأ الفيديو…' : el > 2500 ? 'جارٍ الاتصال بالسيرفر…' : 'جارٍ تحميل الفيديو…';
    }, 250);
    const destroy = () => { dead = true; clearInterval(tick); clearInterval(timer); clearTimeout(idleT); try { yt && yt.destroy && yt.destroy(); } catch (e) { /* ignore */ } };
    const fallback = () => { if (dead || ready) return; destroy(); box.replaceChildren(); const f = document.createElement('iframe'); f.src = plainUrl; f.title = title || 'مشغّل'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin'; f.sandbox = 'allow-scripts allow-same-origin allow-presentation'; f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0'; box.appendChild(f); };
    const failT = setTimeout(fallback, 15000);

    const update = () => {
      if (!yt || !yt.getDuration) return; const d = yt.getDuration() || 0; const c = yt.getCurrentTime() || 0;
      isLive = !!(yt.getVideoData && yt.getVideoData().isLive) || d === 0;
      $('yr-live').style.display = isLive ? 'inline-flex' : 'none';
      if (!dragging) { const p = d ? c / d * 100 : 100; $('yr-prog').style.width = p + '%'; $('yr-knob').style.left = p + '%'; }
      $('yr-buf').style.width = (yt.getVideoLoadedFraction ? yt.getVideoLoadedFraction() * 100 : 0) + '%';
      $('yr-time').textContent = isLive ? 'بث مباشر' : fmt(c) + ' / ' + fmt(d);
    };
    const toast = (t) => { const e = $('yr-toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 700); };
    const wake = () => { root.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => root.classList.add('idle'), 2600); };
    const toggle = () => { if (!yt) return; const s = yt.getPlayerState(); if (s === 0) { yt.seekTo(0); yt.playVideo(); } else if (s === 1) yt.pauseVideo(); else yt.playVideo(); };
    const seekBy = (n) => { if (!yt || isLive) return; yt.seekTo(Math.max(0, yt.getCurrentTime() + n), true); toast((n > 0 ? '+' : '') + n + ' ث'); };
    const setVol = (v) => { yt.setVolume(v); if (v === 0) yt.mute(); else yt.unMute(); $('b-vol').value = v; $('b-mute').innerHTML = v === 0 ? IC.mute : v < 50 ? IC.vol1 : IC.vol; };
    const fs = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await (box.requestFullscreen ? box.requestFullscreen() : box.webkitRequestFullscreen()); } catch (e) { /* ignore */ } };

    $('b-play').onclick = toggle;
    $('yr-hit').onclick = (e) => { if (e.detail === 1) { clearTimeout(wake.c); wake.c = setTimeout(toggle, 220); } };
    $('yr-hit').ondblclick = () => { clearTimeout(wake.c); fs(); };
    $('b-back').onclick = () => seekBy(-10); $('b-fwd').onclick = () => seekBy(10); $('b-fs').onclick = fs;
    $('b-mute').onclick = () => { if (!yt) return; const m = yt.isMuted() || yt.getVolume() === 0; setVol(m ? Math.max(30, Number($('b-vol').value) || 60) : 0); };
    $('b-vol').oninput = (e) => setVol(Number(e.target.value));
    $('b-speed').onclick = () => { if (!yt) return; si = (si + 1) % speeds.length; yt.setPlaybackRate(speeds[si]); $('b-speed').textContent = speeds[si] + '×'; toast('السرعة ' + speeds[si] + '×'); };
    const seekTo = (x) => { const r = $('yr-seek').getBoundingClientRect(); const p = Math.min(1, Math.max(0, (x - r.left) / r.width)); $('yr-prog').style.width = p * 100 + '%'; $('yr-knob').style.left = p * 100 + '%'; return p; };
    const sk = $('yr-seek');
    sk.addEventListener('pointerdown', (e) => { if (!yt || isLive) return; dragging = true; sk.classList.add('drag'); sk.setPointerCapture(e.pointerId); seekTo(e.clientX); });
    sk.addEventListener('pointermove', (e) => { if (dragging) seekTo(e.clientX); });
    sk.addEventListener('pointerup', (e) => { if (!dragging) return; dragging = false; sk.classList.remove('drag'); yt.seekTo(seekTo(e.clientX) * yt.getDuration(), true); });
    ['mousemove', 'touchstart', 'keydown'].forEach((ev) => root.addEventListener(ev, wake, { passive: true }));
    root.addEventListener('keydown', (e) => {
      if (!yt) return; const k = e.key.toLowerCase(); let used = true;
      if (k === ' ' || k === 'k') toggle(); else if (k === 'arrowleft') seekBy(-10); else if (k === 'arrowright') seekBy(10);
      else if (k === 'arrowup') setVol(Math.min(100, yt.getVolume() + 10)); else if (k === 'arrowdown') setVol(Math.max(0, yt.getVolume() - 10));
      else if (k === 'm') $('b-mute').click(); else if (k === 'f') fs(); else used = false;
      if (used) e.preventDefault();
    });
    wake();

    loadApi().then(() => {
      if (dead) return;
      yt = new window.YT.Player(root.querySelector('.yr-yt'), {
        videoId, playerVars: { controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 0, disablekb: 1, playsinline: 1, cc_load_policy: 0, origin: location.origin },
        events: {
          onReady: () => { ready = true; clearTimeout(failT); clearInterval(tick); $('yr-bar').firstChild.style.width = '100%'; $('yr-pct').textContent = '100%'; $('yr-msg').textContent = 'تم ✓'; setTimeout(() => $('yr-load').classList.add('done'), 350); timer = setInterval(update, 250); update(); },
          onStateChange: (e) => { const s = e.data; root.classList.toggle('playing', s === 1 || s === 3); $('b-play').innerHTML = s === 1 ? IC.pause : s === 0 ? IC.replay : IC.play; if (s === 0) root.classList.remove('playing'); wake(); },
          onError: () => { clearTimeout(failT); fallback(); },
        },
      });
    }).catch(() => { clearTimeout(failT); fallback(); });
    return { destroy: () => { clearTimeout(failT); destroy(); } };
  }

  window.yrYT = { parse: (u) => (String(u || '').match(ID_RE) || [])[1] || null, mount };
})();

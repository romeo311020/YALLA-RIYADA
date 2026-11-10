/* استوديو المشاركة: كارت صورة احترافي (خبر / مباراة / لاعب / منتج / فريق) بخيارات ستايل وألوان وQR + نص بوست جاهز */
(() => {
  'use strict';
  const SITE = 'يلا رياضة', SITE_EN = 'YALLA RIYADA';
  const FOOT = 210;
  const FMT = { post: [1080, 1350], story: [1080, 1920] };
  const THEMES = {
    night: { n: 'ليلي', a: '#c6ff3d', on: '#04140b', b1: '#0b3d1f', b2: '#04140b', foot: '#04140b', t: '#ffffff', mute: 'rgba(255,255,255,.72)', sw: ['#0b3d1f', '#c6ff3d'] },
    neon: { n: 'نيون', a: '#ff4fd8', on: '#14001a', b1: '#3a0b66', b2: '#0a0120', foot: '#0a0120', t: '#ffffff', mute: 'rgba(255,255,255,.72)', sw: ['#3a0b66', '#ff4fd8'] },
    gold: { n: 'ذهبي', a: '#ffcf4a', on: '#1b1100', b1: '#4a3208', b2: '#120c00', foot: '#120c00', t: '#fff8e6', mute: 'rgba(255,248,230,.72)', sw: ['#4a3208', '#ffcf4a'] },
    light: { n: 'فاتح', a: '#0f8a3f', on: '#ffffff', b1: '#f4fff6', b2: '#d8f2de', foot: '#ffffff', t: '#0b1f14', mute: 'rgba(11,31,20,.66)', sw: ['#d8f2de', '#0f8a3f'] },
  };
  const cache = new Map();
  const loadImg = (src, cors) => new Promise((res) => { const i = new Image(); if (cors) i.crossOrigin = 'anonymous'; i.referrerPolicy = 'no-referrer'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  async function getImg(src) {
    if (!src) return null; if (cache.has(src)) return cache.get(src);
    let i = /^(\.|[a-z0-9_-]+\.(png|jpg|svg))/i.test(src) && !/^https?:/.test(src) ? await loadImg(src, false) : await loadImg(src, true);
    if (!i && /^https?:/.test(src)) i = await loadImg('https://images.weserv.nl/?url=' + encodeURIComponent(src.replace(/^https?:\/\//, '')) + '&w=1200', true);
    cache.set(src, i); return i;
  }
  let qrLib = null;
  const getQR = () => qrLib || (qrLib = new Promise((res) => {
    if (window.qrcode) return res(window.qrcode);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload = () => res(window.qrcode || null); s.onerror = () => res(null); document.head.appendChild(s);
  }));
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  function wrap(c, text, max, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean); const lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
    return lines;
  }
  const cover = (c, img, x, y, w, h) => { const r = Math.max(w / img.width, h / img.height); const iw = img.width * r, ih = img.height * r; c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); };
  const contain = (c, img, x, y, w, h) => { const r = Math.min(w / img.width, h / img.height); const iw = img.width * r, ih = img.height * r; c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); };
  const font = (w, s) => `${w} ${s}px Cairo, Tahoma, "Segoe UI", sans-serif`;
  const nAr = (v) => String(v).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

  function pill(c, text, xRight, y, th, fill, color, size = 30) {
    text = String(text).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, '').trim();
    c.font = font(900, size); const w = c.measureText(text).width + 52, h = size * 1.9;
    c.fillStyle = fill; rr(c, xRight - w, y, w, h, h / 2); c.fill(); c.fillStyle = color; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(text, xRight - 26, y + h / 2 + 2); c.textBaseline = 'alphabetic'; return { w, h };
  }
  function crest(c, img, name, cx, cy, R, th) {
    c.save(); c.fillStyle = 'rgba(255,255,255,.96)'; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 36; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.restore();
    if (img) contain(c, img, cx - R * 0.68, cy - R * 0.68, R * 1.36, R * 1.36);
    else { c.fillStyle = th.b1; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = font(900, R * 0.95); c.fillText(String(name || '?').trim().charAt(0) || '?', cx, cy + 6); c.textBaseline = 'alphabetic'; }
  }
  function bgFor(c, W, H, th) {
    const g = c.createLinearGradient(0, 0, W * 0.6, H); g.addColorStop(0, th.b1); g.addColorStop(1, th.b2); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = th.a; c.globalAlpha = 0.09; c.beginPath(); c.arc(W * 0.85, H * 0.12, 380, 0, 7); c.fill(); c.beginPath(); c.arc(W * 0.1, H * 0.62, 300, 0, 7); c.fill(); c.globalAlpha = 1;
  }
  function pitch(c, W, H, th) {
    c.save(); c.strokeStyle = th.t; c.globalAlpha = 0.07; c.lineWidth = 6;
    c.beginPath(); c.moveTo(0, H * 0.46); c.lineTo(W, H * 0.46); c.stroke(); c.beginPath(); c.arc(W / 2, H * 0.46, 210, 0, 7); c.stroke(); c.strokeRect(W * 0.22, -10, W * 0.56, 230); c.strokeRect(W * 0.22, H - FOOT - 220, W * 0.56, 230); c.restore();
  }
  async function footer(c, W, H, th, url) {
    const y = H - FOOT; c.fillStyle = th.foot; c.fillRect(0, y, W, FOOT); c.fillStyle = th.a; c.fillRect(0, y, W, 6);
    const logo = await getImg('icon-192.png'); const ls = 118;
    if (logo) { c.save(); rr(c, W - 60 - ls, y + 46, ls, ls, 28); c.clip(); c.drawImage(logo, W - 60 - ls, y + 46, ls, ls); c.restore(); }
    const tx = W - 60 - ls - 28; c.textAlign = 'right'; c.direction = 'rtl';
    c.fillStyle = th.t; c.font = font(900, 56); c.fillText(SITE, tx, y + 100);
    c.fillStyle = th.a === '#0f8a3f' ? '#0f8a3f' : th.a; c.font = font(800, 26); c.fillText(SITE_EN, tx, y + 140);
    c.font = '700 26px "Segoe UI", Arial, sans-serif'; c.fillStyle = th.mute; c.direction = 'ltr'; c.textAlign = 'right'; c.fillText(location.host, tx, y + 178); c.direction = 'rtl';
    const q = await getQR();
    if (q) {
      try {
        const qr = q(0, 'M'); qr.addData(url); qr.make(); const n = qr.getModuleCount(); const S = 150; const x0 = 60, y0 = y + 30; const pad = 10;
        c.fillStyle = '#fff'; rr(c, x0 - pad, y0 - pad, S + pad * 2, S + pad * 2, 18); c.fill(); c.fillStyle = '#04140b'; const m = S / n;
        for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) c.fillRect(x0 + k * m, y0 + r * m, Math.ceil(m), Math.ceil(m));
      } catch { /* بدون QR */ }
    }
  }
  function title(c, W, bottom, th, text, base = 74) {
    let fs = base, lines; const max = W - 120;
    for (; fs >= 44; fs -= 4) { c.font = font(900, fs); lines = wrap(c, text, max, 5); if (lines.length <= 3) break; }
    c.font = font(900, fs); lines = wrap(c, text, max, 4); const lh = fs * 1.42; const y0 = bottom - (lines.length - 1) * lh;
    c.textAlign = 'right'; c.direction = 'rtl'; lines.forEach((l, i) => c.fillText(l, W - 60, y0 + i * lh)); return { top: y0 - fs, h: lines.length * lh };
  }

  async function draw(cv, d, o) {
    const [W, H] = FMT[o.fmt] || FMT.post; cv.width = W; cv.height = H; const th = THEMES[o.theme] || THEMES.night;
    const c = cv.getContext('2d'); c.direction = 'rtl'; c.textAlign = 'right';
    try { await document.fonts.load('900 60px Cairo'); await document.fonts.load('700 30px Cairo'); } catch { /* خط النظام */ }
    bgFor(c, W, H, th); const PH = H - FOOT;
    if (d.type === 'match') {
      pitch(c, W, H, th);
      const [hi, ai] = await Promise.all([getImg(d.home && d.home.logo), getImg(d.away && d.away.logo)]);
      const cy = o.fmt === 'story' ? 740 : 520, R = 125;
      let yy = 90; if (d.league) { c.font = font(800, 34); c.textAlign = 'center'; c.fillStyle = th.mute; c.fillText(d.league, W / 2, yy + 20); }
      c.textAlign = 'right';
      const stCol = d.live ? '#ff3b4d' : th.a; const stTxt = d.live ? '● مباشر' + (d.minute ? ' · ' + nAr(d.minute) + "'" : '') : (d.finished ? 'انتهت المباراة' : 'قريبًا');
      c.font = font(900, 32); const sw = c.measureText(stTxt).width + 56; pill(c, stTxt, W / 2 + sw / 2, yy + 52, th, stCol, d.live ? '#fff' : th.on, 32);
      crest(c, hi, d.home && d.home.name, W * 0.8, cy, R, th); crest(c, ai, d.away && d.away.name, W * 0.2, cy, R, th);
      c.fillStyle = th.t; c.textAlign = 'center'; c.font = font(900, 52);
      [[d.home, W * 0.8], [d.away, W * 0.2]].forEach(([t, x]) => { const ls = wrap(c, (t && t.name) || '', 330, 2); ls.forEach((l, i) => c.fillText(l, x, cy + R + 80 + i * 62)); });
      c.direction = 'ltr'; c.textAlign = 'center';
      if (d.score) { c.font = '900 140px "Segoe UI", Cairo, Arial'; c.fillStyle = th.t; c.fillText(d.score, W / 2, cy + 50); }
      else { c.direction = 'rtl'; c.font = font(900, 84); c.fillStyle = th.a; c.fillText(d.time || 'VS', W / 2, cy + 30); }
      c.direction = 'rtl'; if (d.when) { c.font = font(700, 36); c.fillStyle = th.mute; c.textAlign = 'center'; c.fillText(d.when, W / 2, cy + R + 270); c.textAlign = 'right'; }
      if (o.fmt === 'story' && d.title) { c.font = font(900, 54); c.fillStyle = th.t; wrap(c, d.title, W - 160, 2).forEach((l, i) => c.fillText(l, W / 2, PH - 220 + i * 70)); }
      c.textAlign = 'right';
    } else {
      const img = await getImg(d.image); const full = o.layout !== 'card';
      let tagY = 60, moveY = 250;
      if (full) {
        if (img) cover(c, img, 0, 0, W, PH); else { c.fillStyle = th.a; c.globalAlpha = 0.1; c.font = font(900, 360); c.textAlign = 'center'; c.fillText(d.emoji || '⚽', W / 2, PH * 0.5); c.globalAlpha = 1; c.textAlign = 'right'; }
        const g = c.createLinearGradient(0, PH * 0.3, 0, PH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(0,0,0,.74)'); g.addColorStop(1, 'rgba(0,0,0,.95)'); c.fillStyle = g; c.fillRect(0, PH * 0.3, W, PH * 0.7);
        const gt = c.createLinearGradient(0, 0, 0, 260); gt.addColorStop(0, 'rgba(0,0,0,.55)'); gt.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gt; c.fillRect(0, 0, W, 260);
        if (d.tag) pill(c, d.tag, W - 60, tagY, th, th.a, th.on, 30);
        c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 16;
        let by = PH - 54; if (d.sub) { c.font = font(700, 36); c.fillStyle = th.a; c.fillText(d.sub, W - 60, by); by -= 74; c.fillStyle = '#fff'; }
        title(c, W, by, th, d.title, o.fmt === 'story' ? 84 : 74); c.shadowBlur = 0;
        if (d.price) { c.font = font(900, 54); const w = c.measureText(d.price).width + 64; c.fillStyle = th.a; rr(c, 60, 60, w, 92, 46); c.fill(); c.fillStyle = th.on; c.textAlign = 'center'; c.fillText(d.price, 60 + w / 2, 124); c.textAlign = 'right'; }
      } else {
        const tb = o.fmt === 'story' ? 470 : 380; const ix = 60, iy = 60, iw = W - 120, ih = PH - tb - 60 - 20;
        c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 50; c.shadowOffsetY = 20; c.fillStyle = th.b2; rr(c, ix, iy, iw, ih, 44); c.fill(); c.restore();
        c.save(); rr(c, ix, iy, iw, ih, 44); c.clip(); if (img) cover(c, img, ix, iy, iw, ih); else { c.fillStyle = th.a; c.globalAlpha = 0.12; c.fillRect(ix, iy, iw, ih); c.globalAlpha = 0.5; c.font = font(900, 300); c.textAlign = 'center'; c.fillText(d.emoji || '⚽', W / 2, iy + ih / 2 + 100); c.textAlign = 'right'; c.globalAlpha = 1; } c.restore(); moveY = iy + ih - 120;
        c.strokeStyle = th.a; c.lineWidth = 5; rr(c, ix, iy, iw, ih, 44); c.stroke();
        if (d.tag) pill(c, d.tag, W - 100, iy + 40, th, th.a, th.on, 28);
        if (d.price) { c.font = font(900, 50); const w = c.measureText(d.price).width + 60; c.fillStyle = th.a; rr(c, 100, iy + 40, w, 86, 43); c.fill(); c.fillStyle = th.on; c.textAlign = 'center'; c.fillText(d.price, 100 + w / 2, iy + 100); c.textAlign = 'right'; }
        c.fillStyle = th.t; let by = PH - 46; if (d.sub) { c.font = font(700, 34); c.fillStyle = th.a === '#0f8a3f' ? '#0f8a3f' : th.a; c.fillText(d.sub, W - 60, by); by -= 70; c.fillStyle = th.t; }
        title(c, W, by, th, d.title, 66);
      }
      if (d.move) { // انتقال لاعب: لوجو القديم ← الجديد
        const [f, t] = await Promise.all([getImg(d.move.from && d.move.from.logo), getImg(d.move.to && d.move.to.logo)]);
        const cy2 = moveY; const R = 62;
        { c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, 60, cy2 - 90, 560, 180, 90); c.fill(); crest(c, f, d.move.from && d.move.from.name, 520, cy2, R, th); crest(c, t, d.move.to && d.move.to.name, 160, cy2, R, th); c.fillStyle = th.a; c.font = font(900, 70); c.textAlign = 'center'; c.fillText('⟵', 340, cy2 + 24); c.textAlign = 'right'; }
      }
    }
    await footer(c, W, H, th, d.url);
  }

  /* ---------- الواجهة ---------- */
  const css = `.ss-back{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.62);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .25s}
.ss-back.in{opacity:1}.ss-sheet{width:min(560px,100%);max-height:96vh;overflow:auto;background:var(--panel,#fff);color:var(--text,#111);border-radius:28px 28px 0 0;padding:14px 16px calc(16px + env(safe-area-inset-bottom));transform:translateY(40px);transition:transform .35s cubic-bezier(.22,1,.36,1);border:1px solid var(--line,#ddd);direction:rtl;font-family:inherit}
.ss-back.in .ss-sheet{transform:none}@media(min-width:700px){.ss-back{align-items:center}.ss-sheet{border-radius:28px}}
.ss-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.ss-head b{font-size:18px}.ss-x{border:0;background:var(--panel2,#eee);color:inherit;width:38px;height:38px;border-radius:50%;font-size:16px;cursor:pointer}
.ss-stage{position:relative;display:grid;place-items:center;padding:14px;border-radius:22px;background:radial-gradient(circle at 50% 0,color-mix(in srgb,var(--acc,#0f8a3f) 22%,transparent),transparent 70%),var(--panel2,#eee);perspective:900px;min-height:200px}
.ss-prev{max-width:100%;max-height:46vh;border-radius:16px;box-shadow:0 24px 50px rgba(0,0,0,.35);transition:transform .15s ease-out;transform-style:preserve-3d}
.ss-stage.busy::after{content:"";position:absolute;width:34px;height:34px;border-radius:50%;border:4px solid var(--line,#ccc);border-top-color:var(--acc,#0f8a3f);animation:ssSpin .8s linear infinite}@keyframes ssSpin{to{transform:rotate(360deg)}}
.ss-stage.busy .ss-prev{opacity:.4}
.ss-ctl{display:grid;gap:10px;margin:14px 0}.ss-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ss-row>span{font-size:13px;font-weight:800;color:var(--muted,#666);min-width:56px}
.ss-seg{display:inline-flex;border:1px solid var(--line,#ccc);border-radius:999px;overflow:hidden}.ss-seg button{border:0;background:transparent;color:inherit;font:inherit;font-weight:800;font-size:13px;padding:7px 16px;cursor:pointer}.ss-seg button.on{background:var(--acc,#0f8a3f);color:var(--on-acc,#fff)}
.ss-sw{display:flex;gap:10px}.ss-sw button{width:34px;height:34px;border-radius:50%;border:3px solid transparent;cursor:pointer;outline:1px solid var(--line,#ccc)}.ss-sw button.on{border-color:var(--text,#111)}
.ss-act{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ss-act .main{grid-column:1/-1;border:0;border-radius:16px;min-height:54px;font:inherit;font-size:17px;font-weight:900;background:linear-gradient(135deg,var(--acc,#0f8a3f),color-mix(in srgb,var(--acc,#0f8a3f) 60%,#0af));color:var(--on-acc,#fff);cursor:pointer;box-shadow:0 10px 26px color-mix(in srgb,var(--acc,#0f8a3f) 40%,transparent)}
.ss-act button:not(.main){border:1px solid var(--line,#ccc);background:var(--panel,#fff);color:inherit;border-radius:14px;min-height:46px;font:inherit;font-weight:800;cursor:pointer}.ss-note{margin:8px 0 0;font-size:12px;color:var(--muted,#666);text-align:center}`;
  const injectCss = () => { if (document.getElementById('ss-css')) return; const s = document.createElement('style'); s.id = 'ss-css'; s.textContent = css; document.head.appendChild(s); };
  const pref = () => { try { return JSON.parse(localStorage.getItem('yr-ss') || '{}'); } catch { return {}; } };
  const savePref = (o) => { try { localStorage.setItem('yr-ss', JSON.stringify(o)); } catch { /* اختياري */ } };

  function postText(d) {
    const u = d.url;
    if (d.type === 'match') return `⚽ ${d.home.name} × ${d.away.name}\n${d.score ? '🔢 النتيجة: ' + d.score.replace(/\s/g, '') : '🕒 ' + (d.when || '')}\n\n📺 تابع المباراة وكل التفاصيل على ${SITE} 👇\n${u}\n\n#يلا_رياضة`;
    if (d.type === 'player') return `🔄 ${d.title}\n\n📲 كل أخبار الانتقالات على ${SITE} 👇\n${u}\n\n#يلا_رياضة #الانتقالات`;
    if (d.type === 'product') return `🛍️ ${d.title}${d.price ? '\n💰 ' + d.price : ''}\n\n📲 اطلبه من ${SITE} 👇\n${u}`;
    return `🔥 ${d.title}\n\n📲 التفاصيل كاملة على ${SITE} 👇\n${u}\n\n#يلا_رياضة`;
  }

  window.yrShareStudio = async function (d) {
    d = { type: 'news', url: location.href.split('#')[0], ...d }; injectCss();
    document.getElementById('ss')?.remove();
    const p = pref(); const o = { fmt: p.fmt || 'post', layout: p.layout || 'full', theme: p.theme || 'night' };
    if (d.type === 'match') o.layout = 'full';
    const w = document.createElement('div'); w.id = 'ss'; w.className = 'ss-back'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'مشاركة كصورة');
    const seg = (k, items) => `<div class="ss-seg" data-k="${k}">${items.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div>`;
    w.innerHTML = `<div class="ss-sheet"><div class="ss-head"><b>${window.yrIco('image')} كارت المشاركة</b><button type="button" class="ss-x" aria-label="إغلاق">✕</button></div>
      <div class="ss-stage busy" id="ss-stage"><canvas class="ss-prev" id="ss-cv"></canvas></div>
      <div class="ss-ctl"><div class="ss-row"><span>المقاس</span>${seg('fmt', [['post', 'بوست'], ['story', 'ستوري']])}</div>
      ${d.type === 'match' ? '' : `<div class="ss-row"><span>الشكل</span>${seg('layout', [['full', 'صورة كاملة'], ['card', 'كارت']])}</div>`}
      <div class="ss-row"><span>اللون</span><div class="ss-sw" data-k="theme">${Object.entries(THEMES).map(([k, t]) => `<button type="button" data-v="${k}" aria-label="${t.n}" style="background:linear-gradient(135deg,${t.sw[0]} 50%,${t.sw[1]} 50%)"></button>`).join('')}</div></div></div>
      <div class="ss-act"><button type="button" class="main" id="ss-share">${window.yrIco('send')} شارك الصورة مع البوست</button><button type="button" id="ss-save">${window.yrIco('download')} حفظ الصورة</button><button type="button" id="ss-copy">${window.yrIco('copy')} نسخ البوست</button></div>
      <p class="ss-note">الصورة فيها QR يفتح الصفحة، والبوست فيه الرابط.</p></div>`;
    document.body.append(w); requestAnimationFrame(() => w.classList.add('in'));
    const cv = w.querySelector('#ss-cv'), stage = w.querySelector('#ss-stage'); let tok = 0, timer = 0;
    const mark = () => w.querySelectorAll('[data-k]').forEach((g) => g.querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('on', o[g.dataset.k] === b.dataset.v)));
    const render = async () => { const my = ++tok; stage.classList.add('busy'); try { await draw(cv, d, o); } catch (e) { console.error('share card:', e); } if (my === tok) stage.classList.remove('busy'); };
    const close = () => { w.classList.remove('in'); setTimeout(() => w.remove(), 250); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', esc);
    w.addEventListener('click', (e) => {
      if (e.target === w || e.target.closest('.ss-x')) return close();
      const b = e.target.closest('[data-v]'); if (!b) return; const k = b.parentElement.dataset.k; o[k] = b.dataset.v; savePref(o); mark(); clearTimeout(timer); timer = setTimeout(render, 60);
    });
    stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; cv.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`; });
    stage.addEventListener('pointerleave', () => { cv.style.transform = ''; });
    const blob = () => new Promise((res) => cv.toBlob((b) => res(b), 'image/jpeg', 0.92));
    const text = postText(d); const fname = 'yalla-riyada.jpg';
    w.querySelector('#ss-save').addEventListener('click', async () => { const b = await blob(); if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fname; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
    w.querySelector('#ss-copy').addEventListener('click', async (e) => { e = { target: e.currentTarget }; try { await navigator.clipboard.writeText(text); e.target.textContent = 'تم النسخ'; } catch { e.target.textContent = 'انسخه يدويًا'; } setTimeout(() => { e.target.innerHTML = window.yrIco('copy') + ' نسخ البوست'; }, 1600); });
    w.querySelector('#ss-share').addEventListener('click', async () => {
      const b = await blob(); const file = b ? new File([b], fname, { type: 'image/jpeg' }) : null;
      try { if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, title: d.title }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      if (b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fname; document.body.append(a); a.click(); a.remove(); }
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
    mark(); render();
  };
  window.yrShareCard = window.yrShareStudio;
})();

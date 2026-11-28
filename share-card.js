/* استوديو المشاركة: كارت صورة احترافي (خبر / مباراة / لاعب / منتج / فريق) بخيارات ستايل وألوان وQR + نص بوست جاهز */
(() => {
  'use strict';
  const SITE = 'يلا رياضة', SITE_EN = 'YALLA RIYADA';
  const FOOT = 210;
  const FMT = { post: [1080, 1350], story: [1080, 1920], x: [1600, 900] };
  const HANDLE = (typeof window !== 'undefined' && window.YR_HANDLE) || 'yalla_riyada'; // اسم حسابك على X/إنستجرام (اختياري): window.YR_HANDLE = 'اسم_الحساب'
  const THEMES = {
    navy: { n: 'كحلي', a: '#ffc21a', on: '#1a1200', b1: '#18284f', b2: '#0a1230', foot: '#0a1230', t: '#ffffff', mute: 'rgba(255,255,255,.7)', sw: ['#0a1230', '#ffc21a'] },
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
    const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'; s.onload = () => res(window.qrcode || null); s.onerror = () => res(null); document.head.appendChild(s);
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
        const qr = q(0, 'M'); qr.addData(url); qr.make(); const n = qr.getModuleCount(); const S = 132; const x0 = 70, y0 = y + 39; const pad = 10;
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

  /* ===== الستايل الاحترافي: صورة بتدوب في خلفية داكنة + عنوان عريض + فوتر سوشيال (مقاس بوست/ستوري/X) ===== */
  const P_X = new Path2D('M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z');
  const P_FB = new Path2D('M24 12.07C24 5.45 18.63.07 12 .07S0 5.45 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.52c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.39C19.61 23.03 24 18.06 24 12.07z');
  function socialRow(c, cx, cy, th, s) {
    const ic = 34 * s; const gap = 26 * s; const label = HANDLE ? '@' + HANDLE : SITE; c.font = font(800, 32 * s); c.direction = 'rtl'; const tw = c.measureText(label).width;
    const total = ic * 3 + gap * 3 + tw; let x = cx - total / 2; c.fillStyle = th.mute;
    const draw24 = (p, x0) => { c.save(); c.translate(x0, cy - ic / 2); c.scale(ic / 24, ic / 24); c.fill(p); c.restore(); };
    draw24(P_FB, x); x += ic + gap; draw24(P_X, x); x += ic + gap;
    c.save(); c.strokeStyle = th.mute; c.lineWidth = 2.4 * s; rr(c, x + 1.5 * s, cy - ic / 2 + 1.5 * s, ic - 3 * s, ic - 3 * s, 9 * s); c.stroke(); c.beginPath(); c.arc(x + ic / 2, cy, ic * 0.22, 0, 7); c.stroke(); c.beginPath(); c.arc(x + ic * 0.76, cy - ic * 0.25, 2.2 * s, 0, 7); c.fillStyle = th.mute; c.fill(); c.restore();
    x += ic + gap; c.fillStyle = th.t; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(label, x, cy + 2 * s); c.textBaseline = 'alphabetic';
  }
  async function brandTop(c, W, th, s, tag) {
    const logo = await getImg('icon-192.png'); const ls = 74 * s, x = 46 * s, y = 46 * s;
    c.save(); c.fillStyle = 'rgba(0,0,0,.38)'; rr(c, x - 12 * s, y - 12 * s, 330 * s, ls + 24 * s, (ls + 24 * s) / 2); c.fill(); c.restore();
    if (logo) { c.save(); rr(c, x, y, ls, ls, 20 * s); c.clip(); c.drawImage(logo, x, y, ls, ls); c.restore(); }
    c.textAlign = 'left'; c.direction = 'rtl'; c.fillStyle = '#fff'; c.font = font(900, 38 * s); c.fillText(SITE, x + ls + 16 * s, y + 38 * s);
    c.fillStyle = th.a; c.font = '800 20px "Segoe UI", Arial'; c.font = `800 ${21 * s}px "Segoe UI", Arial, sans-serif`; c.direction = 'ltr'; c.fillText(SITE_EN, x + ls + 16 * s, y + 66 * s); c.direction = 'rtl';
    if (tag) pill(c, tag, W - 46 * s, y + 6 * s, th, th.a, th.on, 28 * s);
  }
  async function qrBox(c, url, x, y, S, s) {
    const q = await getQR(); if (!q) return;
    try { const qr = q(0, 'M'); qr.addData(url); qr.make(); const n = qr.getModuleCount(); const pad = 9 * s; c.fillStyle = '#fff'; rr(c, x - pad, y - pad, S + pad * 2, S + pad * 2, 16 * s); c.fill(); c.fillStyle = '#06101f'; const m = S / n; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) c.fillRect(x + k * m, y + r * m, Math.ceil(m), Math.ceil(m)); } catch { /* بدون QR */ }
  }
  function sideTabs(c, W, y, h, th) { c.fillStyle = th.a; rr(c, -26, y, 44, h, 22); c.fill(); rr(c, W - 18, y, 44, h, 22); c.fill(); }
  function fade(c, W, H, th, from) {
    const g = c.createLinearGradient(0, H * from, 0, H); g.addColorStop(0, th.b2 + '00'); g.addColorStop(0.45, th.b2 + 'd9'); g.addColorStop(0.7, th.b2); g.addColorStop(1, th.b2); c.fillStyle = g; c.fillRect(0, H * from, W, H * (1 - from));
  }
  async function footerPro(c, W, H, th, d, s, withQr) {
    const wide = W > H; c.direction = 'rtl'; c.textAlign = 'right';
    c.fillStyle = th.a; c.beginPath(); c.arc(W - 60 * s - 4 * s, H - 148 * s, 8 * s, 0, 7); c.fill();
    c.font = font(800, 30 * s); c.fillStyle = th.mute; c.fillText(SITE, W - 60 * s - 26 * s, H - 137 * s);
    socialRow(c, W / 2, H - 62 * s, th, s);
    if (withQr && d.url && !wide) await qrBox(c, d.url, 62 * s, H - 262 * s, 124 * s, s);
  }
  async function drawPro(c, W, H, d, o, th) {
    const wide = W > H; const s = wide ? H / 1350 * 1.0 : W / 1080;
    c.fillStyle = th.b2; c.fillRect(0, 0, W, H);
    if (d.type === 'match') {
      // خلفية: لمعة + شعارات الفريقين ضخمة وشفافة + خطوط ملعب خفيفة
      const gl = c.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, Math.max(W, H) * 0.75); gl.addColorStop(0, th.b1); gl.addColorStop(1, th.b2); c.fillStyle = gl; c.fillRect(0, 0, W, H);
      const [hi, ai] = await Promise.all([getImg(d.home && d.home.logo), getImg(d.away && d.away.logo)]);
      c.save(); c.globalAlpha = 0.10; const big = Math.min(W, H) * 0.95; if (hi) contain(c, hi, W * 0.62, H * 0.04, big * 0.75, big * 0.75); if (ai) contain(c, ai, -W * 0.08, H * 0.04, big * 0.75, big * 0.75); c.restore();
      c.save(); c.strokeStyle = '#fff'; c.globalAlpha = 0.06; c.lineWidth = 5 * s; c.beginPath(); c.arc(W / 2, H * 0.46, 250 * s, 0, 7); c.stroke(); c.beginPath(); c.moveTo(0, H * 0.46); c.lineTo(W, H * 0.46); c.stroke(); c.restore();
      await brandTop(c, W, th, s, d.league);
      const cy = wide ? H * 0.5 : H * (o.fmt === 'story' ? 0.46 : 0.5);
      const st = d.live ? 'مباشر الآن' + (d.minute ? ' · ' + nAr(d.minute) + "'" : '') : d.finished ? 'نهاية المباراة' : 'موعد المباراة';
      c.textAlign = 'center'; c.direction = 'rtl'; c.font = font(900, 76 * s); c.fillStyle = d.live ? '#ff4d5e' : '#fff'; c.fillText(st, W / 2, cy - 150 * s);
      const bh = 230 * s, bw = 190 * s, tw = 250 * s, gap = 10 * s; const parts = String(d.score || '').split('-').map((x) => x.trim());
      const hasScore = parts.length === 2 && parts[0] !== '' && parts[1] !== '';
      const boxes = hasScore ? [parts[0], parts[1]] : [d.time || 'VS'];
      const totalW = tw * 2 + (hasScore ? bw * 2 + gap : bw * 2.1) + gap * 2; let x = (W - totalW) / 2; const y = cy - bh / 2;
      const tab = (img, name, xx, left) => { c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 30 * s; c.fillStyle = '#fff'; rr(c, xx, y, tw, bh, 34 * s); c.fill(); c.restore(); if (img) contain(c, img, xx + 36 * s, y + 30 * s, tw - 72 * s, bh - 60 * s); else { c.fillStyle = th.b1; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = font(900, 110 * s); c.fillText(String(name || '?').trim().charAt(0), xx + tw / 2, y + bh / 2 + 6 * s); c.textBaseline = 'alphabetic'; } };
      tab(ai, d.away && d.away.name, x, true); x += tw + gap;
      c.direction = 'ltr';
      const box = (txt, w, xx, fs) => { c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 30 * s; c.fillStyle = '#fff'; rr(c, xx, y, w, bh, 34 * s); c.fill(); c.restore(); c.fillStyle = '#0b1330'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${fs * s}px "Segoe UI", Cairo, Arial, sans-serif`; c.fillText(txt, xx + w / 2, y + bh / 2 + 8 * s); c.textBaseline = 'alphabetic'; };
      if (hasScore) { box(parts[0], bw, x, 190); x += bw + gap; box(parts[1], bw, x, 190); x += bw + gap; } else { box(boxes[0], bw * 2.1, x, 84); x += bw * 2.1 + gap; }
      c.direction = 'rtl'; tab(hi, d.home && d.home.name, x, false);
      // أسماء الفرق
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = font(900, 44 * s);
      const awayX = (W - totalW) / 2 + tw / 2, homeX = (W + totalW) / 2 - tw / 2;
      wrap(c, d.away && d.away.name, tw + 70 * s, 2).forEach((l, i) => c.fillText(l, awayX, y + bh + 70 * s + i * 54 * s));
      wrap(c, d.home && d.home.name, tw + 70 * s, 2).forEach((l, i) => c.fillText(l, homeX, y + bh + 70 * s + i * 54 * s));
      c.font = font(700, 34 * s); c.fillStyle = th.mute; const info = [d.league, !d.finished && !d.live ? d.when : (d.when || '')].filter(Boolean).join(' • ');
      if (info) c.fillText(info, W / 2, y + bh + 70 * s + 54 * s * 2 + 56 * s);
      sideTabs(c, W, H * 0.66, 210 * s, th);
      await footerPro(c, W, H, th, d, s, !wide); return;
    }
    // خبر / لاعب / منتج: صورة تملا الشاشة وتدوب في الأسفل
    const img = await getImg(d.image);
    if (img) { const ph = wide ? H : H * 0.72; cover(c, img, 0, 0, W, ph); }
    else { const gl = c.createRadialGradient(W * 0.5, H * 0.3, 20, W * 0.5, H * 0.3, W * 0.9); gl.addColorStop(0, th.b1); gl.addColorStop(1, th.b2); c.fillStyle = gl; c.fillRect(0, 0, W, H); c.fillStyle = th.a; c.globalAlpha = 0.14; c.font = font(900, 520 * s); c.textAlign = 'center'; c.fillText(d.emoji || '⚽', W / 2, H * 0.38); c.globalAlpha = 1; }
    fade(c, W, H, th, wide ? 0.18 : 0.36);
    if (wide) { const g = c.createLinearGradient(W, 0, W * 0.2, 0); g.addColorStop(0, th.b2 + 'f2'); g.addColorStop(1, th.b2 + '00'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    const gt = c.createLinearGradient(0, 0, 0, 240 * s); gt.addColorStop(0, 'rgba(0,0,0,.5)'); gt.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gt; c.fillRect(0, 0, W, 240 * s);
    await brandTop(c, W, th, s, d.tag);
    const R = W - 62 * s; const maxW = wide ? Math.min(W * 0.62, 1000) : W - 124 * s;
    const bottomLimit = H - (wide ? 190 : 300) * s;
    // العنوان
    let fs = (wide ? 70 : 66) * s, lines; c.direction = 'rtl'; c.textAlign = 'right';
    for (; fs >= 40 * s; fs -= 3 * s) { c.font = font(900, fs); lines = wrap(c, d.title, maxW, 8); if (lines.length <= (wide ? 4 : 5)) break; }
    c.font = font(900, fs); lines = wrap(c, d.title, maxW, wide ? 4 : 5); const lh = fs * 1.5; const textH = lines.length * lh;
    const ty = bottomLimit - textH + fs * 0.9; c.fillStyle = th.t; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 10 * s; lines.forEach((l, i) => c.fillText(l, R, ty + i * lh)); c.shadowBlur = 0;
    // شارة المصدر/التصنيف (مربع أصفر بعلامة اقتباس) + السطر الفرعي
    const by = ty - fs * 0.9 - 72 * s; const bs = 92 * s;
    c.fillStyle = th.a; rr(c, R - bs, by - bs / 2, bs, bs, 26 * s); c.fill(); c.fillStyle = th.on; c.font = font(900, 120 * s); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('”', R - bs / 2, by + 34 * s); c.textBaseline = 'alphabetic';
    c.textAlign = 'right'; c.fillStyle = th.a; c.font = font(900, 50 * s); const head = d.sub || d.tag || SITE; c.fillText(head, R - bs - 20 * s, by + 4 * s);
    if (d.sub && d.tag) { c.font = font(700, 28 * s); c.fillStyle = th.mute; c.fillText(d.tag, R - bs - 20 * s, by + 42 * s); }
    if (d.price) { c.font = font(900, 54 * s); const pw = c.measureText(d.price).width + 64 * s; c.fillStyle = th.a; rr(c, 60 * s, by - 46 * s, pw, 92 * s, 46 * s); c.fill(); c.fillStyle = th.on; c.textAlign = 'center'; c.fillText(d.price, 60 * s + pw / 2, by + 18 * s); c.textAlign = 'right'; }
    if (d.move) {
      const [f, t] = await Promise.all([getImg(d.move.from && d.move.from.logo), getImg(d.move.to && d.move.to.logo)]); const r2 = 46 * s, pw = 400 * s, px = 60 * s, cy2 = by;
      c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, px, cy2 - r2 - 18 * s, pw, r2 * 2 + 36 * s, r2 + 18 * s); c.fill();
      crest(c, f, d.move.from && d.move.from.name, px + pw - r2 - 20 * s, cy2, r2, th); crest(c, t, d.move.to && d.move.to.name, px + r2 + 20 * s, cy2, r2, th);
      c.fillStyle = th.a; c.font = font(900, 56 * s); c.textAlign = 'center'; c.fillText('⟵', px + pw / 2, cy2 + 20 * s); c.textAlign = 'right';
    }
    sideTabs(c, W, by - 70 * s, 200 * s, th);
    await footerPro(c, W, H, th, d, s, !wide);
  }


  /* ===== كروت البيانات: ترتيب الدوري · الهدافون · التشكيلة (ستايل احترافي، بوست/ستوري) ===== */
  const DATA = ['standings', 'scorers', 'lineup'];
  const ZCOL = { champ: '#22c55e', uel: '#f59e0b', uecl: '#38bdf8', rel: '#ef4444', promo: '#a78bfa' };
  async function dataHead(c, W, H, d, th, s) {
    await brandTop(c, W, th, s, d.tag);
    c.direction = 'rtl'; c.textAlign = 'right'; const R = W - 60 * s;
    const lg = await getImg(d.logo);
    let tx = R; if (lg) { c.save(); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(R - 56 * s, 218 * s, 56 * s, 0, 7); c.fill(); c.restore(); contain(c, lg, R - 56 * s - 38 * s, 218 * s - 38 * s, 76 * s, 76 * s); tx = R - 130 * s; }
    let fs = 64 * s; c.font = font(900, fs); const maxW = tx - 60 * s; while (c.measureText(d.title).width > maxW && fs > 36 * s) { fs -= 2 * s; c.font = font(900, fs); }
    c.fillStyle = th.t; c.fillText(d.title, tx, 214 * s);
    c.font = font(800, 34 * s); c.fillStyle = th.a; c.fillText(d.sub || '', tx, 264 * s);
    return 330 * s;
  }
  function panelCol(th) { return th.t === '#ffffff' || th.t === '#fff8e6' ? 'rgba(255,255,255,.075)' : 'rgba(11,31,20,.07)'; }
  async function drawData(c, W, H, d, o, th) {
    const s = W / 1080; const gl = c.createRadialGradient(W / 2, H * 0.3, 40, W / 2, H * 0.3, Math.max(W, H) * 0.8); gl.addColorStop(0, th.b1); gl.addColorStop(1, th.b2); c.fillStyle = gl; c.fillRect(0, 0, W, H);
    c.save(); c.strokeStyle = th.t; c.globalAlpha = 0.05; c.lineWidth = 5 * s; c.beginPath(); c.arc(W / 2, H * 0.5, 260 * s, 0, 7); c.stroke(); c.beginPath(); c.moveTo(0, H * 0.5); c.lineTo(W, H * 0.5); c.stroke(); c.restore();
    const y0 = await dataHead(c, W, H, d, th, s); const bottom = H - 310 * s; const L = 60 * s, R = W - 60 * s; const pc = panelCol(th);
    c.direction = 'rtl';
    if (d.type === 'standings' || d.type === 'scorers') {
      const rows = (d.rows || []).slice(0, o.fmt === 'story' ? 14 : 10); const hh = 54 * s; const rh = Math.min(96 * s, (bottom - y0 - hh) / Math.max(rows.length, 1));
      const imgs = await Promise.all(rows.map((r) => getImg(d.type === 'scorers' ? r.photo : r.logo)));
      const timgs = d.type === 'scorers' ? await Promise.all(rows.map((r) => getImg(r.teamLogo))) : [];
      c.font = font(800, 24 * s); c.fillStyle = th.mute; c.textAlign = 'center';
      if (d.type === 'standings') { c.fillText('نقاط', L + 70 * s, y0 + 34 * s); c.fillText('فرق', L + 195 * s, y0 + 34 * s); c.fillText('لعب', L + 310 * s, y0 + 34 * s); c.textAlign = 'right'; c.fillText('الفريق', R - 112 * s, y0 + 34 * s); c.textAlign = 'center'; c.fillText('#', R - 38 * s, y0 + 34 * s); }
      else { c.fillText('أهداف', L + 70 * s, y0 + 34 * s); c.fillText('تمريرات', L + 200 * s, y0 + 34 * s); c.textAlign = 'right'; c.fillText('اللاعب', R - 130 * s, y0 + 34 * s); c.textAlign = 'center'; c.fillText('#', R - 38 * s, y0 + 34 * s); }
      rows.forEach((r, i) => {
        const y = y0 + hh + i * rh; const h = rh - 8 * s; c.fillStyle = pc; rr(c, L, y, R - L, h, 22 * s); c.fill();
        if (r.zone && ZCOL[r.zone]) { c.fillStyle = ZCOL[r.zone]; rr(c, R - 9 * s, y + 10 * s, 9 * s, h - 20 * s, 5 * s); c.fill(); }
        const cy = y + h / 2; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = i < 3 ? th.a : th.mute; c.font = font(900, Math.min(40 * s, h * 0.5)); c.fillText(nAr(r.rank != null ? r.rank : i + 1), R - 38 * s, cy + 2 * s);
        const ir = Math.min(h * 0.36, 30 * s); const ix = R - 100 * s;
        if (d.type === 'scorers') { c.save(); c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(ix - 8 * s, cy, ir + 4 * s, 0, 7); c.fill(); c.clip(); if (imgs[i]) cover(c, imgs[i], ix - 8 * s - ir - 4 * s, cy - ir - 4 * s, (ir + 4 * s) * 2, (ir + 4 * s) * 2); c.restore(); }
        else { c.save(); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(ix, cy, ir, 0, 7); c.fill(); c.restore(); if (imgs[i]) contain(c, imgs[i], ix - ir * 0.72, cy - ir * 0.72, ir * 1.44, ir * 1.44); else { c.fillStyle = '#0b1f14'; c.font = font(900, ir); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(r.name || '').trim().replace(/^ال/, '').charAt(0), ix, cy + 2 * s); c.textBaseline = 'alphabetic'; } }
        const nx = R - (d.type === 'scorers' ? 160 * s : 148 * s); c.textAlign = 'right'; c.fillStyle = th.t; let nf = Math.min(36 * s, h * 0.44); c.font = font(900, nf); const nmax = nx - (L + (d.type === 'scorers' ? 250 : 380) * s);
        while (c.measureText(r.name).width > nmax && nf > 20 * s) { nf -= 2 * s; c.font = font(900, nf); }
        if (d.type === 'scorers') { c.fillText(r.name, nx, cy - h * 0.12); c.font = font(700, Math.min(24 * s, h * 0.3)); c.fillStyle = th.mute; c.fillText(r.team || '', nx - (timgs[i] ? 34 * s : 0), cy + h * 0.24); if (timgs[i]) contain(c, timgs[i], nx - 28 * s, cy + h * 0.24 - 14 * s, 28 * s, 28 * s); }
        else c.fillText(r.name, nx, cy + 2 * s);
        c.textAlign = 'center';
        if (d.type === 'standings') { c.fillStyle = th.a; c.font = font(900, Math.min(44 * s, h * 0.56)); c.fillText(nAr(r.points), L + 70 * s, cy + 2 * s); c.fillStyle = th.t; c.font = font(800, Math.min(32 * s, h * 0.42)); c.direction = 'ltr'; c.fillText(String(r.gd > 0 ? '+' + r.gd : r.gd).replace(/\d/g, (x) => x), L + 195 * s, cy + 2 * s); c.direction = 'rtl'; c.fillText(nAr(r.played), L + 310 * s, cy + 2 * s); }
        else { c.fillStyle = th.a; c.font = font(900, Math.min(50 * s, h * 0.6)); c.fillText(nAr(r.goals), L + 70 * s, cy + 2 * s); c.fillStyle = th.mute; c.font = font(800, Math.min(32 * s, h * 0.42)); c.fillText(nAr(r.assists || 0), L + 200 * s, cy + 2 * s); }
        c.textBaseline = 'alphabetic';
      });
      if (d.type === 'standings' && d.legend && d.legend.length) { c.font = font(700, 24 * s); c.textAlign = 'right'; let lx = R; d.legend.slice(0, 4).forEach((z) => { c.fillStyle = ZCOL[z.k] || th.a; c.beginPath(); c.arc(lx - 8 * s, bottom + 28 * s, 8 * s, 0, 7); c.fill(); c.fillStyle = th.mute; c.fillText(z.l, lx - 26 * s, bottom + 37 * s); lx -= c.measureText(z.l).width + 70 * s; }); }
    } else if (d.type === 'lineup') {
      const px = L, pw = R - L, py = y0 + 12 * s, ph = bottom - py - 36 * s;
      const g = c.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, '#1a7a3a'); g.addColorStop(1, '#0f5a2a'); c.fillStyle = g; rr(c, px, py, pw, ph, 30 * s); c.fill();
      c.save(); rr(c, px, py, pw, ph, 30 * s); c.clip(); for (let k = 0; k < 8; k++) { if (k % 2 === 0) { c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(px, py + (ph / 8) * k, pw, ph / 8); } } c.restore();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3.5 * s; rr(c, px + 14 * s, py + 14 * s, pw - 28 * s, ph - 28 * s, 18 * s); c.stroke(); c.beginPath(); c.moveTo(px + 14 * s, py + ph / 2); c.lineTo(px + pw - 14 * s, py + ph / 2); c.stroke(); c.beginPath(); c.arc(px + pw / 2, py + ph / 2, 80 * s, 0, 7); c.stroke();
      c.strokeRect(px + pw * 0.28, py + 14 * s, pw * 0.44, ph * 0.13); c.strokeRect(px + pw * 0.28, py + ph - 14 * s - ph * 0.13, pw * 0.44, ph * 0.13);
      const rowsM = new Map(); (d.players || []).forEach((p) => { const [r, k] = String(p.grid || '').split(':').map(Number); if (!Number.isFinite(r)) return; if (!rowsM.has(r)) rowsM.set(r, []); rowsM.get(r).push({ ...p, k }); });
      const rmax = Math.max(...rowsM.keys(), 1); const cr = 46 * s;
      const all = []; rowsM.forEach((arr, r) => arr.sort((x, y) => x.k - y.k).forEach((p, i) => all.push({ p, r, i, n: arr.length })));
      const phs = await Promise.all(all.map((q) => getImg(q.p.photo)));
      all.forEach((q, idx) => {
        const { p, r, i, n } = q; const x = px + pw * (n === 1 ? 0.5 : 0.15 + (i / (n - 1)) * 0.7); const t = rmax === 1 ? 0 : (r - 1) / (rmax - 1); const y = py + ph * (0.86 - t * 0.74);
        c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 18 * s; c.fillStyle = r === 1 ? '#f5f5f5' : th.a; c.beginPath(); c.arc(x, y, cr + 4 * s, 0, 7); c.fill(); c.restore();
        c.save(); c.beginPath(); c.arc(x, y, cr, 0, 7); c.clip(); c.fillStyle = '#1b3a2a'; c.fillRect(x - cr, y - cr, cr * 2, cr * 2);
        if (phs[idx]) cover(c, phs[idx], x - cr, y - cr, cr * 2, cr * 2); else { c.fillStyle = '#fff'; c.font = font(900, 40 * s); c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillText(String(p.number ?? ''), x, y + 2 * s); c.direction = 'rtl'; c.textBaseline = 'alphabetic'; }
        c.restore();
        const bx = x + cr * 0.78, by = y - cr * 0.78; c.fillStyle = r === 1 ? '#0b1f14' : th.a; c.beginPath(); c.arc(bx, by, 19 * s, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2.5 * s; c.stroke();
        c.fillStyle = r === 1 ? '#fff' : th.on; c.font = font(900, 22 * s); c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillText(String(p.number ?? ''), bx, by + 1 * s); c.direction = 'rtl'; c.textBaseline = 'alphabetic';
        c.font = font(800, 24 * s); const nm = String(p.name || ''); const w = Math.min(c.measureText(nm).width + 24 * s, 200 * s); c.fillStyle = 'rgba(4,16,9,.82)'; rr(c, x - w / 2, y + cr + 10 * s, w, 36 * s, 18 * s); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(wrap(c, nm, w - 14 * s, 1)[0] || nm, x, y + cr + 36 * s);
        const ps = p.pos || (r === 1 ? 'حارس مرمى' : r === rmax ? 'مهاجم' : r === 2 ? 'مدافع' : 'وسط'); c.font = font(700, 19 * s); c.fillStyle = 'rgba(255,255,255,.82)'; c.fillText(ps, x, y + cr + 66 * s);
      });
    }
    await footerPro(c, W, H, th, d, s, true);
  }

  async function draw(cv, d, o) {
    const [W, H] = FMT[o.fmt] || FMT.post; cv.width = W; cv.height = H; const th = THEMES[o.theme] || THEMES.night;
    const c = cv.getContext('2d'); c.direction = 'rtl'; c.textAlign = 'right';
    try { await document.fonts.load('900 60px Cairo'); await document.fonts.load('700 30px Cairo'); } catch { /* خط النظام */ }
    if (DATA.includes(d.type)) { await drawData(c, W, H, d, o, th); return; }
    if (o.style !== 'classic') { await drawPro(c, W, H, d, o, th); return; }
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
        const tb = title(c, W, by, th, d.title, o.fmt === 'story' ? 84 : 74); c.shadowBlur = 0; moveY = tb.top - 100;
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
      if (d.move) { // انتقال لاعب: لوجو القديم ← الجديد (يمين الكارت، فوق العنوان)
        const [f, t] = await Promise.all([getImg(d.move.from && d.move.from.logo), getImg(d.move.to && d.move.to.logo)]);
        const R = 52, pw = 440, px = W - 60 - pw, cy2 = moveY;
        c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, px, cy2 - R - 22, pw, R * 2 + 44, R + 22); c.fill();
        crest(c, f, d.move.from && d.move.from.name, px + pw - R - 22, cy2, R, th); crest(c, t, d.move.to && d.move.to.name, px + R + 22, cy2, R, th);
        c.fillStyle = th.a; c.font = font(900, 64); c.textAlign = 'center'; c.fillText('⟵', px + pw / 2, cy2 + 22); c.textAlign = 'right';
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
    if (d.type === 'standings') return `🏆 ${d.title} — جدول الترتيب\n${(d.rows || []).slice(0, 5).map((r) => `${r.rank}. ${r.name} — ${r.points} نقطة`).join('\n')}\n\n📊 الترتيب كامل على ${SITE} 👇\n${u}\n\n#يلا_رياضة`;
    if (d.type === 'scorers') return `⚽ هدافو ${d.title}\n${(d.rows || []).slice(0, 5).map((r) => `${r.rank}. ${r.name} — ${r.goals} هدف`).join('\n')}\n\n📲 كل التفاصيل على ${SITE} 👇\n${u}\n\n#يلا_رياضة`;
    if (d.type === 'lineup') return `📋 تشكيلة ${d.title}${d.formation ? ' (' + d.formation + ')' : ''}\n${d.sub || ''}\n\n📺 تابع المباراة على ${SITE} 👇\n${u}\n\n#يلا_رياضة`;
    if (d.type === 'player') return `🔄 ${d.title}\n\n📲 كل أخبار الانتقالات على ${SITE} 👇\n${u}\n\n#يلا_رياضة #الانتقالات`;
    if (d.type === 'product') return `🛍️ ${d.title}${d.price ? '\n💰 ' + d.price : ''}\n\n📲 اطلبه من ${SITE} 👇\n${u}`;
    return `🔥 ${d.title}\n\n📲 التفاصيل كاملة على ${SITE} 👇\n${u}\n\n#يلا_رياضة`;
  }

  window.yrShareStudio = async function (d) {
    d = { type: 'news', url: location.href.split('#')[0], ...d }; injectCss();
    document.getElementById('ss')?.remove();
    const p = pref(); const o = { fmt: p.fmt || 'post', layout: p.layout || 'full', theme: THEMES[p.theme] ? p.theme : 'navy', style: p.style || 'pro' };
    if (d.type === 'match') o.layout = 'full';
    const isData = DATA.includes(d.type); if (isData) { o.style = 'pro'; o.layout = 'full'; if (o.fmt === 'x') o.fmt = 'post'; }
    const w = document.createElement('div'); w.id = 'ss'; w.className = 'ss-back'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'مشاركة كصورة');
    const seg = (k, items) => `<div class="ss-seg" data-k="${k}">${items.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}</div>`;
    w.innerHTML = `<div class="ss-sheet"><div class="ss-head"><b>${window.yrIco('image')} كارت المشاركة</b><button type="button" class="ss-x" aria-label="إغلاق">✕</button></div>
      <div class="ss-stage busy" id="ss-stage"><canvas class="ss-prev" id="ss-cv"></canvas></div>
      <div class="ss-ctl"><div class="ss-row"><span>المقاس</span>${seg('fmt', isData ? [['post', 'بوست'], ['story', 'ستوري']] : [['post', 'بوست'], ['x', 'X / تويتر'], ['story', 'ستوري']])}</div>
      ${isData ? '' : `<div class="ss-row"><span>الستايل</span>${seg('style', [['pro', 'احترافي'], ['classic', 'كلاسيك']])}</div>`}
      ${d.type === 'match' || isData ? '' : `<div class="ss-row" id="ss-lay"><span>الشكل</span>${seg('layout', [['full', 'صورة كاملة'], ['card', 'كارت']])}</div>`}
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
    const lay = () => { const r = w.querySelector('#ss-lay'); if (r) r.hidden = o.style !== 'classic'; }; w.addEventListener('click', () => setTimeout(lay, 0)); lay();
    mark(); render();
  };
  window.yrShareCard = window.yrShareStudio;
})();

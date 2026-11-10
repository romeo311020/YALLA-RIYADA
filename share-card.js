/* مشاركة خبر كصورة جاهزة (صورة الخبر + العنوان + لوجو واسم ورابط الموقع) مع نص بوست ورابط الخبر */
(() => {
  'use strict';
  const W = 1080, H = 1350, FOOT = 190;
  const SITE = 'يلا رياضة', SITE_EN = 'YALLA RIYADA';
  const loadImg = (src, cors) => new Promise((res) => { const i = new Image(); if (cors) i.crossOrigin = 'anonymous'; i.referrerPolicy = 'no-referrer'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  async function getPhoto(src) {
    if (!src) return null;
    let i = await loadImg(src, true); if (i) return i;
    i = await loadImg('https://images.weserv.nl/?url=' + encodeURIComponent(src.replace(/^https?:\/\//, '')) + '&w=1200&output=jpg', true); // بروكسي بيسمح بالـ CORS
    return i;
  }
  function wrap(ctx, text, max, maxLines) {
    const words = String(text).split(/\s+/); const lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
    return lines;
  }
  function cover(ctx, img, x, y, w, h) {
    const r = Math.max(w / img.width, h / img.height); const iw = img.width * r, ih = img.height * r;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  async function build({ title, image }) {
    try { await document.fonts.load('900 60px Cairo'); await document.fonts.load('700 30px Cairo'); } catch { /* خط النظام */ }
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); c.direction = 'rtl'; c.textAlign = 'right';
    const font = (w, s) => `${w} ${s}px Cairo, Tahoma, "Segoe UI", Tahoma, sans-serif`;
    const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0b3d1f'); bg.addColorStop(1, '#04140b'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const ph = await getPhoto(image); const PH = H - FOOT;
    if (ph) cover(c, ph, 0, 0, W, PH);
    else { c.fillStyle = 'rgba(198,255,61,.08)'; c.beginPath(); c.arc(W * 0.8, 260, 340, 0, 7); c.fill(); c.font = font(900, 260); c.fillStyle = 'rgba(255,255,255,.12)'; c.textAlign = 'center'; c.fillText('⚽', W / 2, 520); c.textAlign = 'right'; }
    const g = c.createLinearGradient(0, PH * 0.32, 0, PH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, 'rgba(0,0,0,.72)'); g.addColorStop(1, 'rgba(0,0,0,.94)'); c.fillStyle = g; c.fillRect(0, PH * 0.32, W, PH * 0.68);
    // وسم "حصري"
    c.font = font(900, 30); const tag = '★ حصري على ' + SITE; const tw = c.measureText(tag).width + 48;
    c.fillStyle = '#c6ff3d'; c.beginPath(); c.roundRect(W - 60 - tw, 60, tw, 58, 29); c.fill(); c.fillStyle = '#04140b'; c.fillText(tag, W - 60 - 24, 100);
    // العنوان
    let fs = 70, lines; const max = W - 120;
    for (; fs >= 46; fs -= 4) { c.font = font(900, fs); lines = wrap(c, title, max, 4); if (lines.length <= 3) break; }
    c.font = font(900, fs); lines = wrap(c, title, max, 4); const lh = fs * 1.42; let y = PH - 56 - (lines.length - 1) * lh;
    c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 14;
    lines.forEach((l, i) => c.fillText(l, W - 60, y + i * lh)); c.shadowBlur = 0;
    // الفوتر
    c.fillStyle = '#04140b'; c.fillRect(0, PH, W, FOOT); c.fillStyle = '#c6ff3d'; c.fillRect(0, PH, W, 6);
    const logo = await loadImg('icon-192.png', false); const ls = 112;
    if (logo) { c.save(); c.beginPath(); c.roundRect(W - 60 - ls, PH + 38, ls, ls, 26); c.clip(); c.drawImage(logo, W - 60 - ls, PH + 38, ls, ls); c.restore(); }
    const tx = W - 60 - ls - 28;
    c.fillStyle = '#fff'; c.font = font(900, 52); c.fillText(SITE, tx, PH + 90);
    c.fillStyle = '#c6ff3d'; c.font = font(700, 26); c.fillText(SITE_EN, tx, PH + 128);
    c.direction = 'ltr'; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '700 30px "Segoe UI", Arial, sans-serif';
    c.fillText(location.host, 60, PH + 112);
    c.font = font(700, 24); c.fillStyle = '#c6ff3d'; c.direction = 'rtl'; c.fillText('اقرأ الخبر كامل ↙', 60, PH + 70);
    return new Promise((res) => { try { cv.toBlob((b) => res(b), 'image/jpeg', 0.92); } catch { res(null); } });
  }
  window.yrShareCard = async function ({ title, image, url }) {
    url = url || location.href;
    const text = `🔥 ${title}\n\n📲 التفاصيل كاملة على ${SITE} 👇\n${url}\n\n#يلا_رياضة`;
    const blob = await build({ title, image });
    const file = blob ? new File([blob], 'yalla-riyada.jpg', { type: 'image/jpeg' }) : null;
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, title }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    // لو الجهاز مش بيشارك ملفات: نحمّل الصورة ونفتح المشاركة العادية بالنص
    if (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'yalla-riyada.jpg'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
    window.yrShare({ title, text: `🔥 ${title}\n\n📲 التفاصيل كاملة على ${SITE} 👇`, url });
  };
})();

/* "زهرة المشاركة": بتتفتح حوالين الزر اللي اتضغط — أيقونات حقيقية بألوان التطبيقات بحركة نابضة */
(() => {
  'use strict';
  const SITE = 'يلا رياضة';
  const css = `.sb-back{position:fixed;inset:0;z-index:9998;background:radial-gradient(circle at var(--ox) var(--oy),rgba(0,0,0,.35),rgba(0,0,0,.72));backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);opacity:0;transition:opacity .25s}
.sb-back.in{opacity:1}
.sb-o{position:fixed;z-index:9999;width:0;height:0;left:var(--ox);top:var(--oy)}
.sb-core{position:absolute;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;border:0;display:grid;place-items:center;font-size:24px;color:var(--on-acc,#fff);background:linear-gradient(135deg,var(--acc,#0f8a3f),color-mix(in srgb,var(--acc,#0f8a3f) 55%,#0af));box-shadow:0 0 0 0 color-mix(in srgb,var(--acc,#0f8a3f) 60%,transparent);animation:sbPulse 1.8s infinite;cursor:pointer;transform:scale(.4) rotate(-90deg);opacity:0;transition:transform .45s cubic-bezier(.34,1.56,.64,1),opacity .2s}
.sb-in .sb-core{transform:none;opacity:1}@keyframes sbPulse{70%{box-shadow:0 0 0 18px transparent}100%{box-shadow:0 0 0 0 transparent}}
.sb-b{position:absolute;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;border:0;display:grid;place-items:center;color:#fff;font-size:25px;cursor:pointer;background:var(--c);box-shadow:0 10px 24px rgba(0,0,0,.4),inset 0 0 0 2px rgba(255,255,255,.18);transform:translate(0,0) scale(.2);opacity:0;transition:transform .5s cubic-bezier(.34,1.56,.64,1) var(--d),opacity .2s var(--d)}
.sb-in .sb-b{transform:translate(var(--tx),var(--ty)) scale(1);opacity:1}.sb-b:active{filter:brightness(.85)}
.sb-b span{position:absolute;top:100%;margin-top:6px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;white-space:nowrap;color:#fff;text-shadow:0 2px 8px #000;font-family:inherit}
.sb-t{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:10000;background:#111;color:#fff;padding:10px 20px;border-radius:999px;font-weight:800;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.sb-b svg,.sb-core svg{width:1em;height:1em}`;
  const text = (d) => {
    const u = d.url || location.href.split('#')[0];
    if (d.type === 'match') return `⚽ ${d.title}${d.score ? '\n' + d.score.replace(/\s/g, '') : ''}\n\n${SITE} — تابع المباراة 👇\n${u}`;
    if (d.type === 'product') return `${d.title}${d.price ? ' — ' + d.price : ''}\n\n${SITE} 👇\n${u}`;
    return `${d.title}\n\n${SITE} — التفاصيل كاملة 👇\n${u}\n\n#يلا_رياضة`;
  };
  function toast(m) { const t = document.createElement('div'); t.className = 'sb-t'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 1800); }
  window.yrBloom = function (d, el) {
    document.getElementById('sb-back')?.remove(); document.getElementById('sb-o')?.remove();
    if (!document.getElementById('sb-css')) { const s = document.createElement('style'); s.id = 'sb-css'; s.textContent = css; document.head.appendChild(s); }
    d = { url: location.href.split('#')[0], ...d }; const url = d.url, tx = text(d), q = encodeURIComponent;
    const vw = window.innerWidth, vh = window.innerHeight; let ox = vw / 2, oy = vh - 190;
    if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); if (r.width) { ox = r.left + r.width / 2; oy = r.top + r.height / 2; } }
    oy = Math.min(Math.max(oy, 140), vh - 150); ox = Math.min(Math.max(ox, 40), vw - 40);
    const items = [
      ['whatsapp', '#25D366', 'واتساب', () => window.open('https://wa.me/?text=' + q(tx), '_blank', 'noopener')],
      ['telegram', '#27A7E7', 'تيليجرام', () => window.open(`https://t.me/share/url?url=${q(url)}&text=${q(d.title)}`, '_blank', 'noopener')],
      ['facebook', '#1877F2', 'فيسبوك', () => window.open('https://www.facebook.com/sharer/sharer.php?u=' + q(url), '_blank', 'noopener')],
      ['xtw', '#111', 'إكس', () => window.open(`https://twitter.com/intent/tweet?text=${q(d.title)}&url=${q(url)}`, '_blank', 'noopener')],
      ['image', 'linear-gradient(135deg,#ff7a18,#af002d)', 'كارت', () => window.yrShareImage(d)],
      ['link', '#6b7280', 'نسخ', async () => { try { await navigator.clipboard.writeText(url); toast('تم نسخ الرابط'); } catch { toast(url); } }],
    ];
    if (navigator.share) items.push(['more', '#334155', 'المزيد', () => navigator.share({ title: d.title, text: tx, url }).catch(() => {})]);
    const n = items.length;
    // زوايا مناسبة للمساحة المتاحة حوالين الزر
    let R = 140; const lim = (v) => Math.max(-1, Math.min(1, v));
    const up = oy > 230; const aMax = Math.acos(lim((44 - ox) / R)), aMin = Math.acos(lim((vw - 44 - ox) / R));
    const span = aMax - aMin; const two = span < (n - 1) * 0.5;
    const back = document.createElement('div'); back.id = 'sb-back'; back.className = 'sb-back'; back.style.setProperty('--ox', ox + 'px'); back.style.setProperty('--oy', oy + 'px');
    const o = document.createElement('div'); o.id = 'sb-o'; o.className = 'sb-o'; o.style.setProperty('--ox', ox + 'px'); o.style.setProperty('--oy', oy + 'px');
    items.forEach(([ic, c, label, fn], i) => {
      const th = aMax - (span * i) / (n - 1 || 1); const r = two ? R + (i % 2 ? 70 : 0) : R;
      const x = r * Math.cos(th), y = (up ? -1 : 1) * r * Math.sin(th);
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', label);
      b.className = 'sb-b'; b.style.cssText = `--c:${c};--tx:${x.toFixed(1)}px;--ty:${y.toFixed(1)}px;--d:${i * 45}ms`;
      b.innerHTML = window.yrIco(ic) + `<span>${label}</span>`; b.addEventListener('click', () => { close(); setTimeout(fn, 120); }); o.append(b);
    });
    const core = document.createElement('button'); core.type = 'button'; core.className = 'sb-core'; core.setAttribute('aria-label', 'إغلاق'); core.innerHTML = window.yrIco('x'); o.prepend(core);
    const close = () => { o.classList.remove('sb-in'); back.classList.remove('in'); setTimeout(() => { o.remove(); back.remove(); }, 300); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', esc);
    back.addEventListener('click', close); core.addEventListener('click', close);
    document.body.append(back, o); requestAnimationFrame(() => requestAnimationFrame(() => { back.classList.add('in'); o.classList.add('sb-in'); }));
  };
})();

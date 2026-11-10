/* قائمة المشاركة: شيت زجاجي من تحت، أيقونات حقيقية بألوان التطبيقات تحت بعض، وكارت الصورة في الآخر */
(() => {
  'use strict';
  const SITE = 'يلا رياضة';
  const css = `.sb-back{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .25s}
.sb-back.in{opacity:1}
.sb-sheet{position:fixed;z-index:9999;left:50%;bottom:0;width:min(520px,100%);max-height:92vh;overflow:auto;transform:translate(-50%,105%);transition:transform .45s cubic-bezier(.22,1,.36,1);direction:rtl;font-family:inherit;color:var(--text,#111);background:color-mix(in srgb,var(--panel,#fff) 92%,transparent);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4);border:1px solid var(--line,#ddd);border-bottom:0;border-radius:28px 28px 0 0;padding:8px 14px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -20px 60px rgba(0,0,0,.35)}
.sb-sheet.in{transform:translate(-50%,0)}
@media(min-width:700px){.sb-sheet{bottom:50%;border-radius:28px;border-bottom:1px solid var(--line,#ddd);transform:translate(-50%,60%);opacity:0;transition:transform .45s cubic-bezier(.22,1,.36,1),opacity .25s}.sb-sheet.in{transform:translate(-50%,50%);opacity:1}}
.sb-grab{width:42px;height:5px;border-radius:3px;background:var(--line,#ccc);margin:2px auto 10px}
.sb-head{display:flex;align-items:center;gap:12px;padding:4px 2px 12px;border-bottom:1px solid var(--line,#ddd);margin-bottom:8px}
.sb-th{flex:none;width:48px;height:48px;border-radius:12px;background:var(--panel2,#eee) center/cover no-repeat;display:grid;place-items:center;color:var(--acc,#0f8a3f)}
.sb-ht{min-width:0;flex:1;display:grid;line-height:1.4}.sb-ht small{font-size:11px;font-weight:800;color:var(--acc,#0f8a3f)}.sb-ht b{font-size:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sb-x{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:var(--panel2,#eee);color:inherit;display:grid;place-items:center;cursor:pointer;font-size:16px}
.sb-list{display:grid;gap:2px}
.sb-row{display:flex;align-items:center;gap:14px;width:100%;min-height:56px;padding:6px 8px;border:0;border-radius:16px;background:transparent;color:inherit;font:inherit;font-weight:800;font-size:16px;cursor:pointer;text-align:start;opacity:0;transform:translateY(14px);transition:opacity .3s var(--d),transform .4s cubic-bezier(.34,1.56,.64,1) var(--d),background .15s}
.sb-sheet.in .sb-row{opacity:1;transform:none}.sb-row:hover,.sb-row:active{background:var(--panel2,#eee)}
.sb-ic{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:22px;background:var(--c)}.sb-ic svg{width:1em;height:1em}
.sb-lb{flex:1}.sb-lb small{display:block;font-size:11px;font-weight:600;color:var(--muted,#666)}
.sb-ar{color:var(--muted,#888);font-size:18px;font-style:normal}
.sb-card{display:flex;align-items:center;gap:14px;width:100%;margin-top:10px;padding:12px 14px;border:0;border-radius:20px;font:inherit;color:#fff;cursor:pointer;text-align:start;background:linear-gradient(135deg,#ff7a18,#d4145a 60%,#6a11cb);box-shadow:0 12px 30px rgba(212,20,90,.35);position:relative;overflow:hidden;opacity:0;transform:translateY(14px);transition:opacity .3s var(--d),transform .4s cubic-bezier(.34,1.56,.64,1) var(--d)}
.sb-sheet.in .sb-card{opacity:1;transform:none}
.sb-card::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);transform:translateX(-120%);animation:shShine 3.2s ease-in-out infinite}
.sb-card .sb-ic{background:rgba(255,255,255,.22);width:46px;height:46px}.sb-card b{font-size:16px;display:block}.sb-card small{font-size:12px;opacity:.9;font-weight:600}
.sb-t{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:10000;background:#111;color:#fff;padding:10px 20px;border-radius:999px;font-weight:800;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.4)}`;
  const text = (d) => {
    const u = d.url || location.href.split('#')[0];
    if (d.type === 'match') return `⚽ ${d.title}${d.score ? '\n' + d.score.replace(/\s/g, '') : ''}\n\n${SITE} — تابع المباراة 👇\n${u}`;
    if (d.type === 'product') return `${d.title}${d.price ? ' — ' + d.price : ''}\n\n${SITE} 👇\n${u}`;
    return `${d.title}\n\n${SITE} — التفاصيل كاملة 👇\n${u}\n\n#يلا_رياضة`;
  };
  const toast = (m) => { const t = document.createElement('div'); t.className = 'sb-t'; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 1800); };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  window.yrBloom = function (d) {
    document.getElementById('sb-back')?.remove(); document.getElementById('sb-sheet')?.remove();
    if (!document.getElementById('sb-css')) { const s = document.createElement('style'); s.id = 'sb-css'; s.textContent = css; document.head.appendChild(s); }
    d = { url: location.href.split('#')[0], ...d }; const url = d.url, tx = text(d), q = encodeURIComponent;
    const items = [
      ['whatsapp', '#25D366', 'واتساب', 'أرسل لصديق أو جروب', () => window.open('https://wa.me/?text=' + q(tx), '_blank', 'noopener')],
      ['telegram', '#27A7E7', 'تيليجرام', 'قناة أو محادثة', () => window.open(`https://t.me/share/url?url=${q(url)}&text=${q(d.title)}`, '_blank', 'noopener')],
      ['facebook', '#1877F2', 'فيسبوك', 'انشر على صفحتك', () => window.open('https://www.facebook.com/sharer/sharer.php?u=' + q(url), '_blank', 'noopener')],
      ['xtw', '#111111', 'إكس', 'غرّد بالرابط', () => window.open(`https://twitter.com/intent/tweet?text=${q(d.title)}&url=${q(url)}`, '_blank', 'noopener')],
      ['link', '#6b7280', 'نسخ الرابط', '', async () => { try { await navigator.clipboard.writeText(url); toast('تم نسخ الرابط'); } catch { toast(url); } }],
    ];
    if (navigator.share) items.push(['more', '#334155', 'تطبيقات أخرى', '', () => navigator.share({ title: d.title, text: tx, url }).catch(() => {})]);
    const img = /^https:/.test(d.image || '') ? d.image : '';
    const back = document.createElement('div'); back.id = 'sb-back'; back.className = 'sb-back';
    const sh = document.createElement('div'); sh.id = 'sb-sheet'; sh.className = 'sb-sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'مشاركة');
    sh.innerHTML = `<div class="sb-grab"></div><div class="sb-head"><span class="sb-th"${img ? ` style="background-image:url('${esc(img)}')"` : ''}>${img ? '' : window.yrIco('share')}</span><span class="sb-ht"><small>شارك</small><b>${esc(d.title)}</b></span><button type="button" class="sb-x" aria-label="إغلاق">${window.yrIco('x')}</button></div>
      <div class="sb-list">${items.map(([ic, c, l, sub], i) => `<button type="button" class="sb-row" data-i="${i}" style="--c:${c};--d:${60 + i * 45}ms"><span class="sb-ic">${window.yrIco(ic)}</span><span class="sb-lb">${l}${sub ? `<small>${sub}</small>` : ''}</span><i class="sb-ar" aria-hidden="true">‹</i></button>`).join('')}</div>
      <button type="button" class="sb-card" data-card style="--d:${80 + items.length * 45}ms"><span class="sb-ic">${window.yrIco('image')}</span><span><b>شارك كارت صورة</b><small>بوست أو ستوري بألوان وQR — اختار شكله</small></span></button>`;
    const close = () => { sh.classList.remove('in'); back.classList.remove('in'); setTimeout(() => { sh.remove(); back.remove(); }, 350); document.removeEventListener('keydown', esc2); };
    const esc2 = (e) => { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', esc2);
    back.addEventListener('click', close);
    sh.addEventListener('click', (e) => {
      if (e.target.closest('.sb-x')) return close();
      if (e.target.closest('[data-card]')) { close(); return setTimeout(() => window.yrShareImage(d), 200); }
      const r = e.target.closest('.sb-row'); if (!r) return; const it = items[Number(r.dataset.i)]; close(); setTimeout(it[4], 150);
    });
    document.body.append(back, sh); requestAnimationFrame(() => requestAnimationFrame(() => { back.classList.add('in'); sh.classList.add('in'); }));
  };
})();

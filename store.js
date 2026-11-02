// يلا رياضة — المتجر: يظهر فقط لو فعّلته من لوحة الإدارة (site_settings.store_enabled). المنتجات روابطها لمواقع الشركاء.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const db = window.yrSupabase;
  const page = location.pathname.split('/').pop();
  const root = $(page === 'product.html' ? 'product-root' : 'store-root');
  if (!root) return;
  const soon = $('coming-soon');
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const price = (p) => (p == null || p === '' ? '' : `${Number(p).toLocaleString('ar-EG')} ج.م`);
  const showSoon = () => { root.hidden = true; root.removeAttribute('aria-busy'); if (soon) soon.hidden = false; };

  async function storeOpen() {
    if (!db) return false;
    const { data, error } = await db.from('site_settings').select('value').eq('key', 'store_enabled').maybeSingle();
    return !error && data?.value === true;
  }

  async function runStore() {
    const { data, error } = await db.from('products').select('id,name,category,description,price,image_url').eq('is_published', true).order('created_at', { ascending: false });
    root.removeAttribute('aria-busy');
    if (error) { root.innerHTML = `<p class="note">تعذّر تحميل المنتجات: ${esc(error.message)}</p>`; return; }
    const items = data || [];
    const cats = [...new Set(items.map((p) => p.category).filter(Boolean))];
    let active = 'all';
    const draw = () => {
      const rows = items.filter((p) => active === 'all' || p.category === active);
      root.innerHTML = `<span class="kicker">STORE</span><h1>المتجر الرياضي</h1><p class="sub">منتجات من علامات شريكة. الشراء يتم من موقع البائع.</p>
        ${cats.length ? `<div class="league-chips" role="group" aria-label="التصنيفات"><button type="button" class="chip${active === 'all' ? ' active' : ''}" data-cat="all">الكل</button>${cats.map((c) => `<button type="button" class="chip${active === c ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
        <div class="product-grid">${rows.map((p) => {
          const img = https(p.image_url);
          return `<a class="product-card" href="product.html?id=${encodeURIComponent(p.id)}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : '<div class="product-ph" aria-hidden="true">◈</div>'}
            <div class="product-info"><strong>${esc(p.name)}</strong>${p.category ? `<small>${esc(p.category)}</small>` : ''}<b>${esc(price(p.price))}</b></div></a>`;
        }).join('') || '<p class="note">لا توجد منتجات حاليًا.</p>'}</div>`;
    };
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; active = b.dataset.cat; draw(); });
    draw();
  }

  async function runProduct() {
    const id = new URLSearchParams(location.search).get('id') || '';
    if (!/^[0-9a-f-]{36}$/i.test(id)) { root.removeAttribute('aria-busy'); root.innerHTML = '<p class="note">المنتج غير موجود. <a href="store.html">العودة للمتجر</a></p>'; return; }
    const { data: p, error } = await db.from('products').select('*').eq('id', id).eq('is_published', true).maybeSingle();
    root.removeAttribute('aria-busy');
    if (error || !p) { root.innerHTML = '<p class="note">المنتج غير متاح. <a href="store.html">العودة للمتجر</a></p>'; return; }
    document.title = `${p.name} | يلا رياضة`;
    const img = https(p.image_url); const buy = https(p.buy_url);
    root.innerHTML = `<article class="product-detail panel">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}">` : ''}
      <div><span class="kicker">${esc(p.category || 'STORE')}</span><h1>${esc(p.name)}</h1><p class="product-price">${esc(price(p.price))}</p>
      ${p.description ? `<p class="product-desc">${esc(p.description)}</p>` : ''}
      ${buy ? `<a class="btn primary" href="${esc(buy)}" target="_blank" rel="noopener noreferrer sponsored">اشترِ من موقع البائع ↗</a><p class="note">تُفتح صفحة الشراء في موقع البائع.</p>` : '<p class="note">رابط الشراء غير متاح حاليًا.</p>'}</div></article>`;
  }

  (async () => {
    try {
      if (!(await storeOpen())) return showSoon();
      if (page === 'product.html') await runProduct(); else await runStore();
    } catch (e) { console.error('store:', e); showSoon(); }
  })();
})();

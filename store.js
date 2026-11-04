// يلا رياضة — المتجر: يظهر فقط لو فعّلته من لوحة الإدارة (site_settings.store_enabled). الطلب من صفحة المنتج ويصل للإدارة.
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
      root.innerHTML = `<span class="kicker">STORE</span><h1>المتجر الرياضي</h1><p class="sub">اختر منتجك واطلبه مباشرة — الدفع عند الاستلام.</p>
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
    const { data: sess } = await db.auth.getSession();
    const signedIn = Boolean(sess?.session?.user);
    const img = https(p.image_url);
    root.innerHTML = `<article class="product-detail panel">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}">` : '<div class="product-ph big" aria-hidden="true">◈</div>'}
      <div><span class="kicker">${esc(p.category || 'STORE')}</span><h1>${esc(p.name)}</h1><p class="product-price">${esc(price(p.price))}</p>
      ${p.description ? `<p class="product-desc">${esc(p.description)}</p>` : ''}
      ${signedIn ? `<form id="order-form" class="form-stack order-form" novalidate>
        <h2>اطلب الآن</h2>
        <label>الاسم بالكامل<input id="o-name" required minlength="2" maxlength="100" autocomplete="name"></label>
        <label>رقم الهاتف<input id="o-phone" required type="tel" inputmode="tel" dir="ltr" maxlength="20" autocomplete="tel" placeholder="01xxxxxxxxx"></label>
        <div class="row"><label>المدينة / المحافظة<input id="o-city" maxlength="80" autocomplete="address-level2"></label>
        <label>الكمية<input id="o-qty" type="number" min="1" max="20" value="1" inputmode="numeric"></label></div>
        <label>العنوان بالتفصيل<textarea id="o-address" required minlength="5" maxlength="300" rows="3" autocomplete="street-address"></textarea></label>
        <label>ملاحظات (اختياري)<textarea id="o-notes" maxlength="500" rows="2"></textarea></label>
        <p class="order-total" id="o-total" aria-live="polite"></p>
        <button class="btn primary" id="o-submit" type="submit">تأكيد الطلب</button>
        <p class="note" id="o-msg" role="status"></p>
      </form>` : window.yrLockBox('سجّل دخولك لتطلب', 'الطلب متاح للأعضاء المسجّلين فقط.')}</div></article>`;
    if (!signedIn) return;
    const meta = sess.session.user.user_metadata || {};
    $('o-name').value = meta.full_name || meta.name || meta.display_name || '';
    const total = () => { const q = Math.min(20, Math.max(1, parseInt($('o-qty').value, 10) || 1)); $('o-total').textContent = p.price == null ? '' : `الإجمالي: ${price(p.price * q)} (الدفع عند الاستلام)`; };
    $('o-qty').addEventListener('input', total); total();
    $('order-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('o-msg'); const btn = $('o-submit');
      const name = $('o-name').value.trim(); const phone = $('o-phone').value.trim().replace(/[\s-]/g, '');
      const address = $('o-address').value.trim(); const qty = parseInt($('o-qty').value, 10);
      if (name.length < 2) { msg.textContent = 'اكتب اسمك بالكامل.'; return; }
      if (!/^\+?[0-9]{7,15}$/.test(phone)) { msg.textContent = 'رقم الهاتف غير صحيح.'; return; }
      if (address.length < 5) { msg.textContent = 'اكتب العنوان بالتفصيل.'; return; }
      if (!(qty >= 1 && qty <= 20)) { msg.textContent = 'الكمية من 1 إلى 20.'; return; }
      btn.disabled = true; msg.textContent = 'جارٍ إرسال الطلب...';
      const { error: err } = await db.from('orders').insert({ product_id: p.id, quantity: qty, customer_name: name, phone, city: $('o-city').value.trim(), address, notes: $('o-notes').value.trim() });
      if (err) {
        btn.disabled = false;
        if (/row-level security|JWT|permission|سجّل/i.test(err.message || '')) { msg.textContent = 'سجّل دخولك أولًا لإتمام الطلب.'; return; }
        msg.textContent = /orders/.test(err.message || '') && /(find|exist|schema)/i.test(err.message || '') ? 'نظام الطلبات غير مفعّل بعد.' : 'تعذّر إرسال الطلب. حاول مرة أخرى.';
        return;
      }
      $('order-form').innerHTML = `<div class="order-done"><span aria-hidden="true">✓</span><h2>تم استلام طلبك</h2><p>سنتواصل معك على <b dir="ltr">${esc(phone)}</b> لتأكيد الطلب وموعد التسليم.</p><a class="btn outline" href="store.html">متابعة التسوق</a></div>`;
    });
  }

  (async () => {
    try {
      if (!(await storeOpen())) return showSoon();
      if (page === 'product.html') await runProduct(); else await runStore();
    } catch (e) { console.error('store:', e); showSoon(); }
  })();
})();

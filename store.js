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
    // تطبيع عربي للبحث: يتجاهل التشكيل والهمزات والتاء المربوطة
    const norm = (v) => String(v ?? '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).trim();
    const state = { cat: 'all', q: '', sort: 'new' };
    const max = Math.max(0, ...items.map((p) => Number(p.price) || 0));
    root.innerHTML = `<span class="kicker">STORE</span><h1>المتجر الرياضي</h1><p class="sub">اختر منتجك واطلبه مباشرة — الدفع عند الاستلام.</p>
      <div class="store-toolbar">
        <div class="search-box" role="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="store-search" type="search" placeholder="ابحث عن منتج… (مثال: قميص، حذاء)" autocomplete="off" enterkeyhint="search" aria-label="ابحث عن منتج">
          <button id="store-clear" type="button" hidden aria-label="مسح البحث">✕</button></div>
        <label class="sort-box"><span>ترتيب</span><select id="store-sort" aria-label="ترتيب المنتجات"><option value="new">الأحدث</option><option value="low">السعر: الأقل</option><option value="high">السعر: الأعلى</option><option value="name">الاسم</option></select></label>
      </div>
      ${cats.length ? `<div class="league-chips" id="store-cats" role="group" aria-label="الفئات"><button type="button" class="chip active" data-cat="all">الكل <small>${items.length}</small></button>${cats.map((c) => `<button type="button" class="chip" data-cat="${esc(c)}">${esc(c)} <small>${items.filter((p) => p.category === c).length}</small></button>`).join('')}</div>` : ''}
      <p class="results-count" id="store-count" aria-live="polite"></p>
      <div class="product-grid" id="store-grid"></div>`;
    const grid = $('store-grid'); const count = $('store-count');
    const draw = () => {
      const q = norm(state.q);
      let rows = items.filter((p) => (state.cat === 'all' || p.category === state.cat) && (!q || q.split(/\s+/).every((w) => norm(`${p.name} ${p.category} ${p.description}`).includes(w))));
      const priceOf = (p) => (p.price == null ? Infinity : Number(p.price));
      if (state.sort === 'low') rows = rows.slice().sort((x, y) => priceOf(x) - priceOf(y));
      else if (state.sort === 'high') rows = rows.slice().sort((x, y) => (y.price == null ? -1 : Number(y.price)) - (x.price == null ? -1 : Number(x.price)));
      else if (state.sort === 'name') rows = rows.slice().sort((x, y) => String(x.name).localeCompare(String(y.name), 'ar'));
      count.textContent = rows.length ? `${rows.length.toLocaleString('ar-EG')} منتج` : '';
      grid.innerHTML = rows.map((p, i) => {
        const img = https(p.image_url);
        return `<a class="product-card" style="--i:${Math.min(i, 11)}" href="product.html?id=${encodeURIComponent(p.id)}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : '<div class="product-ph" aria-hidden="true">◈</div>'}
          <div class="product-info"><strong>${esc(p.name)}</strong>${p.category ? `<small>${esc(p.category)}</small>` : ''}<b>${esc(price(p.price))}</b></div></a>`;
      }).join('') || `<div class="empty-state"><span aria-hidden="true">🔍</span><h3>${items.length ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات حاليًا'}</h3>${items.length ? '<p class="note">جرّب كلمة تانية أو امسح الفلاتر.</p><button type="button" class="btn outline" id="store-reset">مسح الفلاتر</button>' : ''}</div>`;
    };
    const input = $('store-search'); const clear = $('store-clear'); let timer;
    input.addEventListener('input', () => { clear.hidden = !input.value; clearTimeout(timer); timer = setTimeout(() => { state.q = input.value; draw(); }, 150); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') clear.click(); });
    clear.addEventListener('click', () => { input.value = ''; clear.hidden = true; state.q = ''; draw(); input.focus(); });
    $('store-sort').addEventListener('change', (e) => { state.sort = e.target.value; draw(); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (b) { state.cat = b.dataset.cat; root.querySelectorAll('[data-cat]').forEach((x) => x.classList.toggle('active', x === b)); draw(); }
      if (e.target.closest('#store-reset')) { state.cat = 'all'; state.q = ''; input.value = ''; clear.hidden = true; root.querySelectorAll('[data-cat]').forEach((x) => x.classList.toggle('active', x.dataset.cat === 'all')); draw(); }
    });
    draw();
  }

  async function runProduct() {
    const id = new URLSearchParams(location.search).get('id') || '';
    if (!/^[0-9a-f-]{36}$/i.test(id)) { root.removeAttribute('aria-busy'); root.innerHTML = '<p class="note">المنتج غير موجود. <a href="store.html">العودة للمتجر</a></p>'; return; }
    const { data: p, error } = await db.from('products').select('*').eq('id', id).eq('is_published', true).maybeSingle();
    root.removeAttribute('aria-busy');
    if (error || !p) { root.innerHTML = '<p class="note">المنتج غير متاح. <a href="store.html">العودة للمتجر</a></p>'; return; }
    document.title = `${p.name} | يلا رياضة`;
    window.yrProductShare = () => window.yrShareImage({ type: 'product', title: p.name, sub: p.category || '', price: price(p.price), image: https(p.image_url), emoji: '🛍️', tag: 'متجر يلا رياضة', url: location.href.split('#')[0] });
    const { data: sess } = await db.auth.getSession();
    const signedIn = Boolean(sess?.session?.user);
    const img = https(p.image_url);
    root.innerHTML = `<article class="product-detail panel">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}">` : '<div class="product-ph big" aria-hidden="true">◈</div>'}
      <div><span class="kicker">${esc(p.category || 'STORE')}</span><h1>${esc(p.name)}</h1><p class="product-price">${esc(price(p.price))}</p><button type="button" class="mh-share inline" onclick="window.yrProductShare()"><span aria-hidden="true">✨</span> شارك المنتج</button>
      ${p.description ? `<p class="product-desc">${esc(p.description)}</p>` : ''}
      ${signedIn ? `<form id="order-form" class="form-stack order-form" novalidate>
        <h2>اطلب الآن</h2>
        <p class="order-account">سيتم ربط الطلب بحسابك: <b dir="ltr" id="o-email"></b></p>
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
    $('o-email').textContent = sess.session.user.email || '';
    $('o-name').value = meta.full_name || meta.name || meta.display_name || '';
    const total = () => { const q = Math.min(20, Math.max(1, parseInt($('o-qty').value, 10) || 1)); $('o-total').textContent = p.price == null ? '' : `الإجمالي: ${price(p.price * q)} (الدفع عند الاستلام)`; };
    $('o-qty').addEventListener('input', total); total();
    $('order-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('o-msg'); const btn = $('o-submit');
      const name = $('o-name').value.trim(); const phone = $('o-phone').value.trim().replace(/[\s-]/g, '');
      const address = $('o-address').value.trim(); const qty = parseInt($('o-qty').value, 10);
      if (/[0-9@#$%^&*()_+=<>/\\|{}\[\]~`!?؟]/.test(name) || !/\S+\s+\S+/.test(name) || name.length < 5) { msg.textContent = 'اكتب اسمك الحقيقي بالكامل (الاسم الأول والأخير، بدون أرقام أو رموز).'; return; }
      if (!(/^01[0125][0-9]{8}$/.test(phone) || /^\+[1-9][0-9]{8,14}$/.test(phone))) { msg.textContent = 'رقم الهاتف غير صحيح. مثال: 01012345678 أو +966501234567.'; return; }
      if (address.length < 5) { msg.textContent = 'اكتب العنوان بالتفصيل.'; return; }
      if (!(qty >= 1 && qty <= 20)) { msg.textContent = 'الكمية من 1 إلى 20.'; return; }
      btn.disabled = true; msg.textContent = 'جارٍ إرسال الطلب...';
      const { error: err } = await db.from('orders').insert({ product_id: p.id, quantity: qty, customer_name: name, phone, city: $('o-city').value.trim(), address, notes: $('o-notes').value.trim() });
      if (err) {
        btn.disabled = false;
        const own = String(err.message || '').match(/ORDER:(.+)/);
        if (own) { msg.textContent = own[1]; return; }
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

(() => {
  'use strict';
  const db = window.yrSupabase;
  const host = document.getElementById('article');
  if (!host) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (v) => { try { const u = new URL(v); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
  const fdate = (v) => v ? new Date(v).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'long', timeStyle: 'short' }) : '';
  const id = new URLSearchParams(location.search).get('id') || new URLSearchParams(location.search).get('n');

  const render = (body) => window.yrRich.render(body);
  const minutes = (t) => Math.max(1, Math.round(String(t || '').split(/\s+/).length / 180));

  const setMeta = (n, img) => {
    document.title = `${n.title} | يلا رياضة`;
    const desc = (n.excerpt || n.body || '').replace(/[#>*\[\]!()-]/g, '').slice(0, 160);
    const set = (sel, attr, key, val) => { let e = document.head.querySelector(sel); if (!e) { e = document.createElement('meta'); e.setAttribute(attr, key); document.head.appendChild(e); } e.setAttribute('content', val); };
    set('meta[name="description"]', 'name', 'description', desc);
    set('meta[property="og:title"]', 'property', 'og:title', n.title);
    set('meta[property="og:description"]', 'property', 'og:description', desc);
    if (img) set('meta[property="og:image"]', 'property', 'og:image', img);
  };

  const shareBar = (n) => {
    const url = location.href.split('#')[0]; const t = encodeURIComponent(n.title); const u = encodeURIComponent(url);
    return `<div class="art-share"><span>شارك الخبر</span>
      <a class="sh wa" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener noreferrer">واتساب</a>
      <a class="sh tg" href="https://t.me/share/url?url=${u}&text=${t}" target="_blank" rel="noopener noreferrer">تيليجرام</a>
      <a class="sh fb" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener noreferrer">فيسبوك</a>
      <a class="sh x" href="https://twitter.com/intent/tweet?text=${t}&url=${u}" target="_blank" rel="noopener noreferrer">إكس</a>
      <button type="button" class="sh cp" id="art-copy">نسخ الرابط</button></div>`;
  };

  async function load() {
    if (!db || !id) { host.innerHTML = '<p class="note">الخبر غير متاح.</p>'; host.removeAttribute('aria-busy'); return; }
    let { data, error } = await db.from('news').select('id,title,body,image_url,source_url,created_at,category,excerpt,views').eq('id', id).eq('is_published', true).maybeSingle();
    if (error) ({ data, error } = await db.from('news').select('id,title,body,image_url,source_url,created_at').eq('id', id).eq('is_published', true).maybeSingle());
    host.removeAttribute('aria-busy');
    if (error || !data) { host.innerHTML = '<div class="empty-state"><p>الخبر ده مش موجود أو اتشال.</p><a class="btn outline" href="news.html">كل الأخبار</a></div>'; return; }
    const n = data; const img = https(n.image_url); const src = https(n.source_url);
    setMeta(n, img);
    host.innerHTML = `
      <header class="art-head">
        <div class="art-tags"><span class="tag excl">★ حصري على يلا رياضة</span>${n.category ? `<span class="tag">${esc(n.category)}</span>` : ''}</div>
        <h1>${esc(n.title)}</h1>
        ${n.excerpt ? `<p class="art-lead">${esc(n.excerpt)}</p>` : ''}
        <div class="art-meta"><span>🕒 ${esc(fdate(n.created_at))}</span><span>📖 ${minutes(n.body).toLocaleString('ar-EG')} دقائق قراءة</span>${n.views != null ? `<span>👁 ${Number(n.views).toLocaleString('ar-EG')} مشاهدة</span>` : ''}</div>
      </header>
      ${img ? `<figure class="art-hero"><img src="${esc(img)}" alt="${esc(n.title)}"></figure>` : ''}
      ${shareBar(n)}
      <div class="art-body">${render(n.body)}</div>
      ${src ? `<p class="art-source">المصدر: <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(new URL(src).hostname.replace(/^www\./, ''))} ↗</a></p>` : ''}
      ${shareBar(n)}`;
    window.yrRich.hydrate(host.querySelector('.art-body'));
    host.querySelectorAll('#art-copy').forEach((b) => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); b.textContent = 'تم النسخ ✓'; } catch { b.textContent = location.href; } }));
    // عدّاد المشاهدات: مرة واحدة لكل جلسة
    try { if (!sessionStorage.getItem(`yr-v:${id}`)) { sessionStorage.setItem(`yr-v:${id}`, '1'); db.rpc('news_view', { p_id: id }).then(() => {}, () => {}); } } catch { /* اختياري */ }
    related(id);
  }
  async function related(cur) {
    const { data } = await db.from('news').select('id,title,image_url,created_at').eq('is_published', true).neq('id', cur).order('created_at', { ascending: false }).limit(3);
    if (!data?.length) return;
    document.getElementById('related-list').innerHTML = data.map((n) => { const i = https(n.image_url); return `<a class="news-card" href="article.html?id=${encodeURIComponent(n.id)}">${i ? `<div class="news-card-image"><img src="${esc(i)}" alt="" loading="lazy"></div>` : ''}<div class="news-card-content"><div class="news-meta"><span class="tag excl">★ حصري</span><time>${esc(fdate(n.created_at))}</time></div><h2>${esc(n.title)}</h2></div></a>`; }).join('');
    document.getElementById('related').hidden = false;
  }
  const bar = document.getElementById('read-progress');
  addEventListener('scroll', () => { const h = document.documentElement; const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight); if (bar) bar.style.transform = `scaleX(${Math.min(1, p)})`; }, { passive: true });
  load();
})();

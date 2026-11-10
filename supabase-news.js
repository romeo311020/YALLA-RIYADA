(() => {
  'use strict';

  const db = window.yrSupabase;
  const host = document.getElementById('news-list');
  if (!host) return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
  const safeHttpsUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  };
  const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' })
      : 'تاريخ النشر غير متاح';
  };

  const shareBtn = (id, title, url, img) => `<button type="button" class="news-share" data-share-img="${escapeHtml(img || '')}" data-share-title="${escapeHtml(title)}" data-share-url="${escapeHtml(url)}" aria-label="مشاركة الخبر"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg><span>مشاركة</span></button>`;
  const artUrl = (id) => `article.html?id=${encodeURIComponent(id)}`;
  const siteNews = (id) => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}article.html?id=${encodeURIComponent(id)}`;
  const snippet = (n) => n.excerpt || String(n.body || '').replace(/[#>*\[\]!()]/g, '').replace(/\s+/g, ' ').slice(0, 130);
  const manualCard = (n) => `<a class="news-card" id="n-${escapeHtml(n.id)}" href="${artUrl(n.id)}">
        ${n.safeImage ? `<div class="news-card-image"><img src="${escapeHtml(n.safeImage)}" alt="" loading="lazy"></div>` : ''}
        <div class="news-card-content">
          <div class="news-meta"><span class="tag excl">★ حصري</span><time>${escapeHtml(formatDate(n.created_at))}</time></div>
          <h2>${escapeHtml(n.title)}</h2>
          <p>${escapeHtml(snippet(n))}${snippet(n).length >= 130 ? '…' : ''}</p>
          <span class="news-read-more">اقرأ الخبر ←</span><span role="button" tabindex="0" class="news-share chip-share" data-share-title="${escapeHtml(n.title)}" data-share-img="${escapeHtml(n.safeImage || '')}" data-share-url="${escapeHtml(siteNews(n.id))}" aria-label="مشاركة كصورة">✨ مشاركة</span>
        </div>
      </a>`;
  const featureCard = (n) => `<a class="news-feature" href="${artUrl(n.id)}">
        ${n.safeImage ? `<div class="news-card-image"><img src="${escapeHtml(n.safeImage)}" alt=""></div>` : ''}
        <div class="news-card-content">
          <div class="news-meta"><span class="tag excl">★ حصري على يلا رياضة</span>${n.category ? `<span class="tag">${escapeHtml(n.category)}</span>` : ''}</div>
          <h2>${escapeHtml(n.title)}</h2>
          <p>${escapeHtml(snippet(n))}${snippet(n).length >= 130 ? '…' : ''}</p>
          <div class="news-meta"><time>${escapeHtml(formatDate(n.created_at))}</time><span class="news-read-more">اقرأ الخبر ←</span><span role="button" tabindex="0" class="news-share chip-share" data-share-title="${escapeHtml(n.title)}" data-share-img="${escapeHtml(n.safeImage || '')}" data-share-url="${escapeHtml(siteNews(n.id))}" aria-label="مشاركة كصورة">✨ مشاركة</span></div>
        </div>
      </a>`;
  const apiCard = (article) => `<article class="news-card">
        ${article.safeImage ? `<a class="news-card-image" href="${escapeHtml(article.safeUrl)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(article.safeImage)}" alt="" loading="lazy"></a>` : ''}
        <div class="news-card-content">
          <div class="news-meta"><span class="tag">الصحافة</span><time>${escapeHtml(formatDate(article.publishedAt))}</time></div>
          <h2><a href="${escapeHtml(article.safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.title)}</a></h2>
          ${article.description ? `<p>${escapeHtml(article.description)}</p>` : ''}
          <div class="news-actions"><a class="news-read-more" href="${escapeHtml(article.safeUrl)}" target="_blank" rel="noopener noreferrer">اقرأ المزيد ↗</a>${shareBtn('', article.title, article.safeUrl, article.safeImage)}</div>
        </div>
      </article>`;

  let manual = []; let cat = 'all'; let apiHtml = '';
  const paint = () => {
    const list = cat === 'all' ? manual : manual.filter((n) => n.category === cat);
    const cats = [...new Set(manual.map((n) => n.category).filter(Boolean))];
    const chips = cats.length > 1 ? `<div class="news-cats">${['all', ...cats].map((c) => `<button type="button" class="chip${cat === c ? ' active' : ''}" data-cat="${escapeHtml(c)}">${c === 'all' ? 'كل الأخبار' : escapeHtml(c)}</button>`).join('')}</div>` : '';
    const [first, ...rest] = list;
    host.className = '';
    host.innerHTML = chips + (first ? featureCard(first) : '') + (rest.length ? `<div class="news-grid">${rest.map(manualCard).join('')}</div>` : '')
      + (!first && !apiHtml ? '<p class="note">لا توجد أخبار حاليًا.</p>' : '') + apiHtml;
  };
  async function loadNews() {
    if (!db) { host.innerHTML = '<p class="note">إعدادات Supabase غير مكتملة. لا يمكن تحميل الأخبار حاليًا.</p>'; return; }
    host.setAttribute('aria-busy', 'true');
    host.innerHTML = '<p class="note">جارٍ تحميل آخر الأخبار الرياضية...</p>';
    // أخبار الموقع الحصرية تظهر فورًا، وأخبار الصحافة تتحمّل بعدها (فشلها أو بطؤها لا يعطّل الصفحة)
    let r = await db.from('news').select('id,title,body,image_url,source_url,created_at,category,excerpt').eq('is_published', true).order('created_at', { ascending: false }).limit(30);
    if (r.error) r = await db.from('news').select('id,title,body,image_url,source_url,created_at').eq('is_published', true).order('created_at', { ascending: false }).limit(30);
    manual = r.error ? [] : (r.data || []).map((n) => ({ ...n, safeImage: safeHttpsUrl(n.image_url) }));
    host.removeAttribute('aria-busy');
    paint();
    const want = new URLSearchParams(location.search).get('n');
    if (want) { location.replace(artUrl(want)); return; }
    try {
      const feed = await Promise.race([db.functions.invoke('sports-news', { body: {} }), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 9000))]);
      if (feed.error || feed.data?.error) throw (feed.error || new Error(feed.data.error));
      const articles = (Array.isArray(feed.data?.articles) ? feed.data.articles : []).map((a) => ({ ...a, safeUrl: safeHttpsUrl(a.url), safeImage: safeHttpsUrl(a.image) })).filter((a) => a.safeUrl);
      if (articles.length) { apiHtml = `<h2 class="news-section-title">من الصحافة الرياضية</h2><div class="news-grid">${articles.map(apiCard).join('')}</div>`; paint(); }
    } catch (err) { console.error('Could not load sports news:', err); }
  }
  host.addEventListener('click', (e) => { const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; paint(); } });
  host.addEventListener('click', (e) => {
    const b = e.target.closest('.news-share'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); window.yrShareImage({ type: 'news', title: b.dataset.shareTitle, image: b.dataset.shareImg, url: b.dataset.shareUrl });
  });

  loadNews();
})();

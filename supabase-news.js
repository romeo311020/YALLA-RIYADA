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

  const manualCard = (n) => `<article class="news-card">
        ${n.safeImage ? `<div class="news-card-image"><img src="${escapeHtml(n.safeImage)}" alt="" loading="lazy"></div>` : ''}
        <div class="news-card-content">
          <div class="news-meta"><span class="tag">يلا رياضة</span><time>${escapeHtml(formatDate(n.created_at))}</time></div>
          <h2>${escapeHtml(n.title)}</h2>
          ${n.body ? `<p style="white-space:pre-wrap">${escapeHtml(n.body)}</p>` : ''}
          ${n.safeSource ? `<a class="news-read-more" href="${escapeHtml(n.safeSource)}" target="_blank" rel="noopener noreferrer">اقرأ المزيد ↗</a>` : ''}
        </div>
      </article>`;
  const apiCard = (article) => `<article class="news-card">
        ${article.safeImage ? `<a class="news-card-image" href="${escapeHtml(article.safeUrl)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(article.safeImage)}" alt="" loading="lazy"></a>` : ''}
        <div class="news-card-content">
          <div class="news-meta"><span class="tag">يلا رياضة</span><time>${escapeHtml(formatDate(article.publishedAt))}</time></div>
          <h2><a href="${escapeHtml(article.safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(article.title)}</a></h2>
          ${article.description ? `<p>${escapeHtml(article.description)}</p>` : ''}
          <a class="news-read-more" href="${escapeHtml(article.safeUrl)}" target="_blank" rel="noopener noreferrer">اقرأ المزيد ↗</a>
        </div>
      </article>`;

  async function loadNews() {
    if (!db) {
      host.innerHTML = '<p class="note">إعدادات Supabase غير مكتملة. لا يمكن تحميل الأخبار حاليًا.</p>';
      return;
    }
    host.setAttribute('aria-busy', 'true');
    host.innerHTML = '<p class="note">جارٍ تحميل آخر الأخبار الرياضية...</p>';

    // الأخبار التي كتبتها أنت من لوحة الإدارة + أخبار GNews، وفشل أحدهما لا يمنع الآخر
    const [mine, feed] = await Promise.allSettled([
      db.from('news').select('id,title,body,image_url,source_url,created_at').eq('is_published', true).order('created_at', { ascending: false }).limit(20),
      db.functions.invoke('sports-news', { body: {} }),
    ]);

    const manual = mine.status === 'fulfilled' && !mine.value.error
      ? (mine.value.data || []).map((n) => ({ ...n, safeImage: safeHttpsUrl(n.image_url), safeSource: safeHttpsUrl(n.source_url) }))
      : [];

    let articles = []; let feedError = '';
    if (feed.status === 'fulfilled' && !feed.value.error && !feed.value.data?.error) {
      articles = (Array.isArray(feed.value.data?.articles) ? feed.value.data.articles : [])
        .map((a) => ({ ...a, safeUrl: safeHttpsUrl(a.url), safeImage: safeHttpsUrl(a.image) }))
        .filter((a) => a.safeUrl);
    } else {
      const err = feed.status === 'fulfilled' ? (feed.value.error || new Error(feed.value.data?.error)) : feed.reason;
      console.error('Could not load sports news:', err);
      feedError = /failed to send a request/i.test(err?.message || '') ? 'خدمة الأخبار الخارجية غير مفعّلة بعد.' : (err?.message || 'خطأ غير معروف');
    }

    const html = manual.map(manualCard).join('') + articles.map(apiCard).join('');
    host.innerHTML = html || `<p class="note">${feedError ? `تعذّر تحميل الأخبار: ${escapeHtml(feedError)}` : 'لا توجد أخبار رياضية متاحة حاليًا.'}</p>`;
    if (html && feedError) host.insertAdjacentHTML('beforeend', `<p class="note">تعذّر تحميل بعض الأخبار حاليًا. حاول لاحقًا.</p>`);
    host.removeAttribute('aria-busy');
  }

  loadNews();
})();

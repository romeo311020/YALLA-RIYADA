/* تنسيق نص الخبر + تضمين منشورات المنصات (يوتيوب، X، إنستجرام، تيك توك، فيسبوك) من مجرد رابط في سطر لوحده */
(function () {
  'use strict';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, (m, a, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${a}</a>`);
  const url = (l) => { try { const u = new URL(l); return u.protocol === 'https:' && !/\s/.test(l) ? u : null; } catch { return null; } };
  const host = (u) => u.hostname.replace(/^(www|m|mobile)\./, '');

  const embed = (u) => {
    const h = host(u); const href = u.href;
    let m;
    if (h === 'youtu.be' && (m = u.pathname.match(/^\/([\w-]{11})/))) return yt(m[1]);
    if (/(^|\.)youtube\.com$/.test(h)) { const id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:embed|live|shorts)\/([\w-]{11})/) || [])[1]; if (id && /^[\w-]{11}$/.test(id)) return yt(id, /shorts/.test(u.pathname)); }
    if (/^(x|twitter)\.com$/.test(h) && /\/status\/\d+/.test(u.pathname)) return `<div class="emb emb-x"><blockquote class="twitter-tweet" data-lang="ar" data-dnt="true" data-conversation="none"><a href="${esc('https://twitter.com' + u.pathname)}">عرض المنشور على X ↗</a></blockquote></div>`;
    if (h === 'instagram.com' && /^\/(p|reel|reels|tv)\/[\w-]+/.test(u.pathname)) { const clean = 'https://www.instagram.com' + u.pathname.replace(/\/?$/, '/'); return `<div class="emb emb-ig"><blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${esc(clean)}" data-instgrm-version="14"><a href="${esc(clean)}" target="_blank" rel="noopener noreferrer">عرض المنشور على إنستجرام ↗</a></blockquote></div>`; }
    if (h === 'tiktok.com' && (m = u.pathname.match(/\/video\/(\d+)/))) return `<div class="emb emb-tt"><blockquote class="tiktok-embed" cite="${esc(href)}" data-video-id="${m[1]}"><section><a href="${esc(href)}" target="_blank" rel="noopener noreferrer">عرض الفيديو على تيك توك ↗</a></section></blockquote></div>`;
    if (/(^|\.)facebook\.com$/.test(h) || h === 'fb.watch') {
      const isVid = /\/(videos|reel|watch)\b/.test(u.pathname) || h === 'fb.watch';
      const fl = `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">عرض المنشور على فيسبوك ↗</a>`;
      return `<div class="emb emb-fb${isVid ? ' vid' : ''}"><div class="fb-${isVid ? 'video' : 'post'}" data-href="${esc(href)}" data-width="500" data-show-text="true" data-lazy="true">${fl}</div></div><p class="emb-fbl">${fl}</p>`;
    }
    return `<a class="emb-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><b>${esc(h)}</b><span>${esc(decodeURIComponent(u.pathname).slice(0, 70) || '/')}</span><i>↗</i></a>`;
  };
  const yt = (id, vertical) => `<div class="emb emb-yt${vertical ? ' vert' : ''}"><iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture; fullscreen" title="فيديو"></iframe></div>`;

  function render(body) {
    const out = []; let list = null; let para = [];
    const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } if (list) { out.push(`<ul>${list.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`); list = null; } };
    String(body || '').replace(/\r/g, '').split('\n').forEach((raw) => {
      const l = raw.trim();
      if (!l) { flush(); return; }
      let m; const u = url(l);
      if (u) { flush(); out.push(embed(u)); }
      else if ((m = l.match(/^!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)$/))) { flush(); out.push(`<figure><img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy">${m[1] ? `<figcaption>${esc(m[1])}</figcaption>` : ''}</figure>`); }
      else if (l.startsWith('### ')) { flush(); out.push(`<h3>${inline(l.slice(4))}</h3>`); }
      else if (l.startsWith('## ')) { flush(); out.push(`<h2>${inline(l.slice(3))}</h2>`); }
      else if (l.startsWith('> ')) { flush(); out.push(`<blockquote>${inline(l.slice(2))}</blockquote>`); }
      else if (/^[-•] /.test(l)) { if (para.length) flush(); (list = list || []).push(l.slice(2)); }
      else { if (list) flush(); para.push(l); }
    });
    flush(); return out.join('');
  }

  const load = (src, id) => new Promise((res) => { if (document.getElementById(id)) { res(); return; } const s = document.createElement('script'); s.id = id; s.async = true; s.src = src; s.onload = () => res(); s.onerror = () => res(); document.head.appendChild(s); });
  async function hydrate(root) {
    if (!root) return;
    if (root.querySelector('.twitter-tweet')) { await load('https://platform.twitter.com/widgets.js', 'yr-tw'); try { window.twttr && window.twttr.widgets && window.twttr.widgets.load(root); } catch { /* اختياري */ } }
    if (root.querySelector('.instagram-media')) { await load('https://www.instagram.com/embed.js', 'yr-ig'); try { window.instgrm && window.instgrm.Embeds.process(); } catch { /* اختياري */ } }
    if (root.querySelector('.tiktok-embed')) await load('https://www.tiktok.com/embed.js', 'yr-tt');
    if (root.querySelector('.fb-post,.fb-video')) { if (!document.getElementById('fb-root')) { const r = document.createElement('div'); r.id = 'fb-root'; document.body.appendChild(r); } await load('https://connect.facebook.net/ar_AR/sdk.js#xfbml=1&version=v19.0', 'yr-fb'); try { window.FB && window.FB.XFBML.parse(root); } catch { /* اختياري */ }
      // لو الـ SDK ما رسمش المنشور (محجوب أو بطيء) نرجع للإطار المباشر بعد ثواني
      setTimeout(() => root.querySelectorAll('.fb-post,.fb-video').forEach((el) => {
        if (el.querySelector('iframe') || el.dataset.fb === '1') return; el.dataset.fb = '1';
        const vid = el.classList.contains('fb-video');
        const f = document.createElement('iframe'); f.loading = 'lazy'; f.setAttribute('allowfullscreen', ''); f.allow = 'encrypted-media; picture-in-picture'; f.title = 'منشور فيسبوك';
        f.src = `https://www.facebook.com/plugins/${vid ? 'video' : 'post'}.php?href=${encodeURIComponent(el.dataset.href)}&show_text=true&width=500`;
        el.textContent = ''; el.appendChild(f);
      }), 4500); }
  }
  window.yrRich = { render, hydrate };
})();

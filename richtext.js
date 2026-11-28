/* تنسيق نص الخبر + تضمين منشورات المنصات (يوتيوب، X، إنستجرام، تيك توك، فيسبوك) من مجرد رابط في سطر لوحده */
(function () {
  'use strict';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const inline = (t) => esc(t)
    .replace(/\s*\|+\s*/g, ' · ')
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
      return `<div class="emb emb-fb${isVid ? ' vid' : ''}"><iframe src="https://www.facebook.com/plugins/${isVid ? 'video' : 'post'}.php?href=${encodeURIComponent(href)}&show_text=true&width=560" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture" title="منشور فيسبوك"></iframe></div>`;
    }
    return `<a class="emb-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer"><b>${esc(h)}</b><span>${esc(decodeURIComponent(u.pathname).slice(0, 70) || '/')}</span><i>↗</i></a>`;
  };
  const yt = (id, vertical) => `<div class="emb emb-yt${vertical ? ' vert' : ''}"><iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture; fullscreen" title="فيديو"></iframe></div>`;

  /* ---------- الجداول: | و || بتتحوّل لجدول HTML حقيقي (RTL) من غير ما نغيّر أي نص أو رقم ---------- */
  const NUM = /^[\d٠-٩۰-۹.,٫٬%+\-–−:/\s]+$/;
  const splitCells = (l) => l.trim().replace(/^\|+/, '').replace(/\|+\s*$/, '').split('|').map((c) => c.trim());
  const isSep = (cells) => cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
  function toRows(lines) {
    const rows = [];
    lines.forEach((l) => { (l.includes('||') ? l.split('||') : [l]).forEach((piece) => { if (piece.trim() && piece.includes('|')) rows.push(splitCells(piece)); }); });
    return rows;
  }
  function buildTable(lines) {
    let rows = toRows(lines); if (rows.length < 2) return null;
    let sepAt = rows.findIndex(isSep); if (sepAt >= 0) rows = rows.filter((r, i) => i !== sepAt);
    const counts = {}; rows.forEach((r) => { counts[r.length] = (counts[r.length] || 0) + 1; });
    const cols = Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a] || b - a)[0]);
    if (cols < 2 || counts[cols] < Math.ceil(rows.length * 0.6) || rows.length < 2) return null;
    rows = rows.map((r) => { const o = r.slice(0, cols); if (r.length > cols) o[cols - 1] = r.slice(cols - 1).join(' '); while (o.length < cols) o.push(''); return o; });
    const hasNum = (r) => r.some((c) => c && NUM.test(c));
    const header = sepAt === 1 || sepAt === 0 || (!hasNum(rows[0]) && rows.slice(1).some(hasNum)) ? rows[0] : null;
    const body = header ? rows.slice(1) : rows;
    const colNum = Array.from({ length: cols }, (_, c) => body.length > 0 && body.every((r) => !r[c] || NUM.test(r[c])));
    const nameCol = colNum.findIndex((x) => !x);
    const th = header ? `<thead><tr>${header.map((h, c) => `<th scope="col"${colNum[c] ? ' class="n"' : ''}>${inline(h)}</th>`).join('')}</tr></thead>` : '';
    const tb = body.map((r) => `<tr>${r.map((c, i) => `<td${header ? ` data-label="${esc(header[i])}"` : ''} class="${colNum[i] ? (i === 0 ? 'n rk' : 'n') : (i === nameCol ? 'nm' : '')}">${inline(c)}</td>`).join('')}</tr>`).join('');
    return `<div class="art-tblw" role="region" tabindex="0" aria-label="جدول"><table class="art-tbl${cols >= 4 && header ? ' cards-m' : ''}" dir="rtl">${th}<tbody>${tb}</tbody></table></div>`;
  }
  // يجمّع الأسطر المتتالية اللي فيها | في جداول، وأي سطر | مش جدول بيتنضّف في inline
  function withTables(src) {
    const out = []; let grp = [];
    const closeGrp = () => { if (!grp.length) return; const t = buildTable(grp); if (t) out.push({ html: t }); else grp.forEach((g) => out.push(g)); grp = []; };
    src.forEach((raw) => {
      const l = raw.trim();
      if (l.includes('|') && !url(l) && !/^(#|>|!\[)/.test(l)) grp.push(l); else { closeGrp(); out.push(raw); }
    });
    closeGrp(); return out;
  }

  function render(body) {
    const out = []; let list = null; let para = [];
    const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } if (list) { out.push(`<ul>${list.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`); list = null; } };
    withTables(String(body || '').replace(/\r/g, '').split('\n')).forEach((raw) => {
      if (raw && typeof raw === 'object') { flush(); out.push(raw.html); return; }
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
  }
  window.yrRich = { render, hydrate };
})();

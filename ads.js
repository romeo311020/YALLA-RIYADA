/* إعلانات منبثقة (صورة / فيديو / يوتيوب) بشكل زجاجي. بتتدار من لوحة التحكم → الإعلانات. */
(() => {
  'use strict';
  const page = location.pathname.split('/').pop() || 'index.html';
  if (/^(admin|account|password-reset|notifications)\.html$/.test(page) || /[?&]noad\b/.test(location.search)) return;
  const kindOf = () => (/^(index\.html)?$/.test(page) ? 'home' : /^(matches|match)\.html$/.test(page) ? 'matches' : /^(news|article)\.html$/.test(page) ? 'news' : /^(store|product)\.html$/.test(page) ? 'store' : 'other');
  const rd = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const wr = (k, v) => { try { localStorage.setItem(k, v); } catch { /* اختياري */ } };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const ytId = (u) => { const m = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/); return m ? m[1] : ''; };

  const CSS = `
  .yad-back{position:fixed;inset:0;z-index:9990;display:grid;place-items:center;padding:18px;background:radial-gradient(100% 70% at 50% 40%,rgba(198,255,61,.10),rgba(0,0,0,.55));backdrop-filter:blur(8px) saturate(1.3);-webkit-backdrop-filter:blur(8px) saturate(1.3);opacity:0;transition:opacity .35s}
  .yad-back.in{opacity:1}
  .yad{position:relative;width:min(400px,100%);max-height:92vh;border-radius:28px;overflow:hidden;color:#fff;background:linear-gradient(165deg,rgba(28,32,22,.62),rgba(10,12,8,.55));border:1px solid rgba(255,255,255,.3);
    backdrop-filter:blur(24px) saturate(1.8);-webkit-backdrop-filter:blur(24px) saturate(1.8);box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.45);transform:translateY(24px) scale(.94);transition:transform .45s cubic-bezier(.2,.9,.25,1)}
  .yad-back.in .yad{transform:none}
  .yad-top{position:absolute;z-index:3;inset:12px 12px auto 12px;display:flex;justify-content:space-between;align-items:center;pointer-events:none}
  .yad-tag{pointer-events:auto;font:800 11px Cairo,Arial,sans-serif;padding:5px 11px;border-radius:999px;background:rgba(0,0,0,.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.25)}
  .yad-x,.yad-snd{pointer-events:auto;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;cursor:pointer;display:grid;place-items:center;padding:0}
  .yad-x svg,.yad-snd svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
  .yad-media{position:relative;background:#000;display:block;width:100%;aspect-ratio:4/5;max-height:62vh}
  .yad-media img,.yad-media video,.yad-media iframe{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0;display:block}
  .yad-media::after{content:"";position:absolute;inset:auto 0 0 0;height:90px;background:linear-gradient(transparent,rgba(0,0,0,.55));pointer-events:none}
  .yad-bar{position:absolute;z-index:3;inset:auto 0 0 0;height:3px;background:rgba(255,255,255,.18)}.yad-bar i{display:block;height:100%;width:0;background:#c6ff3d}
  .yad-body{padding:14px 16px 16px;display:grid;gap:10px;text-align:center}
  .yad .yad-t{color:#fff;margin:0;font:900 17px/1.5 Cairo,Arial,sans-serif}
  .yad .yad-cta{display:block;text-align:center;min-height:50px;line-height:50px;border-radius:16px;background:linear-gradient(145deg,#d9ff6b,#b4f02a);color:#0b1200;font:900 16px Cairo,Arial,sans-serif;text-decoration:none;box-shadow:0 10px 26px rgba(198,255,61,.3),inset 0 1px 0 rgba(255,255,255,.55)}
  .yad .yad-skip{background:none;border:0;color:rgba(255,255,255,.8);font:700 13px Cairo,Arial,sans-serif;cursor:pointer;padding:4px}
  @media(prefers-reduced-motion:reduce){.yad,.yad-back{transition:none}}`;
  const I = {
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    on: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    off: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  };

  async function pick() {
    const db = window.yrSupabase; if (!db) return null;
    const { data, error } = await db.from('site_ads').select('*').eq('active', true).order('created_at', { ascending: false }).limit(20);
    if (error || !data) return null;
    const now = Date.now(); const here = kindOf();
    const ok = data.filter((a) => (!a.starts_at || new Date(a.starts_at) <= now) && (!a.ends_at || new Date(a.ends_at) > now) && (a.pages === 'all' || a.pages === here) && https(a.media_url));
    const fresh = ok.filter((a) => { const t = Number(rd('yr-ad:' + a.id) || 0); return !t || Date.now() - t >= a.frequency_hours * 36e5; });
    return fresh.length ? fresh[Math.floor(Math.random() * fresh.length)] : null;
  }

  function show(a) {
    if (document.querySelector('.yrnp') || document.querySelector('.yad-back')) return false; // نافذة الإشعارات مفتوحة
    if (!document.getElementById('yad-css')) { const s = document.createElement('style'); s.id = 'yad-css'; s.textContent = CSS; document.head.appendChild(s); }
    const db = window.yrSupabase; const link = https(a.link_url);
    const yt = a.media_type === 'youtube' ? ytId(a.media_url) : '';
    let media = '';
    if (a.media_type === 'video') media = `<video src="${esc(https(a.media_url))}" ${https(a.poster_url) ? `poster="${esc(https(a.poster_url))}"` : ''} autoplay muted loop playsinline preload="auto"></video>`;
    else if (yt) media = `<iframe src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media" title="${esc(a.title)}"></iframe>`;
    else media = `<img src="${esc(https(a.media_url))}" alt="${esc(a.title)}">`;
    const back = document.createElement('div'); back.className = 'yad-back';
    back.innerHTML = `<div class="yad" role="dialog" aria-modal="true" aria-label="إعلان">
      <div class="yad-top"><span class="yad-tag">إعلان</span><span style="display:flex;gap:8px">${a.media_type === 'video' ? `<button class="yad-snd" type="button" aria-label="تشغيل الصوت">${I.off}</button>` : ''}<button class="yad-x" type="button" aria-label="إغلاق">${I.x}</button></span></div>
      <div class="yad-media">${media}</div>
      <div class="yad-body"><p class="yad-t">${esc(a.title)}</p>${link ? `<a class="yad-cta" href="${esc(link)}" target="_blank" rel="noopener sponsored">${esc(a.cta_text || 'اعرف أكتر')}</a>` : ''}<button class="yad-skip" type="button">إغلاق الإعلان</button></div></div>`;
    document.body.append(back); requestAnimationFrame(() => requestAnimationFrame(() => back.classList.add('in')));
    wr('yr-ad:' + a.id, String(Date.now()));
    try { db.rpc('ad_track', { p_id: a.id, p_kind: 'view' }); } catch { /* اختياري */ }
    const close = () => { back.classList.remove('in'); document.removeEventListener('keydown', key); setTimeout(() => back.remove(), 350); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key);
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('.yad-x,.yad-skip')) close(); });
    const cta = back.querySelector('.yad-cta'); if (cta) cta.addEventListener('click', () => { try { db.rpc('ad_track', { p_id: a.id, p_kind: 'click' }); } catch { /* اختياري */ } });
    const snd = back.querySelector('.yad-snd'); const v = back.querySelector('video');
    if (snd && v) snd.addEventListener('click', () => { v.muted = !v.muted; snd.innerHTML = v.muted ? I.off : I.on; snd.setAttribute('aria-label', v.muted ? 'تشغيل الصوت' : 'كتم الصوت'); });
    return true;
  }

  const start = async () => {
    try {
      let tries = 0; while (!window.yrSupabase && tries++ < 20) await new Promise((r) => setTimeout(r, 300));
      const a = await pick(); if (!a) return;
      setTimeout(() => { if (document.hidden) { document.addEventListener('visibilitychange', function f() { if (!document.hidden) { document.removeEventListener('visibilitychange', f); show(a); } }); } else show(a); }, Math.max(0, a.delay_seconds) * 1000);
    } catch (e) { console.error('ads', e); }
  };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();

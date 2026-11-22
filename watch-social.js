/* يلا رياضة — تفاعلات وتعليقات شاشة المشاهدة (Supabase: match_reactions / match_saves / match_comments / comment_likes / comment_reports) */
(function () {
  'use strict';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const S = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    like: S('<path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.6 9H19a2 2 0 011.96 2.4l-1.3 6.5A2 2 0 0117.7 19H7"/>'),
    dis: S('<path d="M17 13V4h3v9zM17 13l-4 7c-1.5 0-2.5-1-2.2-2.6l.6-2.4H5a2 2 0 01-1.96-2.4l1.3-6.5A2 2 0 016.3 5H17"/>'),
    share: S('<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 15V3M7.5 7.5L12 3l4.5 4.5"/>'),
    save: S('<path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/>'),
    eye: S('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    dots: S('<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>'),
  };
  const num = (n) => { n = Number(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n); };
  const ago = (d) => { const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return 'الآن'; const m = s / 60; if (m < 60) return `منذ ${Math.floor(m)} د`; const h = m / 60; if (h < 24) return `منذ ${Math.floor(h)} س`; const dd = h / 24; if (dd < 30) return `منذ ${Math.floor(dd)} يوم`; return new Date(d).toLocaleDateString('ar-EG'); };
  const avatar = (name, url) => { const u = (() => { try { const x = new URL(url || ''); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } })(); return `<span class="wsc-av">${u ? `<img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : esc(String(name || '؟').trim().charAt(0).toUpperCase())}</span>`; };
  const deviceKey = () => { try { let k = localStorage.getItem('yr-dk'); if (!k) { k = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem('yr-dk', k); } return k; } catch { return ''; } };

  function mount(host, ctx) {
    const { db, fixtureId, signedIn, userId } = ctx; const fid = Number(fixtureId);
    let counts = { likes: 0, dislikes: 0, views: 0, comments: 0, mine: null, saved: false };
    let sort = 'new'; let list = []; let offset = 0; let more = false; let busy = false; let dead = false; const PAGE = 12;
    host.innerHTML = `<div class="wsc-react" id="wsc-react"></div>
      <section class="wsc"><div class="wsc-h"><h3>التعليقات <span id="wsc-n">0</span></h3><div class="wsc-sort" role="tablist"><button type="button" data-s="new" class="on">الأحدث</button><button type="button" data-s="top">الأكثر إعجابًا</button></div></div>
      <div class="wsc-new" id="wsc-new"></div><div id="wsc-list" class="wsc-list"></div><button type="button" class="wsc-more" id="wsc-more" hidden>عرض المزيد من التعليقات</button><p class="wsc-empty" id="wsc-empty" hidden>لا توجد تعليقات بعد. كن أول من يعلّق!</p></section>`;
    const $ = (s) => host.querySelector(s);
    const toast = (t) => { let el = document.querySelector('.wsc-toast'); if (!el) { el = document.createElement('div'); el.className = 'wsc-toast'; document.body.appendChild(el); } el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2400); };
    const needLogin = () => { toast('سجّل دخولك أولًا للتفاعل'); };

    /* ---------- التفاعلات ---------- */
    const drawReact = () => {
      const m = counts.mine;
      $('#wsc-react').innerHTML = `<button type="button" data-r="like" class="${m === 'like' ? 'on' : ''}" aria-pressed="${m === 'like'}">${I.like}<span>${num(counts.likes)}</span></button>
        <button type="button" data-r="dislike" class="${m === 'dislike' ? 'on' : ''}" aria-pressed="${m === 'dislike'}" aria-label="عدم إعجاب">${I.dis}<span>${counts.dislikes ? num(counts.dislikes) : ''}</span></button>
        <button type="button" data-r="share">${I.share}<span>مشاركة</span></button>
        <button type="button" data-r="save" class="${counts.saved ? 'on' : ''}" aria-pressed="${counts.saved}">${I.save}<span>${counts.saved ? 'تم الحفظ' : 'حفظ'}</span></button>
        <span class="wsc-views">${I.eye}${num(counts.views)}</span>`;
      const n = $('#wsc-n'); if (n) n.textContent = num(counts.comments);
    };
    const loadCounts = async () => { try { const r = await db.rpc('watch_counts', { p_fixture: fid }); if (!r.error && r.data) { counts = { ...counts, ...r.data }; drawReact(); } } catch (e) { console.error('counts:', e); } };
    drawReact();
    $('#wsc-react').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-r]'); if (!b) return; const k = b.dataset.r;
      if (k === 'share') {
        const url = ctx.shareUrl || location.href; const data = { title: ctx.title, text: ctx.title, url };
        try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(url); toast('تم نسخ رابط المباراة'); } } catch (_) { /* إلغاء */ }
        return;
      }
      if (!signedIn) return needLogin();
      if (b.disabled) return; b.disabled = true;
      try {
        if (k === 'save') {
          const on = !counts.saved; counts.saved = on; drawReact();
          const r = on ? await db.from('match_saves').insert({ fixture_id: fid }) : await db.from('match_saves').delete().eq('fixture_id', fid).eq('user_id', userId);
          if (r.error && !/duplicate/i.test(r.error.message || '')) { counts.saved = !on; drawReact(); toast('تعذّر الحفظ'); } else toast(on ? 'تم حفظ المباراة' : 'تمت إزالة الحفظ');
        } else {
          const prev = counts.mine; const next = prev === k ? null : k;
          if (prev === 'like') counts.likes--; if (prev === 'dislike') counts.dislikes--;
          if (next === 'like') counts.likes++; if (next === 'dislike') counts.dislikes++; counts.mine = next; drawReact();
          const r = next ? await db.from('match_reactions').upsert({ fixture_id: fid, user_id: userId, reaction_type: next }, { onConflict: 'user_id,fixture_id' }) : await db.from('match_reactions').delete().eq('fixture_id', fid).eq('user_id', userId);
          if (r.error) { toast('تعذّر تسجيل التفاعل'); loadCounts(); }
        }
      } catch (err) { console.error('react:', err); loadCounts(); }
      const nb = $('#wsc-react') && $(`#wsc-react [data-r="${k}"]`); if (nb) nb.disabled = false;
    });

    /* ---------- التعليقات ---------- */
    const row = (c, isReply) => {
      const own = signedIn && c.user_id === userId;
      return `<article class="wsc-c${isReply ? ' rp' : ''}" data-id="${esc(c.id)}">${avatar(c.author_name, c.author_avatar)}<div class="wsc-b">
        <div class="wsc-m"><b>${esc(c.author_name || 'مشجع')}</b><time>${ago(c.created_at)}${c.updated_at && new Date(c.updated_at) - new Date(c.created_at) > 2000 ? ' · تم التعديل' : ''}</time></div>
        <p class="wsc-t">${esc(c.content)}</p>
        <div class="wsc-a"><button type="button" data-c="like" class="${c.liked ? 'on' : ''}" aria-pressed="${Boolean(c.liked)}">${I.like}<span>${Number(c.like_count) ? num(c.like_count) : ''}</span></button>
          ${isReply ? '' : '<button type="button" data-c="reply" class="tx">رد</button>'}
          <span class="wsc-dd"><button type="button" data-c="menu" class="ic" aria-label="المزيد">${I.dots}</button><span class="wsc-menu" hidden>${own ? '<button type="button" data-c="edit">تعديل</button><button type="button" data-c="del">حذف</button>' : '<button type="button" data-c="report">إبلاغ</button>'}</span></span></div>
        <div class="wsc-slot"></div>
        ${isReply || !Number(c.reply_count) ? '' : `<button type="button" class="wsc-rv" data-c="replies" data-n="${Number(c.reply_count)}">عرض ${Number(c.reply_count)} ${Number(c.reply_count) === 1 ? 'رد' : 'ردود'}</button><div class="wsc-reps"></div>`}
      </div></article>`;
    };
    const form = (opts) => {
      if (!signedIn) return `<button type="button" class="wsc-login" data-yr-login>سجّل دخولك لإضافة تعليق</button>`;
      return `<form class="wsc-f"><textarea maxlength="1000" rows="${opts.rows || 1}" placeholder="${esc(opts.ph)}" aria-label="${esc(opts.ph)}">${esc(opts.val || '')}</textarea><div class="wsc-fa"><span class="wsc-cnt"></span>${opts.cancel ? '<button type="button" class="wsc-x" data-f="cancel">إلغاء</button>' : ''}<button type="submit" class="wsc-s" disabled>${esc(opts.btn)}</button></div></form>`;
    };
    const wireForm = (f, onSend) => {
      if (!f) return; const t = f.querySelector('textarea'); const s = f.querySelector('.wsc-s'); const cnt = f.querySelector('.wsc-cnt');
      const fit = () => { t.style.height = 'auto'; t.style.height = Math.min(160, t.scrollHeight) + 'px'; const n = t.value.trim().length; s.disabled = n < 1; cnt.textContent = t.value.length > 800 ? `${t.value.length}/1000` : ''; };
      t.addEventListener('input', fit); fit();
      f.addEventListener('submit', async (e) => { e.preventDefault(); const v = t.value.trim(); if (!v || s.disabled) return; s.disabled = true; const ok = await onSend(v); if (ok) { t.value = ''; fit(); } else s.disabled = false; });
      return t;
    };
    const errMsg = (e) => { const m = String(e?.message || ''); if (/rate|كثير|too many/i.test(m)) return 'استنى شوية قبل ما تكتب تعليق جديد'; if (/dup|مكرر|نفس/i.test(m)) return 'التعليق ده اتكتب قبل كده'; return 'تعذّر إرسال التعليق'; };
    const send = async (content, parent) => {
      const r = await db.from('match_comments').insert({ fixture_id: fid, user_id: userId, content, parent_comment_id: parent || null });
      if (r.error) { toast(errMsg(r.error)); return false; } return true;
    };
    $('#wsc-new').innerHTML = form({ ph: 'أضف تعليقًا…', btn: 'تعليق' });
    wireForm($('#wsc-new .wsc-f'), async (v) => { if (!(await send(v))) return false; counts.comments++; drawReact(); await reload(); return true; });

    const fetchPage = async (parent, off, lim) => { const r = await db.rpc('watch_comments', { p_fixture: fid, p_sort: sort, p_limit: lim, p_offset: off, p_parent: parent || null }); if (r.error) throw r.error; return r.data || []; };
    const draw = () => {
      const L = $('#wsc-list'); L.innerHTML = list.map((c) => row(c, false)).join('');
      $('#wsc-empty').hidden = list.length > 0; $('#wsc-more').hidden = !more;
    };
    const reload = async () => { offset = 0; try { const d = await fetchPage(null, 0, PAGE); list = d; offset = d.length; more = d.length === PAGE; draw(); } catch (e) { console.error('comments:', e); $('#wsc-empty').hidden = false; $('#wsc-empty').textContent = 'تعذّر تحميل التعليقات'; } };
    $('#wsc-more').addEventListener('click', async () => { if (busy) return; busy = true; try { const d = await fetchPage(null, offset, PAGE); list = list.concat(d); offset += d.length; more = d.length === PAGE; draw(); } catch (e) { toast('تعذّر تحميل المزيد'); } busy = false; });
    host.querySelector('.wsc-sort').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (!b || b.dataset.s === sort) return; sort = b.dataset.s; host.querySelectorAll('.wsc-sort button').forEach((x) => x.classList.toggle('on', x === b)); reload(); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.wsc-dd')) host.querySelectorAll('.wsc-menu').forEach((m) => { m.hidden = true; }); });

    const findC = (el) => el.closest('.wsc-c');
    const getObj = (id) => list.find((x) => x.id === id) || Object.values(repCache).flat().find((x) => x.id === id);
    const repCache = {};
    const showReplies = async (art, id, btn) => {
      const box = art.querySelector('.wsc-reps');
      if (box.dataset.open === '1') { box.dataset.open = '0'; box.innerHTML = ''; btn.textContent = `عرض ${btn.dataset.n} ${btn.dataset.n === '1' ? 'رد' : 'ردود'}`; return; }
      btn.disabled = true;
      try { const d = await fetchPage(id, 0, 50); repCache[id] = d; box.innerHTML = d.map((x) => row(x, true)).join(''); box.dataset.open = '1'; btn.textContent = 'إخفاء الردود'; } catch { toast('تعذّر تحميل الردود'); }
      btn.disabled = false;
    };
    host.querySelector('#wsc-list').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-c],[data-f]'); if (!b) return; const art = findC(b); if (!art) return; const id = art.dataset.id; const k = b.dataset.c;
      if (k === 'menu') { const m = b.parentElement.querySelector('.wsc-menu'); const o = m.hidden; host.querySelectorAll('.wsc-menu').forEach((x) => { x.hidden = true; }); m.hidden = !o; return; }
      host.querySelectorAll('.wsc-menu').forEach((x) => { x.hidden = true; });
      if (k === 'replies') return showReplies(art, id, b);
      if (k === 'like') {
        if (!signedIn) return needLogin(); const c = getObj(id); if (!c || b.disabled) return; b.disabled = true;
        const on = !c.liked; c.liked = on; c.like_count = Math.max(0, Number(c.like_count) + (on ? 1 : -1));
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.querySelector('span').textContent = c.like_count ? num(c.like_count) : '';
        const r = on ? await db.from('comment_likes').insert({ comment_id: id, user_id: userId }) : await db.from('comment_likes').delete().eq('comment_id', id).eq('user_id', userId);
        if (r.error && !/duplicate/i.test(r.error.message || '')) { c.liked = !on; c.like_count = Math.max(0, Number(c.like_count) + (on ? -1 : 1)); b.classList.toggle('on', !on); b.querySelector('span').textContent = c.like_count ? num(c.like_count) : ''; toast('تعذّر تسجيل الإعجاب'); }
        b.disabled = false; return;
      }
      const slot = art.querySelector('.wsc-slot');
      if (k === 'reply') {
        if (!signedIn) return needLogin(); if (slot.firstChild) { slot.innerHTML = ''; return; }
        slot.innerHTML = form({ ph: 'اكتب ردًا…', btn: 'رد', cancel: true });
        const t = wireForm(slot.querySelector('form'), async (v) => { if (!(await send(v, id))) return false; counts.comments++; drawReact(); const c = getObj(id); if (c) c.reply_count = Number(c.reply_count) + 1; await reloadKeep(art, id); return true; });
        slot.querySelector('[data-f="cancel"]').addEventListener('click', () => { slot.innerHTML = ''; }); t && t.focus(); return;
      }
      if (k === 'edit') {
        const c = getObj(id); const tx = art.querySelector(':scope > .wsc-b > .wsc-t'); const orig = c ? c.content : tx.textContent;
        slot.innerHTML = form({ ph: 'عدّل تعليقك', btn: 'حفظ', cancel: true, val: orig, rows: 2 });
        const t = wireForm(slot.querySelector('form'), async (v) => { const r = await db.from('match_comments').update({ content: v }).eq('id', id).eq('user_id', userId); if (r.error) { toast('تعذّر حفظ التعديل'); return false; } if (c) { c.content = v; c.updated_at = new Date().toISOString(); } tx.textContent = v; slot.innerHTML = ''; toast('تم تعديل التعليق'); return true; });
        slot.querySelector('[data-f="cancel"]').addEventListener('click', () => { slot.innerHTML = ''; }); t && t.focus(); return;
      }
      if (k === 'del') {
        if (!confirm('حذف التعليق نهائيًا؟')) return; const r = await db.from('match_comments').delete().eq('id', id).eq('user_id', userId);
        if (r.error) return toast('تعذّر الحذف'); toast('تم حذف التعليق'); await loadCounts(); await reload(); return;
      }
      if (k === 'report') {
        if (!signedIn) return needLogin(); const r = await db.from('comment_reports').insert({ comment_id: id, user_id: userId, reason: '' });
        toast(r.error && !/duplicate/i.test(r.error.message || '') ? 'تعذّر إرسال البلاغ' : 'تم إرسال البلاغ، شكرًا لك'); return;
      }
    });
    const reloadKeep = async (art, id) => { // بعد رد جديد: نحدّث عدّاد الردود ونفتح قائمة الردود
      const slot = art.querySelector('.wsc-slot'); if (slot) slot.innerHTML = '';
      const c = getObj(id); const n = c ? Number(c.reply_count) : 1;
      let rv = art.querySelector('.wsc-rv'); let box = art.querySelector('.wsc-reps');
      if (!rv) { rv = document.createElement('button'); rv.type = 'button'; rv.className = 'wsc-rv'; rv.dataset.c = 'replies'; box = document.createElement('div'); box.className = 'wsc-reps'; art.querySelector('.wsc-b').append(rv, box); }
      rv.dataset.n = String(n); box.dataset.open = '0'; await showReplies(art, id, rv);
    };

    // تسجيل مشاهدة (مرة/ساعة لكل مستخدم أو جهاز) ثم تحميل العدّادات والتعليقات
    (async () => { try { await db.rpc('record_view', { p_fixture: fid, p_key: signedIn ? '' : deviceKey() }); } catch (_) { /* */ } if (!dead) { await loadCounts(); } })();
    reload();
    return { stop() { dead = true; } };
  }
  window.yrWatchSocial = { mount };
})();

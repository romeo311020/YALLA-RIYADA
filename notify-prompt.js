/* يلا رياضة — طلب تفعيل الإشعارات أول ما المستخدم يدخل الموقع/التطبيق.
   - بيظهر مرة واحدة بشكل لطيف (نافذة من تحت) ومعاه زرار "فعّل". لو قال "مش دلوقتي" بنسأله تاني بعد 3 أيام.
   - لو الجهاز اشترك وهو مش مسجّل دخول، الاشتراك بيتربط بحسابه أوتوماتيك أول ما يسجّل.
   - بيعرّض window.yrPush { state, enable, sync, ask } وبيطلق حدث yr-push-change.
   لا يظهر في: لوحة التحكم، استعادة كلمة المرور، صفحة الإشعارات. */
(() => {
  'use strict';
  if (window.yrPush) return;

  const SNOOZE_KEY = 'yr-np-snooze';
  const SNOOZE_DAYS = 3;
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const NO_AUTO = /^(admin|password-reset|notifications)\.html$/.test(page);
  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* اختياري */ } };
  const emit = () => { try { document.dispatchEvent(new CustomEvent('yr-push-change')); } catch { /* اختياري */ } };
  const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
  const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]);

  /* ---------- عميل Supabase (لو الصفحة ما حمّلتوش) ---------- */
  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  async function getDb() {
    try {
      if (window.yrSupabase) return window.yrSupabase;
      if (!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4');
      if (!window.YR_SUPABASE_URL) await loadScript('supabase-config.js');
      if (!window.yrSupabase) await loadScript('supabase-client.js');
      return window.yrSupabase || null;
    } catch { return null; }
  }
  async function getUser(db) { try { const { data } = await db.auth.getSession(); return data?.session?.user || null; } catch { return null; } }
  async function currentSub() {
    if (!supported) return null;
    const reg = await withTimeout(navigator.serviceWorker.ready, 4000);
    if (!reg) return null;
    try { return await reg.pushManager.getSubscription(); } catch { return null; }
  }
  async function vapidKey(db) {
    try { const { data } = await db.from('site_settings').select('value').eq('key', 'vapid_public').maybeSingle(); return typeof data?.value === 'string' ? data.value : ''; } catch { return ''; }
  }

  /* ---------- ربط الاشتراك بحساب المستخدم ---------- */
  const synced = new Set();
  async function attach(db, user, sub) {
    if (!db || !user || !sub) return false;
    const j = sub.toJSON(); if (!j.endpoint || !j.keys) return false;
    const tag = user.id + '|' + j.endpoint; if (synced.has(tag)) return true;
    const { error } = await db.from('push_subscriptions').upsert({ user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: ua.slice(0, 200) }, { onConflict: 'endpoint' });
    if (error) return false;
    synced.add(tag); return true;
  }

  async function state() {
    if (!supported) return isIOS && !standalone() ? 'ios-install' : 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    const sub = await currentSub();
    return Notification.permission === 'granted' && sub ? 'on' : 'off';
  }

  /* يُستدعى من ضغطة مستخدم (شرط المتصفحات/iOS). بيرجع { ok, needLogin, msg } */
  async function enable() {
    if (!supported) return { ok: false, msg: isIOS && !standalone() ? 'على الآيفون: ثبّت التطبيق على الشاشة الرئيسية الأول (مشاركة ← إضافة إلى الشاشة الرئيسية) وبعدين فعّل الإشعارات.' : 'المتصفح ده مش بيدعم الإشعارات.' };
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission(); // لازم أول خطوة (قبل أي انتظار) علشان ضغطة المستخدم تفضل صالحة
    if (perm !== 'granted') { emit(); return { ok: false, denied: perm === 'denied', msg: perm === 'denied' ? 'الإشعارات محظورة. فعّلها من إعدادات المتصفح (قفل العنوان ← الإشعارات ← سماح).' : 'لم يتم السماح بالإشعارات.' }; }
    const db = await getDb();
    if (!db) return { ok: false, msg: 'الخدمة غير جاهزة دلوقتي. حاول بعد شوية.' };
    const key = await vapidKey(db);
    if (!key) return { ok: false, msg: 'الإشعارات لسه ما اتجهزتش من السيرفر.' };
    try {
      const reg = await withTimeout(navigator.serviceWorker.ready, 6000);
      if (!reg) return { ok: false, msg: 'تعذّر تجهيز التطبيق للإشعارات. حدّث الصفحة وحاول تاني.' };
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
      const user = await getUser(db);
      if (!user) { emit(); return { ok: true, needLogin: true }; }
      const saved = await attach(db, user, sub);
      emit();
      return saved ? { ok: true } : { ok: false, msg: 'اشتغلت على الجهاز بس تعذّر ربطها بحسابك. حاول تاني.' };
    } catch (e) { return { ok: false, msg: 'تعذّر التفعيل: ' + (e && e.message ? e.message : e) }; }
  }

  /* مزامنة هادئة في كل صفحة: لو الإذن متاح، نربط/نجدد الاشتراك بالحساب */
  let syncing = false;
  async function sync() {
    if (!supported || Notification.permission !== 'granted' || syncing) return; syncing = true;
    try {
      const db = await getDb(); if (!db) return;
      const user = await getUser(db); if (!user) return;
      let sub = await currentSub();
      if (!sub) { // الإذن موجود بس الاشتراك اتمسح: نجدده بدون ما نسأل
        const key = await vapidKey(db); const reg = await withTimeout(navigator.serviceWorker.ready, 4000);
        if (key && reg) { try { sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }); } catch { /* تجاهل */ } }
      }
      if (sub && await attach(db, user, sub)) emit();
    } finally { syncing = false; }
  }

  /* ---------- النافذة ---------- */
  const CSS = `
  .yrnp-back{position:fixed;inset:0;z-index:9998;background:radial-gradient(110% 60% at 50% 100%,rgba(198,255,61,.10),rgba(0,0,0,.28));backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;transition:opacity .3s}
  .yrnp{position:fixed;z-index:9999;inset-inline:0;bottom:0;margin-inline:auto;width:min(460px,100%);padding:30px 22px calc(22px + env(safe-area-inset-bottom));border-radius:32px 32px 0 0;color:var(--text,#fff);text-align:center;overflow:hidden;
    background:linear-gradient(165deg,rgba(255,255,255,.13),rgba(255,255,255,.04) 50%,rgba(255,255,255,.07));border:1px solid rgba(255,255,255,.28);border-bottom:0;
    backdrop-filter:blur(26px) saturate(1.9) brightness(1.05);-webkit-backdrop-filter:blur(26px) saturate(1.9) brightness(1.05);box-shadow:0 -20px 70px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.45),inset 0 0 40px rgba(255,255,255,.03);
    transform:translateY(105%);transition:transform .42s cubic-bezier(.2,.9,.25,1)}
  .yrnp::before{content:"";position:absolute;inset-inline:0;top:0;height:120px;background:radial-gradient(60% 100% at 50% 0,rgba(198,255,61,.28),transparent);pointer-events:none}
  .yrnp::after{content:"";position:absolute;top:9px;left:50%;width:42px;height:4px;margin-left:-21px;border-radius:4px;background:rgba(255,255,255,.35)}
  .yrnp>*{position:relative}
  .yrnp.in{transform:none}.yrnp-back.in{opacity:1}
  @media(min-width:640px){.yrnp{bottom:auto;top:50%;border:1px solid rgba(255,255,255,.22);border-radius:32px;transform:translateY(-40%) scale(.96);opacity:0;transition:transform .3s,opacity .3s}.yrnp.in{transform:translateY(-50%);opacity:1}}
  .yrnp-ico{position:relative;width:76px;height:76px;margin:6px auto 16px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.35),rgba(198,255,61,.18) 55%,rgba(198,255,61,.08));color:#c6ff3d;border:1px solid rgba(255,255,255,.35);box-shadow:0 10px 34px rgba(198,255,61,.25),inset 0 1px 0 rgba(255,255,255,.6)}
  .yrnp-ico svg{width:38px;height:38px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .yrnp-ico.bad{background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.3),rgba(255,120,120,.14));color:#ff8a8a;box-shadow:0 10px 30px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.3)}
  .yrnp-ico::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(198,255,61,.55);animation:yrnpPulse 2s infinite}
  .yrnp-ico.bad::after{border-color:rgba(255,138,138,.4)}
  @keyframes yrnpPulse{0%{transform:scale(.92);opacity:.7}100%{transform:scale(1.2);opacity:0}}
  .yrnp h3{margin:0 0 8px;font-size:21px;font-weight:900;line-height:1.4;text-shadow:0 1px 12px rgba(0,0,0,.25)}
  .yrnp p{margin:0 0 16px;color:var(--muted,#b6b6b6);font-size:14.5px;line-height:1.8}
  .yrnp ul,.yrnp ol{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:8px;text-align:start;counter-reset:s}
  .yrnp li{display:flex;gap:12px;align-items:center;padding:11px 13px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-size:13.5px;font-weight:700;line-height:1.6}
  .yrnp li svg{width:22px;height:22px;flex:none;fill:none;stroke:var(--acc,#c6ff3d);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .yrnp ol li{counter-increment:s}.yrnp ol li::before{content:counter(s);flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--acc,#c6ff3d);color:#0b1200;font-weight:900;font-size:13px}
  .yrnp-btn{display:block;width:100%;min-height:52px;border-radius:16px;border:0;background:linear-gradient(145deg,#d9ff6b,#b4f02a);color:#0b1200;font:900 16px Cairo,Arial,sans-serif;cursor:pointer;text-decoration:none;line-height:52px;text-align:center;box-shadow:0 10px 26px rgba(198,255,61,.3),inset 0 1px 0 rgba(255,255,255,.55);transition:transform .15s}
  .yrnp-btn:active{transform:scale(.98)}
  .yrnp-btn:disabled{opacity:.6}
  .yrnp-btn.ghost{margin-top:8px;background:transparent;box-shadow:none;color:var(--muted,#b6b6b6);font-weight:700;font-size:14px;min-height:42px;line-height:42px}
  .yrnp-btn.alt{background:rgba(255,255,255,.1);box-shadow:none;color:var(--text,#fff);border:1px solid rgba(255,255,255,.2);margin-top:8px}
  .yrnp-note{margin:12px 0 0!important;font-size:12.5px!important}
  [data-theme=light] .yrnp{background:linear-gradient(160deg,rgba(255,255,255,.85),rgba(255,255,255,.55) 50%,rgba(198,255,61,.18));border-color:rgba(255,255,255,.9);box-shadow:0 -30px 80px rgba(0,0,0,.18),inset 0 1px 0 #fff}
  [data-theme=light] .yrnp li{background:rgba(255,255,255,.7);border-color:rgba(0,0,0,.06)}
  [data-theme=light] .yrnp li svg{stroke:#2f6b00}
  [data-theme=light] .yrnp::after{background:rgba(0,0,0,.2)}
  `;
  const SV = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    bell: SV('<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    off: SV('<path d="M6 9a6 6 0 0 1 9.5-4.8M18 9c0 3 .6 4.9 1.3 6"/><path d="M3.5 16.5H15M10 20a2 2 0 0 0 4 0M3 3l18 18"/>'),
    check: SV('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    ball: SV('<circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.5 2.5-1.3 4.2H9.8L8.5 10zM12 3v4.5M3.8 9.5L8.5 10M20.2 9.5L15.5 10M9.8 14.2L7 18.6M14.2 14.2L17 18.6"/>'),
    news: SV('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
    gift: SV('<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M3 9h18M12 9c-3 0-4.5-1-4.5-2.5S9 4 12 9c3-5 4.5-3.5 4.5-2S15 9 12 9z"/>'),
    phone: SV('<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>'),
  };
  let box = null; let back = null;
  function close(snooze) {
    if (snooze) write(SNOOZE_KEY, String(Date.now()));
    if (!box) return; box.classList.remove('in'); back.classList.remove('in');
    const b = box, k = back; box = back = null; setTimeout(() => { b.remove(); k.remove(); }, 350);
  }
  function open(html) {
    if (!document.getElementById('yrnp-css')) { const s = document.createElement('style'); s.id = 'yrnp-css'; s.textContent = CSS; document.head.appendChild(s); }
    if (box) { box.innerHTML = html; return box; }
    back = document.createElement('div'); back.className = 'yrnp-back'; back.addEventListener('click', () => close(true));
    box = document.createElement('div'); box.className = 'yrnp'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'تفعيل الإشعارات');
    box.innerHTML = html; document.body.append(back, box);
    requestAnimationFrame(() => requestAnimationFrame(() => { back.classList.add('in'); box.classList.add('in'); }));
    return box;
  }
  const askHtml = `<div class="yrnp-ico" aria-hidden="true">${IC.bell}</div><h3>فعّل الإشعارات واوصلك كل جديد</h3>
    <p>هنبعتلك على جهازك لحظة ما يحصل حاجة تهمّك، من غير ما تفتح الموقع.</p>
    <ul><li>${IC.ball}أهداف وبداية مباريات فرقك ولاعبينك المفضّلين</li><li>${IC.news}آخر الأخبار الرياضية أول بأول</li><li>${IC.gift}عروض وأخبار المتجر</li></ul>
    <button class="yrnp-btn" id="yrnp-go" type="button">فعّل الإشعارات</button><button class="yrnp-btn ghost" id="yrnp-no" type="button">مش دلوقتي</button>`;
  const doneHtml = (r) => r.ok
    ? `<div class="yrnp-ico" aria-hidden="true">${IC.check}</div><h3>تمام! الإشعارات اشتغلت</h3><p>${r.needLogin ? 'سجّل دخولك علشان نربط الإشعارات بحسابك وتوصلك أخبار فرقك.' : 'اختار الفرق واللاعبين اللي تحب نبعتلك عنهم.'}</p>
       ${r.needLogin ? '<a class="yrnp-btn" id="yrnp-login" href="account.html">تسجيل الدخول</a><button class="yrnp-btn ghost" id="yrnp-x" type="button">بعدين</button>' : '<a class="yrnp-btn" href="notifications.html">اختار فرقي ولاعبيني</a><button class="yrnp-btn ghost" id="yrnp-x" type="button">تم</button>'}`
    : `<div class="yrnp-ico bad" aria-hidden="true">${IC.off}</div><h3>مقدرناش نفعّل الإشعارات</h3><p>${r.msg || 'حاول تاني.'}</p><button class="yrnp-btn ghost" id="yrnp-x" type="button">تمام</button>`;

  const infoHtml = (ico, title, text, btn, bad) => `<div class="yrnp-ico${bad ? ' bad' : ''}" aria-hidden="true">${ico}</div><h3>${title}</h3>${text}${btn || ''}<button class="yrnp-btn ghost" id="yrnp-x" type="button">تمام</button>`;
  async function ask() {
    const st = await state();
    if (st === 'on') { location.href = 'notifications.html'; return; }
    if (st === 'denied') { const el = open(infoHtml(IC.off, 'الإشعارات محظورة في المتصفح', '<p>المتصفح حاطط الموقع على «حظر» (غالبًا اتضغط عليها قبل كده). فكّ الحظر بالخطوات دي:</p><ol><li>اضغط على الأيقونة اللي جنب عنوان الموقع فوق</li><li>اختار «الأذونات» أو «إعدادات الموقع» ← «الإشعارات»</li><li>غيّرها لـ «سماح» وحدّث الصفحة</li></ol><p class="yrnp-note">لو الإشعارات متقفلة من إعدادات الموبايل نفسه: الإعدادات ← التطبيقات ← Chrome ← الإشعارات ← تشغيل.</p>', '', true)); el.querySelector('#yrnp-x').addEventListener('click', () => close(false)); return; }
    if (st === 'ios-install') { const el = open(infoHtml(IC.phone, 'ثبّت التطبيق الأول', '<p>على الآيفون: اضغط زر المشاركة ← «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من الشاشة الرئيسية وفعّل الإشعارات من هناك.</p>')); el.querySelector('#yrnp-x').addEventListener('click', () => close(false)); return; }
    if (st === 'unsupported') { const el = open(infoHtml(IC.off, 'المتصفح مش بيدعم الإشعارات', '<p>جرّب Chrome أو ثبّت التطبيق على جهازك.</p>', '', true)); el.querySelector('#yrnp-x').addEventListener('click', () => close(false)); return; }
    const el = open(askHtml);
    el.querySelector('#yrnp-no').addEventListener('click', () => close(true));
    el.querySelector('#yrnp-go').addEventListener('click', async (e) => {
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'ثانية واحدة…';
      const r = await enable();
      const el2 = open(doneHtml(r));
      const login = el2.querySelector('#yrnp-login');
      if (login) login.addEventListener('click', () => { try { localStorage.setItem('yr-next', page + location.search); } catch { /* اختياري */ } });
      const x = el2.querySelector('#yrnp-x'); if (x) x.addEventListener('click', () => close(false));
      if (r.ok && !r.needLogin) setTimeout(() => close(false), 9000);
    });
  }

  async function auto() {
    if (NO_AUTO || !supported) return;
    if (isIOS && !standalone()) return; // الآيفون: الإشعارات بتشتغل بس من التطبيق المثبّت
    if (Notification.permission !== 'default') return;
    const t = Number(read(SNOOZE_KEY) || 0); if (t && Date.now() - t < SNOOZE_DAYS * 864e5) return;
    if (await currentSub()) return;
    ask();
  }

  /* ---------- زر الجرس في الهيدر + شريط تفعيل ثابت لحد ما المستخدم يفعّل ---------- */
  const NO_BAR = /^(admin|password-reset|notifications|account)\.html$/.test(page);
  const BAR_CSS = `
  .yrnp-bar{position:relative;display:flex;align-items:center;gap:12px;margin:10px auto 0;width:calc(100% - 28px);max-width:560px;padding:10px 12px;border-radius:20px;color:var(--text,#fff);font:800 13.5px/1.5 Cairo,Arial,sans-serif;
    background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.04) 60%,rgba(198,255,61,.08));border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(20px) saturate(1.8);-webkit-backdrop-filter:blur(20px) saturate(1.8);box-shadow:0 8px 26px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.4)}
  .yrnp-bar .bi{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.35),rgba(198,255,61,.2));color:#c6ff3d;border:1px solid rgba(255,255,255,.3)}
  .yrnp-bar .bi svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .yrnp-bar .tx{flex:1;min-width:0}
  .yrnp-bar button{border:0;cursor:pointer;font-family:inherit}
  .yrnp-bar .go{flex:none;min-height:36px;padding:0 16px;border-radius:999px;background:rgba(198,255,61,.92);color:#0b1200;font-weight:900;font-size:13px;box-shadow:0 4px 14px rgba(198,255,61,.3),inset 0 1px 0 rgba(255,255,255,.6)}
  .yrnp-bar .x{flex:none;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.12);color:inherit;opacity:.8;font-size:16px;line-height:1}
  [data-theme=light] .yrnp-bar .bi{color:#2f6b00}[data-theme=light] .yrnp-ico{color:#2f6b00}
  [data-theme=light] .yrnp-bar{background:linear-gradient(135deg,rgba(255,255,255,.9),rgba(255,255,255,.6) 55%,rgba(198,255,61,.22));border-color:rgba(255,255,255,.95);box-shadow:0 10px 26px rgba(0,0,0,.1),inset 0 1px 0 #fff}
  [data-theme=light] .yrnp-bar .x{background:rgba(0,0,0,.07)}`;
  let bar = null;
  async function paintUI() {
    const st = await state(); const bell = document.getElementById('bell');
    if (bell) bell.classList.toggle('off', st !== 'on');
    const want = !NO_BAR && st !== 'on' && st !== 'unsupported' && !(st === 'ios-install' && false) && !(() => { try { return sessionStorage.getItem('yr-bar-x'); } catch { return null; } })();
    if (want && !bar) {
      if (!document.getElementById('yrnp-css2')) { const c = document.createElement('style'); c.id = 'yrnp-css2'; c.textContent = BAR_CSS; document.head.appendChild(c); }
      const host = document.getElementById('shared-header'); if (!host) return;
      bar = document.createElement('div'); bar.className = 'yrnp-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'تفعيل الإشعارات');
      bar.innerHTML = `<span class="bi">${IC.bell}</span><span class="tx">فعّل الإشعارات واوصلك كل جديد في المباريات والأخبار</span><button class="go" type="button">فعّل</button><button class="x" type="button" aria-label="إخفاء">×</button>`;
      bar.querySelector('.go').addEventListener('click', () => ask());
      bar.querySelector('.x').addEventListener('click', () => { try { sessionStorage.setItem('yr-bar-x', '1'); } catch { /* اختياري */ } bar.remove(); bar = null; });
      host.after(bar);
    } else if (!want && bar) { bar.remove(); bar = null; }
  }
  function wireBell() { const b = document.getElementById('bell'); if (b && !b.dataset.w) { b.dataset.w = '1'; b.addEventListener('click', () => ask()); } }

  window.yrPush = { state, enable, sync, ask, supported: () => supported };
  wireBell(); paintUI(); document.addEventListener('yr-push-change', paintUI);

  const start = () => { setTimeout(() => { sync().catch(() => {}); }, 900); setTimeout(() => { auto().catch(() => {}); }, 4000); };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);

  // لما المستخدم يسجّل دخول (في أي تاب) نربط اشتراك الجهاز بحسابه
  if (supported && Notification.permission === 'granted') getDb().then((db) => { db?.auth?.onAuthStateChange((_e, session) => { if (session?.user) setTimeout(() => sync().catch(() => {}), 300); }); }).catch(() => {});
})();

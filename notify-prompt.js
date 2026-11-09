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
  .yrnp-back{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);opacity:0;transition:opacity .25s}
  .yrnp{position:fixed;z-index:9999;inset-inline:0;bottom:0;margin-inline:auto;width:min(460px,100%);padding:26px 22px calc(22px + env(safe-area-inset-bottom));border:1px solid var(--line,#2c2c2c);border-bottom:0;border-radius:28px 28px 0 0;background:var(--panel,#111);color:var(--text,#fff);box-shadow:0 -24px 80px rgba(0,0,0,.5);text-align:center;transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.9,.3,1);font-family:Cairo,'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl}
  .yrnp.in{transform:none}.yrnp-back.in{opacity:1}
  @media(min-width:640px){.yrnp{bottom:auto;top:50%;border:1px solid var(--line,#2c2c2c);border-radius:28px;transform:translateY(-40%) scale(.96);opacity:0;transition:transform .28s,opacity .28s}.yrnp.in{transform:translateY(-50%);opacity:1}}
  .yrnp-ico{position:relative;width:74px;height:74px;margin:0 auto 14px;display:grid;place-items:center;border-radius:50%;background:var(--acc,#c6ff3d);font-size:34px}
  .yrnp-ico::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid var(--acc,#c6ff3d);opacity:.5;animation:yrnpPulse 1.8s infinite}
  @keyframes yrnpPulse{0%{transform:scale(.9);opacity:.6}100%{transform:scale(1.25);opacity:0}}
  .yrnp h3{margin:0 0 6px;font-size:22px;font-weight:900}
  .yrnp p{margin:0 0 16px;color:var(--muted,#a3a3a3);font-size:14.5px;line-height:1.8}
  .yrnp ul{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:8px;text-align:start}
  .yrnp li{display:flex;gap:10px;align-items:center;padding:9px 12px;border-radius:12px;background:var(--panel2,#1b1b1b);font-size:13.5px;font-weight:700}
  .yrnp li i{font-style:normal;font-size:18px}
  .yrnp-btn{display:block;width:100%;min-height:50px;border-radius:14px;border:1px solid var(--acc,#c6ff3d);background:var(--acc,#c6ff3d);color:var(--on-acc,#000);font:800 16px Cairo,Arial,sans-serif;cursor:pointer;text-decoration:none;line-height:50px;text-align:center}
  .yrnp-btn:disabled{opacity:.6}
  .yrnp-btn.ghost{margin-top:8px;background:transparent;color:var(--muted,#a3a3a3);border-color:transparent;font-weight:700;font-size:14px;min-height:42px;line-height:42px}
  .yrnp-btn.alt{background:transparent;color:var(--text,#fff);border-color:var(--line,#2c2c2c);margin-top:8px}
  .yrnp-note{margin:12px 0 0!important;font-size:12.5px!important}
  `;
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
  const askHtml = `<div class="yrnp-ico" aria-hidden="true">🔔</div><h3>فعّل الإشعارات واوصلك كل جديد</h3>
    <p>هنبعتلك على جهازك لحظة ما يحصل حاجة تهمّك، من غير ما تفتح الموقع.</p>
    <ul><li><i>⚽</i>أهداف وبداية مباريات فرقك ولاعبينك المفضّلين</li><li><i>📰</i>آخر الأخبار الرياضية أول بأول</li><li><i>🎁</i>عروض وأخبار المتجر</li></ul>
    <button class="yrnp-btn" id="yrnp-go" type="button">فعّل الإشعارات</button><button class="yrnp-btn ghost" id="yrnp-no" type="button">مش دلوقتي</button>`;
  const doneHtml = (r) => r.ok
    ? `<div class="yrnp-ico" aria-hidden="true">✅</div><h3>تمام! الإشعارات اشتغلت</h3><p>${r.needLogin ? 'سجّل دخولك علشان نربط الإشعارات بحسابك وتوصلك أخبار فرقك.' : 'اختار الفرق واللاعبين اللي تحب نبعتلك عنهم.'}</p>
       ${r.needLogin ? '<a class="yrnp-btn" id="yrnp-login" href="account.html">تسجيل الدخول</a><button class="yrnp-btn ghost" id="yrnp-x" type="button">بعدين</button>' : '<a class="yrnp-btn" href="notifications.html">اختار فرقي ولاعبيني</a><button class="yrnp-btn ghost" id="yrnp-x" type="button">تم</button>'}`
    : `<div class="yrnp-ico" aria-hidden="true">🔕</div><h3>مقدرناش نفعّل الإشعارات</h3><p>${r.msg || 'حاول تاني.'}</p><button class="yrnp-btn ghost" id="yrnp-x" type="button">تمام</button>`;

  function ask() {
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

  window.yrPush = { state, enable, sync, ask, supported: () => supported };

  const start = () => { setTimeout(() => { sync().catch(() => {}); }, 900); setTimeout(() => { auto().catch(() => {}); }, 4000); };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);

  // لما المستخدم يسجّل دخول (في أي تاب) نربط اشتراك الجهاز بحسابه
  if (supported && Notification.permission === 'granted') getDb().then((db) => { db?.auth?.onAuthStateChange((_e, session) => { if (session?.user) setTimeout(() => sync().catch(() => {}), 300); }); }).catch(() => {});
})();

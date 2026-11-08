(() => {
  'use strict';

  const db = window.yrSupabase;
  const $ = (id) => document.getElementById(id);
  const authPanel = $('account-auth');
  const dashboard = $('account-dashboard');
  const loginForm = $('account-form');
  const message = $('account-message');
  const tabs = [$('signin-tab'), $('signup-tab')];
  const nameField = $('name-field');
  const confirmField = $('confirm-field');
  const password = $('password');
  const submit = $('account-submit');
  const googleButton = $('google-signin');
  let mode = 'signin';

  const setMessage = (element, text, isError = false) => {
    element.textContent = text;
    element.classList.toggle('account-message-error', isError);
  };

  const setBusy = (busy, buttons = [submit, googleButton, ...tabs, $('forgot-password')]) => {
    buttons.forEach((button) => { button.disabled = busy; });
  };

  const setMode = (nextMode) => {
    mode = nextMode;
    const signingUp = mode === 'signup';
    nameField.hidden = !signingUp;
    confirmField.hidden = !signingUp;
    $('full-name').required = signingUp;
    $('confirm-password').required = signingUp;
    password.autocomplete = signingUp ? 'new-password' : 'current-password';
    submit.textContent = signingUp ? 'إنشاء حساب' : 'تسجيل الدخول';
    $('account-heading').textContent = signingUp ? 'أنشئ حسابك وابدأ رحلتك' : 'سجّل دخولك إلى حسابك';
    $('forgot-password').hidden = signingUp;
    tabs.forEach((tab, index) => {
      const active = (index === 0 && !signingUp) || (index === 1 && signingUp);
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    setMessage(message, '');
  };

  tabs[0].addEventListener('click', () => setMode('signin'));
  tabs[1].addEventListener('click', () => setMode('signup'));

  if (!db) {
    setMessage(message, 'خدمة الحساب غير مفعّلة بعد. أضف بيانات مشروع Supabase في ملف الإعدادات.', true);
    setBusy(true);
    $('profile-save').disabled = true;
    $('password-save').disabled = true;
    return;
  }

  /* ---------- الملف الشخصي ---------- */
  // ملاحظة: الاسم المعدَّل يُحفظ في display_name (مفتاح خاص بنا) حتى لا يمسحه تسجيل الدخول بجوجل،
  // وصورة جوجل تُقرأ فقط ولا نعدّلها أبدًا.
  let shownUserId = null;
  let editing = false;
  const httpsUrl = (value) => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
  const providersOf = (user) => (user.app_metadata?.providers || [user.app_metadata?.provider]).filter(Boolean);
  const displayNameOf = (user) => {
    const m = user.user_metadata || {};
    return String(m.display_name || m.full_name || m.name || (user.email || '').split('@')[0] || 'مستخدم').trim();
  };
  const setEditing = (on, user) => {
    editing = on;
    $('profile-form').hidden = !on;
    $('profile-actions').hidden = on;
    if (on && user) {
      $('profile-name').value = displayNameOf(user);
      $('profile-email').value = user.email || '';
      $('profile-name').focus();
    }
  };
  let currentUser = null;
  const showUser = (user) => {
    const isSignedIn = Boolean(user);
    authPanel.hidden = isSignedIn;
    dashboard.hidden = !isSignedIn;
    document.querySelector('.account-card')?.classList.toggle('signed-in', isSignedIn);
    if (!user) { shownUserId = null; currentUser = null; setEditing(false); return; }
    currentUser = user;
    try { // العودة للصفحة اللي جاء منها المستخدم (مشغّل/منتج) بعد تسجيل الدخول
      const next = localStorage.getItem('yr-next');
      if (next) { localStorage.removeItem('yr-next'); if (/^[\w.\-]+\.html(\?[\w=&%.\-]*)?$/.test(next) && next !== 'account.html') { location.replace(next); return; } }
    } catch { /* لا مشكلة */ }
    if (shownUserId !== user.id) { shownUserId = user.id; setEditing(false); setMessage($('profile-message'), ''); }

    const name = displayNameOf(user);
    const picture = httpsUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || '');
    const img = $('profile-avatar-img');
    if (picture) { img.src = picture; img.hidden = false; $('profile-initial').hidden = true; }
    else { img.removeAttribute('src'); img.hidden = true; $('profile-initial').hidden = false; }
    $('profile-initial').textContent = name.slice(0, 1).toUpperCase();
    img.onerror = () => { img.hidden = true; $('profile-initial').hidden = false; };
    $('profile-title').textContent = name;
    $('profile-email-text').textContent = user.email || '';
    const providers = providersOf(user);
    $('profile-provider').textContent = providers.includes('google') ? 'حساب Google' : 'حساب بالبريد الإلكتروني';
    $('profile-since').textContent = user.created_at
      ? `عضو منذ ${new Date(user.created_at).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`
      : '';
    const hasPassword = providers.includes('email');
    $('password-block').hidden = !hasPassword;
    $('google-note').hidden = hasPassword;
    $('avatar-note').hidden = !picture;
    if (editing) return; // لا نقاطع المستخدم وهو يكتب
    $('profile-name').value = name;
    $('profile-email').value = user.email || '';

    // هل هو مسؤول؟ (القراءة محمية بسياسات قاعدة البيانات)
    $('profile-admin').hidden = true; $('admin-link').hidden = true;
    db.from('profiles').select('role').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (currentUser?.id === user.id && (data?.role === 'admin' || data?.role === 'editor')) { $('profile-admin').hidden = data.role !== 'admin'; $('admin-link').hidden = false; $('admin-link').querySelector('b').textContent = data.role === 'admin' ? 'لوحة التحكم' : 'لوحة الأخبار'; }
    }).catch(() => {});
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;

    const email = $('email').value.trim();
    const currentPassword = password.value;
    if (mode === 'signup' && currentPassword !== $('confirm-password').value) {
      setMessage(message, 'كلمتا المرور غير متطابقتين.', true);
      $('confirm-password').focus();
      return;
    }

    setBusy(true);
    setMessage(message, mode === 'signup' ? 'جارٍ إنشاء حسابك...' : 'جارٍ تسجيل الدخول...');
    try {
      const result = mode === 'signup'
        ? await db.auth.signUp({
          email,
          password: currentPassword,
          options: { data: { full_name: $('full-name').value.trim(), display_name: $('full-name').value.trim() }, emailRedirectTo: window.location.href.split(/[?#]/)[0] },
        })
        : await db.auth.signInWithPassword({ email, password: currentPassword });

      if (result.error) {
        setMessage(message, `تعذّر ${mode === 'signup' ? 'إنشاء الحساب' : 'تسجيل الدخول'}: ${result.error.message}`, true);
      } else if (mode === 'signup' && !result.data.session) {
        setMessage(message, 'تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده قبل تسجيل الدخول.');
      } else {
        setMessage(message, mode === 'signup' ? 'تم إنشاء الحساب وتسجيل الدخول بنجاح.' : 'تم تسجيل الدخول بنجاح.');
        showUser(result.data.user);
      }
    } catch (error) {
      setMessage(message, `تعذّرت العملية بسبب مشكلة في الاتصال: ${error.message}`, true);
    } finally {
      setBusy(false);
    }
  });

  $('forgot-password').addEventListener('click', async () => {
    if (!$('email').reportValidity()) {
      $('email').focus();
      return;
    }
    setBusy(true);
    setMessage(message, 'جارٍ إرسال رابط استعادة كلمة المرور...');
    try {
      const redirectTo = new URL('password-reset.html', window.location.href).href;
      const { error } = await db.auth.resetPasswordForEmail($('email').value.trim(), { redirectTo });
      if (error) throw error;
      setMessage(message, 'إذا كان البريد مسجلًا، ستصلك رسالة فيها رابط آمن لتعيين كلمة مرور جديدة.');
    } catch (error) {
      setMessage(message, `تعذّر إرسال رابط الاستعادة: ${error.message}`, true);
    } finally {
      setBusy(false);
    }
  });

  googleButton.addEventListener('click', async () => {
    setBusy(true);
    setMessage(message, 'جارٍ تحويلك إلى Google...');
    try {
      const { error } = await db.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href.split(/[?#]/)[0] },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(message, `تعذّر تسجيل الدخول باستخدام Google: ${error.message}`, true);
      setBusy(false);
    }
  });

  $('edit-profile').addEventListener('click', () => { setMessage($('profile-message'), ''); setEditing(true, currentUser); });
  $('profile-cancel').addEventListener('click', () => { setEditing(false); setMessage($('profile-message'), ''); if (currentUser) showUser(currentUser); });

  $('profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const saveButton = $('profile-save');
    const newName = $('profile-name').value.trim();
    if (!newName) { $('profile-name').focus(); return; }
    setBusy(true, [saveButton, $('profile-cancel')]);
    setMessage($('profile-message'), 'جارٍ حفظ بياناتك...');
    try {
      const { data: cur, error: curError } = await db.auth.getUser();
      if (curError) throw curError;
      // ندمج مع البيانات الحالية فلا تضيع الصورة أو أي حقل آخر
      const { data, error } = await db.auth.updateUser({ data: { ...(cur.user.user_metadata || {}), display_name: newName } });
      if (error) throw error;
      setEditing(false);
      showUser(data.user);
      setMessage($('profile-message'), 'تم حفظ بيانات حسابك.');
    } catch (error) {
      setMessage($('profile-message'), `تعذّر حفظ البيانات: ${error.message}`, true);
    } finally {
      setBusy(false, [saveButton, $('profile-cancel')]);
    }
  });

  $('password-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if ($('new-password').value !== $('confirm-new-password').value) {
      setMessage($('password-message'), 'كلمتا المرور غير متطابقتين.', true);
      $('confirm-new-password').focus();
      return;
    }

    const saveButton = $('password-save');
    setBusy(true, [saveButton]);
    setMessage($('password-message'), 'جارٍ تحديث كلمة المرور...');
    try {
      const { error } = await db.auth.updateUser({ password: $('new-password').value });
      if (error) throw error;
      event.currentTarget.reset();
      setMessage($('password-message'), 'تم تحديث كلمة المرور بنجاح.');
    } catch (error) {
      setMessage($('password-message'), `تعذّر تحديث كلمة المرور: ${error.message}`, true);
    } finally {
      setBusy(false, [saveButton]);
    }
  });

  $('logout').addEventListener('click', async () => {
    const button = $('logout');
    setBusy(true, [button]);
    try {
      const { error } = await db.auth.signOut();
      if (error) throw error;
      showUser(null);
      setMessage(message, 'تم تسجيل الخروج.');
    } catch (error) {
      setMessage($('profile-message'), `تعذّر تسجيل الخروج: ${error.message}`, true);
    } finally {
      setBusy(false, [button]);
    }
  });

  // طلباتي
  const ST = { new: 'جديد', confirmed: 'مؤكد', shipped: 'في الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' };
  const loadMyOrders = async () => {
    const host = $('my-orders'); if (!host) return;
    const { data, error } = await db.from('orders').select('order_no,product_name,quantity,total,status,created_at').order('created_at', { ascending: false }).limit(20);
    if (error || !data?.length) { host.innerHTML = ''; return; }
    host.innerHTML = `<div class="follow-box my-orders"><div class="follow-head"><span class="kicker">MY ORDERS</span><h3>طلباتي</h3></div>${data.map((o) => `<div class="my-order st-${o.status}"><div><b>#${o.order_no} · ${escapeHtml(o.product_name)} × ${o.quantity}</b><small>${new Date(o.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}${o.total != null ? ` · ${Number(o.total).toLocaleString('ar-EG')} ج.م` : ''}</small></div><span class="tag">${ST[o.status] || o.status}</span></div>`).join('')}</div>`;
  };
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  db.auth.onAuthStateChange((_e, session) => { if (session?.user) setTimeout(loadMyOrders, 0); });

  db.auth.getSession().then(({ data, error }) => {
    if (error) setMessage(message, `تعذّر التحقق من حالة الحساب: ${error.message}`, true);
    showUser(data?.session?.user || null);
    if (data?.session?.user) loadMyOrders();
  }).catch((error) => {
    setMessage(message, `تعذّر التحقق من حالة الحساب: ${error.message}`, true);
  });

  db.auth.onAuthStateChange((_event, session) => showUser(session?.user || null));
})();

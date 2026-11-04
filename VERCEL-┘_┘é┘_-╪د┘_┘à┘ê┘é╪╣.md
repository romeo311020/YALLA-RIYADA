# نقل الموقع إلى Vercel

الموقع ملفات ثابتة، فمفيش build ولا إعدادات معقدة.

## 1) النشر (من المستودع الحالي على GitHub — الأسهل)
1. ادخل https://vercel.com وسجّل بحساب GitHub.
2. Add New → Project → اختر مستودع YALLA-RIYADA → Import.
3. Framework Preset: **Other**. اترك Build Command و Output Directory فاضيين. اضغط Deploy.
4. بعد دقيقة يطلع لك رابط مثل `https://yalla-riyada.vercel.app`.
   أي رفع جديد على GitHub بينشر تلقائيًا.

(بديل بدون GitHub: Add New → Project → Deploy من ملفات: اسحب مجلد المشروع بعد فك الـ zip.)

## 2) إعدادات Supabase (ضروري وإلا يتعطل تسجيل الدخول)
Supabase → Authentication → URL Configuration:
- **Site URL:** رابط Vercel الجديد.
- **Redirect URLs:** أضف
  - `https://رابطك.vercel.app/**`
  - `https://رابطك.vercel.app/password-reset.html`
  (وسيب رابط GitHub القديم لحد ما تتأكد إن كله شغال).

لو بتستخدم Google: Google Cloud Console → Credentials → OAuth client → Authorized JavaScript origins: أضف رابط Vercel.
(الـ Redirect URI اللي يخص Supabase نفسه لا يتغير.)

## 3) تجربة بعد النشر
- افتح الرابط → المباريات تظهر.
- سجّل دخول/خروج. جرّب «نسيت كلمة المرور».
- افتح لوحة الإدارة.
- على الموبايل: بانر التثبيت يظهر بالرابط الجديد (التطبيق المثبّت من الرابط القديم يفضل على القديم).

## 4) دومين خاص (اختياري)
Vercel → Project → Settings → Domains → أضف الدومين واتبع تعليمات DNS.
بعده كرر خطوة 2 بالدومين الجديد.

## لو ظهر Build Failed بسبب npm install / vite
سببه ملفات قديمة في المستودع (package.json وغيره من مشروع React/Vite).
الحل: ارفع ملف vercel.json الجديد (فيه تخطي التثبيت)، أو احذف من GitHub الملفات: package.json و package-lock.json و vite.config.* و tsconfig*.json ومجلد src.

---
# بديل: Netlify
1. app.netlify.com ← Add new site ← Import an existing project ← GitHub ← اختر YALLA-RIYADA.
2. Build command: اتركه فاضي. Publish directory: `.` (نقطة). ثم Deploy.
3. Site settings ← Change site name لاختيار رابط مثل `yalla-riyada.netlify.app`.
4. حدّث Supabase (Site URL + Redirect URLs) بالرابط الجديد كما في الأعلى.

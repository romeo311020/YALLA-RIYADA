# آخر تعديل (الدالة لم تتغير، ارفع الموقع فقط)
- **النتيجة كانت معكوسة**: صاحب الأرض (الفريق على اليمين) يأخذ رقمه على اليمين الآن، في القوائم وصفحة المباراة.
- **كل الأسماء بالعربي**: الفرق واللاعبون والمدربون الموجودون في `names-ar.js` بأسمائهم الصحيحة، وأي اسم غير موجود يُكتب تلقائيًا بالعربي (**تقريبي**، مثل «ياسير زابيري»). لتصحيح اسم: أضفه في `names-ar.js` أو في جدول `name_translations` في Supabase. الأسماء المكتوبة تلقائيًا تظهر في Console المتصفح (F12) لتصحّحها.
- **زر «شاهد»**: يظهر على بطاقة المباراة وفي صفحتها **فقط** لو أضفت رابط مشغّل للمباراة في جدول `fixture_streams` (رقم المباراة + رابط https). بدون رابط لا يظهر شيء.

---

# تحديث المباريات (الأهم أولًا)

**الترتيب مهم:** حدّث الدالة في Supabase **أولًا**، ثم ارفع الموقع.
1. Supabase ← Edge Functions ← `football-matches` ← افتح الكود، امسحه والصق محتوى `supabase/functions/football-matches/index.ts` الجديد ← Deploy.
2. ارفع باقي الملفات إلى GitHub (ملف جديد: `names-ar.js`).
3. (اختياري) Supabase ← SQL Editor ← الصق آخر جزء من `supabase-setup.sql` (جدول `name_translations`) ← Run. يتيح لك إضافة أسماء عربية من Table Editor بدون تعديل كود.

**الجديد:**
- بطولات أكثر (٤٢): دوري الأبطال والدوري الأوروبي والمؤتمر، دوري أبطال أفريقيا وكأس الكونفدرالية، الدوريات الخمسة الكبرى، السعودي والمصري والمغربي والتونسي والجزائري والإماراتي والقطري، التركي والبرتغالي والهولندي والأمريكي والبرازيلي والأرجنتيني، الكؤوس والمنتخبات. قائمتها في أعلى `index.ts` (`FOOTBALL_LEAGUE_LIST`) بالترتيب الذي تظهر به. تظهر أزرار البطولات التي فيها مباريات اليوم فقط.
- أسماء الفرق عربية، وكذلك أشهر اللاعبين والمدربين، من القاموس في `names-ar.js` (سطر لكل اسم). أي اسم غير موجود يظهر بالإنجليزية، وقائمة الأسماء الناقصة تجدها في Console المتصفح (F12) لتضيفها.
- صفحة المباراة: **الملخص** (أهداف/بطاقات/تبديلات بالدقيقة)، **التشكيلة** على ملعب مع رسم الخطة والاحتياط والمدرب، **الإحصائيات** بأشرطة مقارنة. تُجلب بطلب واحد للمباراة وتُخزّن مؤقتًا (٣ دقائق للمباشر، ٦ ساعات للمنتهية).
- أزرار الرياضة، البحث بالعربي (يشمل أسماء الفرق العربية)، ومربع المشغّل لا يظهر إلا لو أضفت رابطًا رسميًا.

**غير مختبر على المزوّد الحقيقي:** أرقام البطولات وأسماء حقول كرة السلة وشكل التشكيلة والإحصائيات مبنية على معرفتي بالـ API ولم أستطع تجربتها من هنا. لو بطولة لم تظهر، تأكد من رقمها في لوحة API-Football وعدّله.
**الحصة:** ١٠٠ طلب/يوم لكل رياضة في الخطة المجانية. كل مباراة تفتحها تستهلك طلبًا واحدًا (مرة كل ٣ دقائق للمباشر كحد أقصى).

---

# V6 — ما تغيّر

- **حسابي بشكل احترافي:** صورة حساب Google تظهر وتبقى ثابتة، والاسم والبريد وشارة نوع الحساب وتاريخ الانضمام في وضع **عرض فقط**. لتغيير الاسم تضغط **تعديل البيانات** ثم **حفظ** أو **إلغاء**. الاسم المعدّل يُحفظ في حقل خاص (`display_name`) حتى لا يمسحه تسجيل الدخول بجوجل، والبريد لا يتغيّر من هنا. حسابات جوجل لا تُعرض لها خانة كلمة المرور، ويظهر زر «لوحة التحكم» للمسؤول فقط.
- **ترتيب الملفات:** صور الهوية والشعار نُقلت إلى `assets/brand/` (كانت في الجذر فلا تُحمَّل)، وحُذفت نسخ `index.ts` الزائدة (الدوال الأصلية في `supabase/functions/`).
- **لا يزال غير مختبر على حساباتك الحقيقية:** اختُبر هنا بمحاكاة لـ Supabase فقط.

---

# يلا رياضة — V4 (هوية أبيض وأسود)

## الجديد في V4
- **هوية جديدة أبيض/أسود** مع وضع داكن (الافتراضي) وفاتح (زر ☀/☾ في الهيدر). كل الألوان في أعلى `styles.css`.
- **شعار جديد وصور سوشيال** في `assets/brand/`:
  - `social-profile.png` (1080×1080) صورة البروفايل، و`social-cover.png` (1500×500) الغلاف، و`og-image.png` معاينة الرابط.
  - `logo-horizontal-black/white` (SVG وPNG) و`logo-mark-*` و`icon-192/512` و`apple-touch-icon`.
- **كل صفحة ملف مستقل** (`matches.html`, `match.html`…): زر الرجوع يرجع للصفحة السابقة داخل الموقع. صفحات التفاصيل فيها زر «رجوع» يحفظ مكانك، واليوم المختار في المباريات (أمس/اليوم/غدًا) محفوظ في الرابط.
- **شريط تنقل سفلي على الموبايل** (الرئيسية/المباريات/المساعد/المتجر/حسابي) + ملف `manifest.webmanifest` لإضافة الموقع لشاشة الموبايل.
- **إصلاحات**: تنسيق ناقص كان يكسر المساعد والمتجر والفوتر، فلتر «غدًا» في Supabase كان يعرض بعد الغد، نص المحادثة لم يعد يُدرج كـ HTML، زر Enter في صفحة الحساب كان يعرض دخولًا وهميًا، وروابط الشراء/البث/الصور تُقبل فقط إذا كانت http/https، وتثبيت نسخة مكتبة Supabase.
- **المباريات** تُعرض من API-Football عبر Supabase Edge Function بعد إكمال إعدادها أدناه؛ لا توجد نتائج تجريبية بديلة.

## ما لم يتم بعد (بصراحة)
- اللغة الإنجليزية: الموقع عربي فقط حاليًا.
- مباريات API-Football لا تظهر كبيانات حقيقية حتى تنشر Edge Function وتضيف المفتاح السري؛ الأخبار تجريبية. المساعد ردود جاهزة وليس ذكاءً اصطناعيًا. الدفع غير موجود.
- ملفات Supabase (الدخول ولوحة التحكم) اختُبرت هنا بمحاكاة فقط، لا على مشروع Supabase حقيقي. وتحميل الخط من Google Fonts ومكتبة Supabase من الإنترنت لم يُختبر هنا لأن بيئة الاختبار لا تصل إليهما.
- الحروف العربية داخل صور الشعار PNG تستخدم خط بديل (لا Cairo)؛ للاستخدام التجاري النهائي يُفضّل أن يضبطها مصمم.
- في `index.html` وغيره، صورة المعاينة `og:image` مسار نسبي؛ بعد النشر ضع الرابط الكامل لصورة `og-image.png` لتظهر على فيسبوك وواتساب.

## الرفع
فك الضغط، ثم في GitHub: Add file → Upload files، ارفع **كل** الملفات ومجلد `assets` (يستبدلون القديم). بعدها Settings → Pages → Deploy from a branch → main / root.

---

## ملاحظات النسخة السابقة

موقع ثابت HTML/CSS/JS، بدون Node.js أو Git محلي. ارفع الملفات كلها إلى جذر مستودع GitHub Pages مع مجلد assets.

## صفحات المشروع
الرئيسية، المباريات، تفاصيل المباراة، الأخبار، المساعد AI التجريبي مع سجل محادثات محلي، المتجر، تفاصيل المنتج، حسابي، لوحة التحكم، عن المنصة.

## مهم جدًا قبل النشر العام
- المباريات تعتمد على API-Football بعد إكمال إعداد Edge Function والمفتاح السري وفق قسم Sports API؛ توفر البطولات حسب باقة المزوّد.
- لا يوجد بث مباريات مضمن؛ صفحة المباراة تعرض مكانًا لتفاصيل التشكيلة والإحصائيات، وتحتاج بيانات API وروابط قانونية/رسمية.
- المساعد الحالي ليس AI حقيقيًا، ويستخدم ردودًا محدودة. سجل المحادثات محفوظ في localStorage على الجهاز الحالي فقط.
- حساب المستخدم ولوحة التحكم تجريبيان ومحليان وغير آمنين. لا تستخدمهما لحسابات حقيقية. يلزم Supabase Auth أو backend موثوق مع صلاحيات على الخادم وقواعد بيانات.
- لوحة التحكم تحفظ الإعدادات التجريبية في المتصفح ولا تغيّر محتوى الموقع المنشور للزوار.
- المتجر لا يعالج المدفوعات؛ بيانات المنتجات أمثلة.

## النشر عبر المتصفح
1. فك ضغط ZIP. 2. افتح المستودع على GitHub. 3. Add file → Upload files. 4. ارفع كل محتويات المجلد (بما فيها assets) إلى جذر المستودع. 5. Commit changes. 6. من Settings → Pages اختر Deploy from a branch، الفرع main والمجلد /(root).

## المطور
Romany Garges — https://romeo311020.github.io/Romany-Profile/


## V3 — Supabase integration starter

This package adds a real Supabase Auth flow, protected admin panel, database schema, match + product management, and public match/store reads. It is not fully live until the setup below is completed.

### Setup from GitHub + Supabase dashboard (no local Node/Git required)
1. In Supabase, open SQL Editor and run the updated `supabase-setup.sql` file. If the rest of the schema was already installed, run the updated file again to create `fixture_streams` and its RLS policies.
2. In Supabase Settings → API Keys, copy the Project URL and the **Publishable key** (safe for browser use with correct RLS). Do not use a Secret/service_role key.
3. Edit `supabase-config.js` in GitHub and replace the two `PASTE_...` placeholders. Commit changes.
4. Open `account.html` on your published site and create your account. Confirm the email if the project requires it. To enable password recovery, add `https://YOUR_SITE/password-reset.html` under Supabase Authentication → URL Configuration → Redirect URLs.
5. In Supabase SQL Editor run: `update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';` replacing the example with your exact account email. Do not share passwords or secret keys.
6. Open `admin.html` and sign in. Add/edit manual matches, or choose an API-Football fixture and its authorized official Embed URL under **مشغّل مباراة مباشرة**. The player appears on that fixture's detail page.
7. For iframe playback, the source website must allow embedding. Use only a provider's official embed URL and follow its terms; ordinary webpage links may refuse iframe loading.

### Sports API
The matches page uses API-Football through `supabase/functions/football-matches`. The provider key stays in Supabase and is never placed in browser JavaScript.

To enable live fixtures:
1. Create an API-Football account and check that your plan covers the leagues you want.
2. Deploy the Edge Function from this project directory with the Supabase CLI:
   - `npx supabase login`
   - `npx supabase link --project-ref YOUR_PROJECT_REF`
   - `npx supabase functions deploy football-matches --no-verify-jwt`
3. In the Supabase Dashboard, open **Edge Functions → Secrets** and add `API_FOOTBALL_KEY` with the key from API-Football. Do not put this key in this repository or share it in chat.
4. Confirm the Project URL and Publishable key are configured in `supabase-config.js`, then publish the updated site to GitHub Pages.

The function serves the fixtures for yesterday, today, or tomorrow in Cairo time and individual fixture details. API-Football plan limits and competition coverage apply. The page shows an error when the function, key, or provider is unavailable; it does not substitute demo scores.

### Sports news
The Arabic sports-news page uses GNews through `supabase/functions/sports-news`. Create a GNews account at https://gnews.io/ and get an API key. In Supabase, deploy the public function and add a secret named `GNEWS_API_KEY` under **Edge Functions → Secrets**. Keep the key out of the repository and browser files.

Deploy it with `npx supabase functions deploy sports-news --no-verify-jwt`. The page requests up to 10 Arabic sports headlines and links readers to the original publishers. The function caches results in each running instance for 15 minutes. GNews plan limits apply; its free plan currently has a 12-hour data delay and request/article limits. The news page displays an error rather than fictional articles if setup fails.

### Account profile and password recovery
Signed-in users can edit the name and email from `account.html`; Supabase may require the user to confirm a new email before it takes effect. Signed-in users can set a new password from the same page. Users who forgot their password can request a recovery email, then choose a new password at `password-reset.html`. Add the published reset page to Supabase's allowed redirect URLs as described above. Account changes use Supabase Auth; users cannot change their admin role from the profile page.

### Security notes
- Supabase publishable keys are intended for browser use; the database must be protected by RLS. Never expose a Secret/service_role key.
- Admin access depends on the `profiles.role` row, protected by RLS. The signup flow never lets users choose their own role.
- News is served by GNews; AI responses and chat history remain demo features.
- Do not use the site to distribute streams unless you have permission to embed and display them.

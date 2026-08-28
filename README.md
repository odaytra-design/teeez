# Syria Commerce — Phase 2
## لوحة المسوقين + تجهيز التخزين الدائم

هذه المرحلة مبنية على النسخة التي نجح Deploy فيها بدون `src/index.js` وبدون `assets.directory`.

### الملفات
- `index.js` — Worker كامل
- `wrangler.jsonc` — مضبوط على `index.js` في الجذر
- `schema.sql` — قاعدة D1 للمرحلة الثانية
- `package.json`
- `README.md`

### مهم
النسخة الحالية **Deploy-safe** حتى قبل إنشاء وربط D1؛ لذلك لن نضيف Binding الآن ونعرّض الـDeploy للفشل.

بعد نجاح الـDeploy، الخطوة التالية ستكون إنشاء D1 وربطه باسم `DB` ثم تشغيل `schema.sql`، وبعدها يصبح تسجيل المسوقين دائمًا.

### المسارات
- `/` الرئيسية
- `/dashboard` لوحة المسوقين
- `/api/health`
- `GET /api/marketers`
- `POST /api/marketers`

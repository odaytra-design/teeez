# Syria Commerce — Phase 1

نظام المسوقين — التسجيل وإنشاء كود مسوق.

## Cloudflare

- Build command: `npm install`
- Deploy command: `npx wrangler deploy`
- لا يوجد `src/index.js`
- لا يوجد `assets.directory`
- لا توجد Bindings مطلوبة في هذه المرحلة

## Endpoints

- `/` الموقع
- `/api/health` فحص النظام
- `POST /api/register` تسجيل مسوق وإنشاء كود

### ملاحظة

هذه المرحلة مخصصة لاختبار واجهة التسجيل وتدفق إنشاء الكود بدون إدخال قاعدة بيانات جديدة حتى لا نغيّر إعداد Cloudflare العامل. المرحلة التالية هي التخزين الدائم + لوحة المسوق.

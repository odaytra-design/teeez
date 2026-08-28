# Syria Commerce

جاهز للنشر على Cloudflare Workers + GitHub.

## Structure

- `index.js` — Cloudflare Worker entry point
- `wrangler.jsonc` — Wrangler configuration
- `public/index.html` — الموقع الرئيسي
- `package.json` — deployment configuration

## Cloudflare

Build command: `npm install`
Deploy command: `npx wrangler deploy`

لا تستخدم `src/index.js`.

ملف الدخول الرئيسي هو `index.js` في جذر المشروع، والملفات الثابتة موجودة داخل `public/`.

## Local

```bash
npm install
npm run deploy
```

Health check:

`/api/health`

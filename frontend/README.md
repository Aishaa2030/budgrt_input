# ميزان | متابعة ميزانيات المشاريع

تطبيق React + TypeScript مبني على Vite لعرض ومتابعة ميزانيات المشاريع والبيانات المالية.

## تشغيل المشروع محلياً

```bash
cd frontend
npm install
npm run dev
```

## نشر المشروع على GitHub Pages

1. ارفع المشروع إلى مستودع GitHub.
2. تأكد أن الفرع الافتراضي هو `main`.
3. في إعدادات المستودع، افتح `Pages` واختر `GitHub Actions` كـ Source.
4. سيتم نشر التطبيق تلقائياً عبر ملف Workflow التالي:
   - `.github/workflows/deploy.yml`

## البناء للإنتاج

```bash
cd frontend
npm run build
```

الملف الناتج يكون داخل مجلد `dist`، وهو ما يستهلكه GitHub Actions للنشر.

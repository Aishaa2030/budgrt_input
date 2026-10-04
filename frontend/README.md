# ميزان | متابعة ميزانيات المشاريع

تطبيق React + TypeScript مبني على Vite لعرض ومتابعة ميزانيات المشاريع والبيانات المالية.

## تشغيل المشروع محلياً

```bash
cd frontend
npm install
npm run dev
```

## نشر المشروع على GitHub Pages

1. نفّذ `npm run build` من مجلد `frontend`.
2. انسخ محتويات `frontend/dist` إلى جذر المستودع.
3. ادفع التغييرات إلى الفرع `main`.
4. في إعدادات المستودع، افتح `Pages` واختر `main` ومجلد `/(root)` كمصدر للنشر.

يُنشر التطبيق على:
`https://aishaa2030.github.io/budgrt_input/`

## البناء للإنتاج

```bash
cd frontend
npm run build
```

الملفات الناتجة تكون داخل مجلد `dist`. يجب نسخ محتويات هذا المجلد إلى جذر المستودع حتى يجد GitHub Pages ملف `index.html`.

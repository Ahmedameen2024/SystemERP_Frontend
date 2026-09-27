# System ERP - Frontend 🚀

واجهة المستخدم لنظام إدارة الموارد وتخطيط المؤسسات (ERP System Frontend) مبنية باستخدام:
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (نظام تصميم Equilibrium Finance)
- **Zustand** لإدارة الحالة والمصادقة
- **React Query** لجلب ومزامنة البيانات
- **Axios** للتواصل مع خادم الـ API عبر مسارات HTTP RESTful

---

## 🛠 متطلبات التشغيل
- Node.js 18+ أو 20+
- npm أو pnpm أو yarn

---

## ⚙️ التثبيت والتشغيل المحلي

1. **تثبيت التبعيات:**
   ```bash
   npm install
   ```

2. **إعداد المتغيرات البيئية:**
   قم بنسخ ملف `.env.example` إلى `.env`:
   ```bash
   cp .env.example .env
   ```
   وتأكد من ضبط عنوان الـ Backend API:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **بدء خادم التطوير:**
   ```bash
   npm run dev
   ```
   سيعمل التطبيق على: `http://localhost:5173`

4. **بناء النسخة الإنتاجية (Production Build):**
   ```bash
   npm run build
   ```

---

## 📁 بنية المشروع
```
src/
├── api/             # إعداد Axios Client والتواصل مع الـ Backend API
├── assets/          # الأصول الثابتة والصور والشعارات
├── components/      # مكونات الواجهة المشتركة (Layout, Header, Sidebar...)
├── config/          # إعدادات الصلاحيات ومصفوفة الرخص
├── pages/           # صفحات الأقسام والأنظمة (محاسبة، مبيعات، مشتريات، مخازن...)
├── store/           # مخزن Zustand لإدارة حالة المستخدم والتوكنات
├── index.css        # أنماط Tailwind ومتغيرات نظام الألوان
└── main.tsx         # نقطة انطلاق التطبيق
```
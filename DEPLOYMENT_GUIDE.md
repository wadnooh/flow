# دليل النشر والرفع النهائي - نظام متابعة الكهربائية الميدانية ⚡

المشروع جاهز ومقسم إلى حزم واضحة ومباشرة للرفع والتطبيق:

---

## 1. 🌐 حزمة الويب ولوحة التحكم (Web & Admin Dashboard)

- **الملف المضغوط الجاهز للرفع على Hostinger**:
  `E:\متابعة الكهربائية\WEB_HOSTINGER_UPLOAD.zip`

- **طريقة الرفع والتطبيق على Hostinger**:
  1. ادخل لوحة تحكم Hostinger ⬅️ **File Manager** (مدير الملفات).
  2. افتح مجلد `public_html`.
  3. ارفع الملف `WEB_HOSTINGER_UPLOAD.zip`.
  4. اضغط بكرت الفأرة الأيمن واطلب **Extract** (فك الضغط).

- **الرابط الشغال**:
  [https://wadnooh.com](https://wadnooh.com)

---

## 2. 📱 حزمة تطبيق الجوال (Mobile App)

- **تطبيق الويب الجوال (Mobile Web PWA)**:
  `E:\متابعة الكهربائية\MOBILE_WEB_APP.zip` (مجهز للعمل كتطبيق ويب للأنظمة الأخرى).

- **مشروع أندرويد المستقل (Flutter Android Source)**:
  المسار المحلي: `C:\electrical_mobile` أو `E:\متابعة الكهربائية\mobile`

- **أمر استخراج ملف الـ APK النهائي للأنوات**:
  ```powershell
  cd C:\electrical_mobile
  flutter build apk --release
  ```
  مسار الملف الناتج:
  `C:\electrical_mobile\build\app\outputs\flutter-apk\app-release.apk`

---

## 3. ⚙️ خادم البيانات وقاعدة البيانات (Backend & Database)

- **مجلد الخادم والقواعد**: `E:\متابعة الكهربائية\backend`
- **ملف قاعدة البيانات الخفيف الحاوي على البيانات الأساسية**:
  `E:\متابعة الكهربائية\backend\electrical_field.db`
- **مستودع الكود المصدري على GitHub**:
  [https://github.com/wadnooh/flow](https://github.com/wadnooh/flow)

---

## 🔑 بيانات التسجيل الجاهزة للاختبار والتجربة:

- **حساب مدير النظام (Admin)**:
  - اسم المستخدم: `admin` | كلمة المرور: `admin123`
- **حسابات الفنيين الميدانيين**:
  - اسم المستخدم: `tech1` | كلمة المرور: `tech123`
  - اسم المستخدم: `tech2` | كلمة المرور: `tech123`

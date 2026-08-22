# 🃏 ليلة ورق

لعبة أسئلة وتحديات جماعية بالعربي، للتجمعات الشبابية. React Native (Expo) + TypeScript، لاندسكيب بالكامل.

انظر الـ PRD الكامل لتفاصيل المنتج والخطة الزمنية (5 أيام).

## المتطلبات

- Node.js 20+ (تم البناء والاختبار على Node 24)
- تطبيق **Expo Go** على جوالك (لأسرع تجربة)، أو Android Studio / Xcode لمحاكي

## الإعداد

```bash
npm install
cp .env.example .env
```

افتح `.env` وعبّي مفاتيح Firebase الحقيقية (Firebase Console → Project settings → SDK setup)، ومفتاح Facebook App ID إذا بغيت تفعّل الدخول عبر فيسبوك. بدون هذي المفاتيح، التطبيق يشتغل بالكامل ويعرض كل الشاشات، لكن أي محاولة تسجيل دخول فعلية بترجع رسالة "لم يتم إعداد تسجيل الدخول بعد" بدل ما تتعطل.

**Firebase Auth:** فعّل من الـ Console (Authentication → Sign-in method): Email/Password، Apple، Facebook.

**Apple Sign In:** يشتغل بس على iOS builds حقيقية (مو Expo Go، ومو Android) — يعتمد على `bundleIdentifier` بملف `app.json`، ما يحتاج مفتاح إضافي بـ `.env`.

**Facebook Login:** لازم تضيف `laylatwaraq://` كـ redirect URI صحيح بإعدادات Facebook Login للتطبيق.

## التشغيل

```bash
npx expo start          # يفتح QR للمسح بـ Expo Go
npx expo start --android
npx expo start --ios
npx expo start --web    # للمعاينة السريعة بالمتصفح فقط (مو جزء من المنتج النهائي)
```

## البنية

```
app/                  شاشات Expo Router (auth) و (game)
components/           مكونات UI + العلامة التجارية (Logo, CardTableBackground)
theme/                نظام التصميم: الألوان، الخطوط (Cairo)، المسافات
store/                Zustand: الإعدادات (تصاحب AsyncStorage) وحالة تسجيل الدخول
lib/                  تهيئة Firebase + دوال تسجيل الدخول
hooks/                useAppFonts, useFacebookAuth, useAppleAuth, ...
utils/                رسائل الأخطاء بالعربي، قفل اتجاه الشاشة
```

## قرارات تقنية مهمة

- **Expo SDK 57** بدل SDK 51 المذكور بالـ PRD — SDK 51 قديم (2024) وما يدعمه Expo Go الحالي ولا يعمل بشكل موثوق مع Node 24. باقي الـ stack (Firebase, Zustand, Expo Router...) زي ما هو بالـ PRD تمامًا.
- **الاتجاه (Landscape):** مقفول عبر `expo-screen-orientation` وقت التشغيل (يشتغل حتى بـ Expo Go)، بالإضافة لإعداد `app.json` اللي يقفله على مستوى Android/iOS native وقت البناء بـ EAS.
- **RTL:** كل شاشة مبنية RTL بالكامل (محاذاة نص، `row-reverse`، إلخ) يدويًا لكل عنصر. تعمّدت عدم استدعاء `I18nManager.forceRTL()` + إعادة تشغيل إجباري بهالمرحلة المبكرة من البناء (Day 1) تجنبًا لمخاطر حلقة إعادة تشغيل أثناء التطوير السريع؛ فحص RTL الشامل مجدول أصلاً باليوم 5 بالـ PRD.
- **الخلفية الكرتونية بشاشة الدخول:** رسمة SVG أصلية (طاولة ورق + أضواء + أوراق متطايرة) مو تصميم مُكلّف من فنان — بديل مؤقت لائق يقدر يتغيّر لاحقًا بسهولة (`components/ui/CardTableBackground.tsx`) بدون ما يمس باقي الشاشة.
- **أيقونة التطبيق والـ splash:** لسه placeholder من Expo (بطاقة عامة)، يحتاج تصميم نهائي قبل الإصدار (مجدول ضمن يوم 5 — "App icon + splash screen final").

## حالة اليوم 1 ✅

- Expo + TypeScript + Expo Router
- قفل Landscape على كل الشاشات
- نظام تصميم كامل (خط Cairo بكل الأوزان، الألوان، 6 ثيمات ورق)
- Splash Screen متحرك بشعار "ليلة ورق"
- شاشة Login: خلفية مصممة + دخول بالبريد + Apple + Facebook
- Firebase Auth (Email/Password + Apple + Facebook) مع رسائل خطأ عربية واضحة
- شاشة Register + شاشة نسيت كلمة المرور
- Home Screen: صورة المستخدم + زر "لنلعب!" + لوحة إعدادات منزلقة (صوت / لغة / ألوان الورق) + تسجيل خروج

تم التحقق: `tsc --noEmit` نظيف، `expo-doctor` (21/21)، وبناء Metro كامل لـ Android عبر `expo export`.

## التالي — اليوم 2

اختيار وضع اللعب (سيرفر/محلي)، إنشاء سيرفر محلي عبر WebSocket، شاشة الانتظار (Lobby)، واختيار الفئات.

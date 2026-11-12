# UniDoue — Google Play tayyorgarligi

## 1. Haqiqiy vaziyat (muhim)
- **Shaxsiy** Play Console hisobi uchun Google talabi: ilova ommaga chiqishidan oldin **kamida 12 ta sinovchi 14 kun uzluksiz** yopiq sinovda (closed testing) bo‘lishi kerak. Shuning uchun ertaga hisob ochib ilovani yuklash mumkin, lekin **hamma uchun e’lon qilish eng erta ~14 kundan keyin** bo‘ladi.
- Tashkilot (organization) hisobida bu talab yo‘q, lekin D-U-N-S raqami va rasmiy hujjatlar kerak.
- Ro‘yxatdan o‘tish to‘lovi: **$25 (bir marta)**, karta kerak. Shaxsni tasdiqlash (pasport/ID) so‘raladi.
- O‘zbekistondan ro‘yxatdan o‘tish imkoniyatini hisob ochishda Google ko‘rsatadi; ilova bepul bo‘lgani uchun savdogar (merchant) hisobi kerak emas.
- Ilova hozir bepul Render serverida: 15 daqiqa faolsizlikdan keyin uxlaydi, birinchi ochilish ~50 soniya kechikishi mumkin. Sinov davrida uptime-ping (masalan UptimeRobot, har 5 daqiqada `https://unidoue.onrender.com/healthz`) bilan uyg‘oq tutish mumkin.

## 2. Ertangi kun tartibi
1. https://play.google.com/console → hisob ochish ($25, shaxsni tasdiqlash).
2. **PWABuilder** (pwabuilder.com) → `https://unidoue.onrender.com` → Package for stores → Android:
   - Package ID: `uz.unidoue.app`, App name: `UniDoue`, Version: 1 (versionCode 1).
   - Signing key: **Create new**. Yuklab olingan arxivdagi `.keystore` fayli va parolini **xavfsiz joyda saqlang** (yo‘qolsa ilovani yangilab bo‘lmaydi).
   - Yuklab olingan `.aab` faylini Play Console’ga yuklaysiz.
3. Play Console → yangi ilova → **Release → Testing → Closed testing** → `.aab` yuklash.
4. **Play App Signing** yoqilgan bo‘ladi. Console → *App integrity → App signing* da Google ko‘rsatgan **SHA-256** barmoq izini oling va `public/.well-known/assetlinks.json` fayliga **qo‘shimcha** barmoq izi sifatida qo‘shing (menga yuboring, men qo‘shaman). Aks holda ilova ichida manzil satri (URL bar) ko‘rinib qoladi.
5. Do‘kon sahifasi (pastdagi matnlar, `screenshots/` va `feature-graphic-1024x500.png`), ikonka: `public/icons/icon-512.png`.
6. Sinovchilarni qo‘shish: 12+ kishining Gmail manzillari (do‘stlar, sinfdoshlar). Ular havola orqali ilovani o‘rnatib, 14 kun o‘chirmasdan turishi kerak.

## 3. Do‘kon sahifasi

**Havolalar**
- Maxfiylik siyosati: `https://unidoue.onrender.com/privacy`
- Hisobni o‘chirish: `https://unidoue.onrender.com/delete-account`
- Aloqa: Telegram @DOUEODUE; email: sizning Gmail manzilingiz

**Kategoriya:** Education. **Narx:** Bepul.

### O‘zbekcha (asosiy til)
- **Nomi (≤30):** UniDoue: xorijda o‘qish
- **Qisqa tavsif (≤80):** Universitet tanlash, muddatlar va ariza rejasi bir joyda.
- **To‘liq tavsif:**
```
UniDoue — xorijda o‘qishni rejalashtirayotgan abituriyentlar uchun yordamchi.

Nima qila olasiz:
• Universitetlarni profilingizga (GPA, SAT, IELTS) solishtirib, Safety, Target va Reach guruhlariga bo‘ling — har biri uchun tushuntirish bilan.
• AQShdan tashqari Yevropa, Osiyo, Avstraliya va boshqa davlat universitetlari uchun IELTS minimumi, ariza muddati, o‘qish narxi va kirish talablarini ko‘ring. Har bir ma’lumotning yonida rasmiy manba havolasi bor.
• Universitetlarni yonma-yon solishtiring.
• Arizalaringiz, hujjatlaringiz va muddatlaringizni bir joyda kuzating.
• Qabul bashoratini oling (bu taxminiy baho, kafolat emas).
• Yo‘l xaritasi bo‘yicha qadam-baqadam rejaga amal qiling.
• Esse yordamchisi va AI mentordan maslahat oling.

Ma’lumotlar haqida: universitet ma’lumotlari rasmiy saytlardan olinadi. Tasdiqlanmagan qiymatlar “taxminiy” deb belgilanadi yoki ko‘rsatilmaydi. Muddat va talablarni arizadan oldin universitetning rasmiy sahifasida albatta tekshiring.

Tariflar: Free (bepul) va pullik Pro reja. Bepul tarifda AI kreditlari va ba’zi imkoniyatlar cheklangan.

UniDoue qabulni kafolatlamaydi va hech qanday universitet bilan rasmiy bog‘liq emas.
```

### Русский
- **Название (≤30):** UniDoue: учёба за рубежом
- **Краткое (≤80):** Выбор университетов, сроки и план поступления в одном месте.
- **Полное:**
```
UniDoue — помощник для абитуриентов, которые планируют учиться за рубежом.

Что можно делать:
• Сопоставлять университеты с вашим профилем (GPA, SAT, IELTS) и делить их на Safety, Target и Reach — с объяснением по каждому.
• Смотреть университеты Европы, Азии, Австралии и других стран: минимум IELTS, срок подачи, стоимость и требования. Рядом с каждым значением — ссылка на официальный источник.
• Сравнивать университеты рядом.
• Вести заявки, документы и сроки в одном месте.
• Получать оценку шансов (приблизительную, не гарантию).
• Следовать пошаговой дорожной карте.
• Пользоваться помощником по эссе и ИИ-наставником.

О данных: сведения об университетах берутся с официальных сайтов. Непроверенные значения помечены как «приблизительные» или не показываются. Сроки и требования обязательно проверяйте на официальной странице университета.

Тарифы: Free (бесплатно) и платный Pro. В бесплатном тарифе ИИ-кредиты и часть функций ограничены.

UniDoue не гарантирует поступление и не связан официально ни с одним университетом.
```
> Eslatma: ilovaning o‘zi hozircha asosan o‘zbekcha (RU/EN qisman). Rus/ingliz do‘kon sahifasini ilova tarjimasi tugagach qo‘shgan ma’qul.

### English
- **Title (≤30):** UniDoue: Study Abroad
- **Short (≤80):** Pick universities, track deadlines and plan your applications in one place.
- **Full:**
```
UniDoue helps students plan to study abroad.

What you can do:
• Match universities to your profile (GPA, SAT, IELTS) and group them into Safety, Target and Reach, with an explanation for each.
• Browse universities in Europe, Asia, Australia and more: minimum IELTS, application deadline, tuition and entry requirements, each with a link to the official source.
• Compare universities side by side.
• Track applications, documents and deadlines in one place.
• Get an admission estimate (an estimate, not a guarantee).
• Follow a step-by-step roadmap.
• Use the essay assistant and AI mentor.

About the data: university information comes from official websites. Unverified values are labelled "approximate" or not shown. Always confirm deadlines and requirements on the university's official page.

Plans: Free and paid Pro. AI credits and some features are limited on the free plan.

UniDoue does not guarantee admission and is not officially affiliated with any university.
```

## 4. Play Console deklaratsiyalari (tavsiya, javoblarni o‘zingiz tasdiqlang)
- **Reklama:** yo‘q (ilovada reklama bo‘lmasa “No ads”).
- **Maqsadli auditoriya:** 16–17 va 18+. Bolalar uchun mo‘ljallanmagan (maxfiylik siyosatida 14+).
- **Kontent reytingi (IARC so‘rovnomasi):** zo‘ravonlik, jinsiy kontent, qimor, giyohvand — yo‘q. Foydalanuvchilar o‘rtasida muloqot yo‘q (faqat mentorga so‘rov). AI vositasi bor: matn yaratadi.
- **Data safety (yig‘iladigan ma’lumot):**
  - Shaxsiy: ism, email (hisob uchun).
  - Foydalanuvchi kontenti: profil natijalari (GPA/SAT/IELTS), arizalar, esse/AI savollari matni.
  - Xavfsizlik: ulanish shifrlangan (HTTPS); foydalanuvchi o‘chirishni so‘rashi mumkin (ilova ichida va `/delete-account` orqali).
  - Uchinchi tomonlar: hosting (Render), baza (Neon), AI xizmati (Groq/Anthropic), email (Brevo), Telegram (mentor so‘rovlari). Google’ning “xizmat ko‘rsatuvchi” (service provider) qoidalarini o‘qib, “sharing” belgisini to‘g‘ri tanlang.
- **Hisobni o‘chirish URL’i:** `https://unidoue.onrender.com/delete-account`.
- **Ilova kirishi:** ilova hisob talab qiladi → Play “App access” bo‘limida **test hisobi** (email + parol) ko‘rsatish kerak. Sinov uchun alohida hisob oching va Pro bering.

## 5. Fayllar
- `store/screenshots/1..6-*.png` — telefon skrinshotlari (1082×2100, nisbat < 2:1; haqiqiy ilovadan).
- `store/feature-graphic-1024x500.png` — feature graphic.
- Ikonka 512×512: `public/icons/icon-512.png`.

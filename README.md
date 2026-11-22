# UniDoue 2.0

Xorijda oʻqish platformasi: universitet qidiruvi (Safety/Target/Reach), moslik tahlili, solishtirish, arizalar kuzatuvchisi, esse yordamchisi, AI mentor, tariflar.

- `/` va `/app` — UniDoue platformasi (hisob, dashboard, tariflar, AI vositalar). Eski bosh sahifa olib tashlangan
- `/admin` — sayt egasi uchun boshqaruv paneli (`ADMIN_TOKEN` bilan): umumiy statistika va 14 kunlik grafik, soʻrovlar, foydalanuvchilar, toʻlovlar, push xabar yuborish. Kun/tun rejimi, telefonda ham ishlaydi

## Ishga tushirish
```bash
node server.js     # Node 18+, paket oʻrnatish shart emas → http://localhost:3000
node tests/run.js  # integratsiya testi (66 ta tekshiruv)
```

## Sozlamalar (environment variables)
| Oʻzgaruvchi | Vazifasi |
|---|---|
| `COOKIE_SECURE=1`, `TRUST_PROXY=1` | HTTPS va proksi ortida (production uchun **majburiy**) |
| `DATA_DIR=/data` | Maʼlumotlar papkasi. Doimiy disk ulang, aks holda hisoblar yoʻqoladi |
| `ADMIN_TOKEN` | Admin API: soʻrovlarni koʻrish, tarif berish |
| `BREVO_API_KEY`, `MAIL_FROM` | Parolni tiklash xati (Brevo, domen talab qilmaydi). `MAIL_FROM` = Brevo'da tasdiqlangan joʻnatuvchi, masalan `UniDoue <sizning@gmail.com>` |
| `DATABASE_URL` | Neon (bepul Postgres) ulanish manzili. **Bepul Render'da hisoblar o'chib ketmasligi uchun kerak.** Kalitsiz ma'lumotlar faqat serverdagi faylda turadi |
| `ANTHROPIC_API_KEY` | AI mentor, esse tahlili, strategiya, hisobot. **Kalitsiz AI "ulanmagan" holatida turadi** |
| `AI_MODEL` | AI modeli (standart: `claude-sonnet-5-5`) |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Anthropic oʻrniga OpenAI-mos provayder. Arzon variant: `AI_BASE_URL=https://api.openai.com/v1`, `AI_MODEL=gpt-6-luna` (≈ $0.10 / $0.50 per 1M token). gpt-5/gpt-6/o-seriya modellari uchun server `max_completion_tokens` va `reasoning_effort` yuboradi, `temperature` yuborilmaydi |
| `AI_REASONING_EFFORT` | Faqat reasoning modellar: `low` (standart), `none`, `medium`, `high`, `omit` (parametr yuborilmaydi). Past qiymat arzonroq va tezroq |
| `AI_REASONING=1/0` | Model nomi avtomatik taniy olmasa (masalan OpenRouter orqali), reasoning rejimini qoʻlda yoqish/oʻchirish |
| `AI_TOKENS_PER_CREDIT` | Xavfsizlik chegarasi: oylik token sarfi `tarif krediti × shu son` dan oshsa AI toʻxtaydi (standart 20000). Real xarajatni kredit hisobidan qatʼiy nazar cheklaydi |
| `AI_GLOBAL_CAP` | (tavsiya etiladi) Hamma foydalanuvchilarning oylik umumiy AI krediti. Oshsa AI vaqtincha toʻxtaydi. Qoʻyilmasa umumiy chegara yoʻq |
| `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL` | Parolni tiklash xati. Kalitsiz "ulanmagan" xabari chiqadi |
| `TG_BOT_TOKEN`, `TG_CHAT_ID` | Mentor va tarif soʻrovlari Telegramga kelishi uchun |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | (ixtiyoriy) Push bildirishnomalar kaliti. Qoʻyilmasa server oʻzi yaratib, ma'lumotlar bazasiga (Neon ulangan boʻlsa u yerga ham) saqlaydi. `VAPID_SUBJECT` — aloqa manzili (`mailto:` yoki `https://`); qoʻyilmasa `APP_URL` olinadi |
| `TWA_SHA256`, `TWA_PACKAGE` | (ixtiyoriy) Google Play ilovasi (TWA): imzo SHA-256 barmoq izlari (vergul bilan) `/.well-known/assetlinks.json` ga qoʻshiladi; `TWA_PACKAGE` — paket nomi (standart `uz.unidoue.app`). Batafsil: `store/PLAY_MARKET.md`. |
| `USD_UZS_RATE` | Onlayn toʻlov uchun kurs: 1 USD = necha soʻm (masalan `12700`). Soʻm narxi = dollar narxi × kurs, 1000 soʻmgacha yaxlitlanadi. Kurs boʻlmasa toʻlov **yoqilmaydi** |
| `PAYME_MERCHANT_ID`, `PAYME_KEY`, `PAYME_TEST` | Payme kassasi. `PAYME_TEST=1` — sinov muhiti (`test.paycom.uz`), shunda `PAYME_KEY` oʻrniga **TEST kalitni** qoʻying |
| `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY` | Click (SHOP-API) |

## Onlayn toʻlov: Payme + Click (karta bilan Plus/Pro)
Foydalanuvchi Tariflar sahifasida **Payme** yoki **Click** tugmasini bosadi, provayder sahifasida karta bilan toʻlaydi, toʻlov tasdiqlangach tarif **30 kunga** avtomatik yoqiladi (qayta toʻlansa, 30 kun qoʻshiladi). Avtomatik yechish yoʻq. Kalitlar sozlanmagan boʻlsa, sayt eski qoʻlda toʻlov usuli bilan ishlayveradi.

**Boshlashdan oldin.** Payme va Click kassasi faqat rasmiy roʻyxatdan oʻtgan tadbirkorga (YaTT, MChJ va h.k.) beriladi. Shaxs sifatida ulab boʻlmaydi. Ikkalasida ham tadbirkor kabineti orqali ariza beriladi.

**1. Render → Environment** ga qoʻying (faqat oʻzingiz xohlagan provayderni ham qoʻysangiz boʻladi, lekin `USD_UZS_RATE` majburiy):
```
USD_UZS_RATE=12700
APP_URL=https://unidoue.uz
PAYME_MERCHANT_ID=...   PAYME_KEY=...   (sinovda: PAYME_TEST=1 va TEST kalit)
CLICK_SERVICE_ID=...    CLICK_MERCHANT_ID=...    CLICK_SECRET_KEY=...
```
Server qayta ishga tushgach logda `Toʻlovlar yoqilgan: Payme, Click | kurs: 12700` chiqadi. Chiqmasa (yoki kurs xato boʻlsa) sababi ham shu yerda yoziladi.

**2. Provayder kabinetida manzillarni kiriting** (POST, ochiq internetdan chaqiriladi):
| Provayder | Manzil |
|---|---|
| Payme (Endpoint URL) | `https://unidoue.uz/api/pay/payme` |
| Click (Prepare URL va Complete URL) | `https://unidoue.uz/api/pay/click` — bitta manzil, `action` maydoni bilan ajratiladi |

Payme kassasida buyurtma kodi uchun **hisob (account) maydoni** boʻlishi kerak, uning nomi aynan `order_id` (sayt Payme sahifasiga `ac.order_id` sifatida yuboradi). Kassa valyutasi — soʻm.

**3. Sinov.** Payme: kabinetdagi sandbox/“Paycom test” orqali barcha usullar (`CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction`, `CancelTransaction`, `CheckTransaction`, `GetStatement`) tekshiriladi. Click: kabinetdagi test toʻlov. Ikkala provayderni oʻz tekshiruvidan oʻtkazgach, kalitlarni haqiqiy (production) kalitlarga almashtiring va `PAYME_TEST` ni oʻchiring.

**Qanday ishlaydi / bilib qoʻying**
- Buyurtma summasi yaratilgan paytdagi kurs bilan qotiriladi (keyin `USD_UZS_RATE` oʻzgarsa ham, ochiq buyurtma oʻz summasida toʻlanadi).
- Plus → Pro ga oʻtganda Pro yangi 30 kunga yoqiladi (Plusning qolgan kunlari qoʻshilmaydi). Pro egasi Plus sota olmaydi.
- Toʻlov qaytarilsa (Payme kabinetidan bekor qilish), qoʻshilgan 30 kun tarifdan olib tashlanadi.
- Buyurtmalar roʻyxati: `curl -H "Authorization: Bearer $ADMIN_TOKEN" https://SAYT/api/admin/orders`. Har bir muvaffaqiyatli toʻlov `TG_BOT_TOKEN` sozlangan boʻlsa Telegramga ham yuboriladi.
- Imzo/kalit tekshiruvi: Payme — `Authorization: Basic Paycom:KALIT`, Click — MD5 `sign_string`. Notoʻgʻri soʻrovlar rad etiladi. Provayder xabarlari uchun cookie/CSRF talab qilinmaydi (faqat shu ikki manzil uchun).
- Kod: `payments.js`; testlar: `node tests/run.js` (“Onlayn toʻlov” boʻlimi provayder chaqiruvlarini simulyatsiya qiladi).

## Push bildirishnomalar
Kutubxonasiz (faqat `node:crypto` va `fetch`): VAPID (RFC 8292), `aes128gcm` shifrlash (RFC 8291), yetkazish (RFC 8030). Kod: `push.js`, `public/js/webpush.js` va `push.js`, service worker — `public/sw.js`.

- **Foydalanuvchi**: Profil → “Bildirishnomalar” → yoqish. Ariza muddati yaqinlashganda (14/7/3/1/0 kun, 09:00–21:00 Toshkent vaqti bilan; har biri bir martadan) va tarif yangilanganda/toʻlov qabul qilinganda xabar keladi. Telegram eslatmalari ham oldingidek ishlaydi.
- **Admin**: `/admin` → “Bildirishnomalar” — barcha/Free/Plus/Pro/bitta foydalanuvchi (email) ga xabar yuborish; “Admin qurilmasi”ni yoqsangiz yangi soʻrov va toʻlov haqida telefoningizga xabar keladi. API: `POST /api/admin/push/send` (`{title, body, url?, audience: all|free|plus|pro|email|admin, email?}`).
- iPhone/iPad: bildirishnoma faqat sayt “Bosh ekranga qoʻshilib”, ilova sifatida ochilganda ishlaydi (iOS 16.4+).
- Eskirgan obunalar (404/410) avtomatik oʻchiriladi. Obuna manzili faqat FCM, Mozilla, Windows va Apple push xizmatlariga ruxsat etiladi (SSRF himoyasi).
- Admin soʻrovlari tezligi: faqat **xato token** sanaladi (IP boʻyicha 20 ta / 15 daqiqa); toʻgʻri tokenli yangilashlar bir-biriga xalaqit bermaydi.
- Testlar: `node tests/push.js` (RFC 8291 sinov vektori bilan bayt-ma-bayt tekshiruv) va `tests/run.js` ichidagi “Web Push” boʻlimi (soxta push xizmati bilan).

## Tarif berish (qoʻlda; onlayn toʻlov ulanmagan boʻlsa yoki istisno uchun)
```bash
curl -X POST https://SAYT/api/admin/plan -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"email":"user@gmail.com","plan":"pro","days":30}'
```
Foydalanuvchi soʻrovlari: `GET /api/admin/requests`.

## Stipendiyalar bazasi
`DATA_DIR/scholarships.json` (yoki `catalog/scholarships.json`) fayli. Faqat **rasmiy manbadan tekshirilgan** yozuvlar qoʻshing:
```json
{"updated":"2026-11-07","items":[{"name":"…","provider":"…","countries":["AQSh"],"funding":"full","amount":"…","deadline":"2027-01-15","eligibility":"…","requirements":"…","url":"https://…","verifiedAt":"2026-11-07"}]}
```

## Universitet maʼlumotlari
`public/data/universities.json`: har bir koʻrsatkichda `satV`, `accV`, `rdV` bayroqlari bor (`true` = rasmiy manbadan tekshirilgan). Hozir 9 ta universitetning SAT oraligʻi va 10 tasining muddati tekshirilgan, qolganlari "taxminiy" deb belgilanadi.

## Arxitektura
Server: bitta `server.js` (JSON baza, scrypt, HttpOnly cookie, tarif tekshiruvi serverda). Frontend: `public/app.html` + ES modullar (`public/js/`), tashqi kutubxonasiz. Hisoblash mantigʻi `public/js/scoring.js` da, server ham, brauzer ham ishlatadi.

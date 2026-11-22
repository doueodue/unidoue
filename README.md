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
| `AI_VISION=1/0` | Sertifikat/diplom rasmini AI oʻqishi (portfolio). Anthropic'da standart **yoqilgan**; OpenAI-mos provayderda rasm qoʻllab-quvvatlasa `AI_VISION=1` qoʻying (model `gpt-4o`, `gpt-5`, `gpt-6` kabi koʻrish qobiliyatli boʻlishi kerak). `0` — oʻchirish; rasm kelsa server aniq xabar bilan 400 qaytaradi |
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

## Portfolio, dizayn studiyasi va esse murabbiyi
**Tarif:** Portfolio **hamma tarifda ochiq** (Free ham ishlatib koʻradi) — tarif **dizayn tanloviga** qarab farqlanadi. Esse murabbiyi — **Plus va Pro** (Free uchun qulf ekrani). Serverda `features` ichida `coach` (Plus+) va `pf_studio` (Pro) bayroqlari bor; `/api/ai` ularni tekshiradi (402 `PLAN_REQUIRED`, kredit yechilmaydi).

**Dizayn matritsasi** (`public/js/pfdesign.js` — yagona manba):

| | Free | Plus | Pro |
|---|---|---|---|
| Andozalar | 2 (ledger, rail) | 5 (+atlas, folio, poster) | 8 (+noir, nova, timeline) |
| Ranglar | 4 palitra | 10 palitra | 16 palitra + **oʻz rangi** (accent + ikkinchi rang) |
| Shriftlar | avto | + serif, sans | + grotesk, display, editorial, mono |
| Fon | yoʻq | qogʻoz, setka, nuqta, mesh | + aurora, toʻlqin, shovqin, yulduz, topo, chizma |
| Effektlar | paydo boʻlish | + hisoblagich, progress, marquee | + spot, tilt, parallax, yozuv, glow |
| Rejim | andoza / yorugʻ | + qorongʻi, tizim | hammasi |
| Shakl / zichlik | yumshoq / qulay | + qirrali | + yumaloq, ixcham |
| **AI dizayner** | — | — | ✅ (2 kredit; loyiha maʼlumotiga qarab dizaynni oʻzi tanlaydi, “Bekor qilish” bor) |

- **Qanday amalga oshirilgan:** `effective(pf, plan)` har doim dizaynni tarif chegarasiga **qisadi** (render darajasida), shuning uchun eski/qoʻlda oʻzgartirilgan maʼlumot ham ruxsatsiz variantni chiqara olmaydi. Studiya (“Dizayn” tabi) qulflangan variantlarni koʻrsatadi va bosilganda Pro/Plus taklifini ochadi. Eksport (PDF/Word/veb) mijozda yigʻiladi, shuning uchun dizayn cheklovlari **interfeys/render darajasida**; AI dizayner (`mode: "design"`) esa **serverda majburiy** (Pro boʻlmasa 402 `pf_studio`). AI javobi `cleanDz` orqali tozalanadi (faqat roʻyxatdagi qiymatlar, hex format tekshiriladi).
- **Veb-sayt eksporti:** bitta mustaqil `.html` — tanlangan dizaynga mos andoza, animatsiyali fonlar, effektlar (`public/js/pfweb.js` fayl ichiga joylanadi), qorongʻi/yorugʻ/tizim rejimi, `prefers-reduced-motion` va bosib chiqarish qoidalari. Oldindan koʻrishda A4 va Veb koʻrinish almashtirgichi bor (veb koʻrinish `sandbox="allow-scripts"` iframe ichida, CSP `script-src 'self'` tufayli `<script src="/js/pfweb.js">`).
- **Fon va uzun matn (A4 + veb):** sahifa foni `<html>` ga beriladi, shuning uchun kontent A4 balandligidan qisqa boʻlsa fon plitkasi takrorlanib, sahifa oxirida **qattiq chok** hosil qilardi (Noir’da yaqqol koʻrindi). Endi `pageBg()` `html{min-height:100%}` beradi, yorugʻlik dogʻlari va yon panel qatlamlari `no-repeat`, pikselli naqshlar (nuqta, setka, yulduz…) esa takrorlanadi. Uzun URL/email/ismlar sahifa chetidan chiqib ketmasligi uchun `body{overflow-wrap:anywhere}` qoʻyilgan. Regressiya: `tests/pf.mjs` (“fon chokini va uzun matn”).
- Fayllar: `pfdesign.js` (matritsa, `effective`, `cleanDz`), `pfcss.js` (A4 bosma andozalar), `pfwebcss.js` (veb andozalar), `pfdoc.js` (HTML yigʻuvchi), `pfweb.js` (effektlar), `pfstudio.js` (studiya UI), `pfai.js` (AI chaqiruvlari).

- **Portfolio** (`#/portfolio`, hamma tarif): foydalanuvchi suhbat-intervyu orqali maʼlumot kiritadi (taʼlim, testlar, faoliyat, mukofotlar, koʻnikmalar), rasm va sertifikat rasmlarini yuklaydi; sayt **avtomatik ball** (toʻliqlik va dalil kuchi boʻyicha evristika, qabul bashorati emas) beradi, AI (3 kredit) tahlil qiladi, yozuvlarni sayqallaydi (2 kredit) va sertifikat rasmidan maʼlumotni oʻqiydi (2 kredit). Chiqarish: PDF (brauzer "Saqlash — PDF" oynasi), Word (.docx, mijozda yigʻiladi; accent rangi tarifga qarab) va mustaqil web-sahifa (.html). Kod: `public/js/portfolio.js`, `pfmodel.js`, `pfai.js`, `pfdoc.js`, `pfdocx.js`, `zip.js`. AI kreditlari: bepul 15, Plus 175, Pro 300 — AI tahlil/sayqal/oʻqish Free uchun ham ishlaydi (kredit hisobidan).
- **Maxfiylik**: sertifikat rasmlari faqat qurilmadagi IndexedDB (`unidoue-pf`)da turadi, hisobga sinxronlanmaydi; matn maʼlumoti `qabul:portfolio` kaliti bilan hisobga saqlanadi. Ommaviy ulashiladigan havola **ataylab yoʻq** (voyaga yetmaganlar maxfiyligi, moderatsiya). Rasmlar AI'ga faqat foydalanuvchi "AI oʻqisin" desa yuboriladi.
- **Esse murabbiyi** (`#/coach`, Plus va Pro; AI mentor ichida "Esse murabbiyi" tabi): motivation letter / personal statement boʻyicha darslar, yaxshi va zaif misollar, mashqlar, bepul mahalliy tekshiruvlar (klishe, noaniq soʻzlar, aniq tafsilotlar, soʻz limiti), bosqichma-bosqich AI fikri (1 kredit) va reja/outline (2 kredit). Murabbiy esseni **yozib bermaydi** — faqat oʻrgatadi va savol beradi. Maʼlumot `qabul:coach` kaliti bilan saqlanadi.
- Testlar: `tests/pf.mjs` (brauzerda portfolio), `tests/run.js` ichidagi “Esse murabbiyi va portfolio (AI)” va “AI_VISION” boʻlimlari.

## AI mentor — Doue
AI mentorning oʻz shaxsi bor: **Doue** (nomi `core.js` dagi `MENTOR`, avatari `mentorAvatar()` — “yoʻl yulduzi”, rangi `--brand` dan, shuning uchun fasl va tungi rejim bilan almashadi). Serverda `SYS` qoidalari (kafolat yoʻq, uydirma raqam yoʻq) hamma vositada bir xil, `MENTOR_VOICE` esa faqat suhbatga qoʻshiladi: iliq, ochiq-oydin, bitta aniq keyingi qadam, inson ekanini daʼvo qilmaydi.
- **Suhbat oynasi** (`views3.js` → `mentor()`, uslublar `app.css` oxiridagi “Doue” boʻlimi): salomlashish ekrani va 4 ta taklif tugmasi, oqimli javob (yozilayotgan kursor), Markdown jadval/roʻyxat, “Nusxalash” va “AI javobi haqida xabar berish”, xato boʻlsa “Qayta urinish”, avtomatik kengayadigan yozish maydoni (Enter — yuborish, Shift+Enter — yangi qator), “Yangi suhbat”. Suhbat Esse murabbiyi ↔ Suhbat tablari orasida saqlanadi (sahifa yangilansa tozalanadi).
- **Chuqur vositalar**: universitetlarni qidirib tanlash (eng koʻpi 8 ta), Qabul strategiyasi va Universitet hisoboti (Pro). Natija kartasi Doue sarlavhasi bilan chiqadi; esse tahlili ham shu sarlavhadan foydalanadi.
- **Jonli (inson) mentor soʻrovi olib tashlangan**: forma ham, `POST /api/request` ham yoʻq. Admin “Soʻrovlar” boʻlimida tarif soʻrovlari, AI javobi haqidagi xabarlar va maʼlumot xatolari qoladi.

## Dizayn tizimi: «Yo‘l daftari»
Butun ilova yagona vizual tilga ega: **`public/atlas.css`** (`app.css` dan keyin, `tiers.css` dan oldin ulanadi) va **`public/contour.svg`** (topografik xarita chiziqlari; faqat CSS `mask` sifatida, `--brand` rangida chiziladi).
- Bosh panel — 5 bekatli «yo‘l» (Profil → Testlar → Ro‘yxat → Arizalar → Natija), keyingi qadam kartasi, mobil qurilmada vertikal ro‘yxat.
- Universitet qidiruvi — Safety/Target/Reach rangli halqa-ball, SAT oralig‘i o‘lchagichi va «Siz» belgisi, 12 tadan ko‘rsatish.
- Yon panel (nuqtali yo‘l, kursiv bo‘lim nomlari, foydalanuvchi kartasi), kirish ekrani, arizalar, yo‘l xaritasi, hujjatlar, profil «pasport»i.
- Mavsum (`data-season`) va qorong‘i rejim ranglari o‘zgaruvchilar orqali ishlaydi; animatsiyalar faqat `prefers-reduced-motion: no-preference` da.
- Sarlavhalar `<em>` bilan bo‘linmaydi — tarjima kaliti butun jumla bo‘lishi kerak.

## Tarif dizayni (shisha uslubi)
Har bir tarifning oʻz shisha (glass) koʻrinishi bor: **Free — muz** (koʻkimtir shaffof), **Plus — kumush** (jilolangan metall, nozik chiziqli), **Pro — oltin** (oltin shisha va yaltiroq **toj**, ustiga sekin yaltirash yuguradi). Ranglar `[data-tier=free|plus|pro]` (yoki `.tier-*`) orqali CSS oʻzgaruvchilari boʻlib beriladi, yorugʻ va qorongʻi tema alohida sozlangan.
- Fayllar: `public/tiers.css` (uslublar), `public/js/tiers.js` (belgilar: `tierPill`, `tierMedal`, `crownHTML`, `liveGlass`; SVG sprite sahifaga bir marta qoʻshiladi).
- Qayerda koʻrinadi: yuqori paneldagi tarif belgisi, yon paneldagi hisob kartasi, **Tariflar** sahifasi (kartalar, Pro ustida toj), qulf ekrani (Esse murabbiyi — Plus kumushi), `upsell()` oynalari (`modal({ tier })`: Plus — kumush, Pro — oltin va toj), portfolio studiyasidagi qulf belgilari va banner.
- Qimirlash (`prefers-reduced-motion`) yoqilgan boʻlsa, toj harakati, yaltirash va kursor nuri oʻchadi. `backdrop-filter` yoʻq brauzerda oddiy toʻq fon ishlatiladi.

## Universitet maʼlumotlari
`public/data/universities.json`: har bir koʻrsatkichda `satV`, `accV`, `rdV` bayroqlari bor (`true` = rasmiy manbadan tekshirilgan). Hozir 9 ta universitetning SAT oraligʻi va 10 tasining muddati tekshirilgan, qolganlari "taxminiy" deb belgilanadi.

## Arxitektura
Server: bitta `server.js` (JSON baza, scrypt, HttpOnly cookie, tarif tekshiruvi serverda). Frontend: `public/app.html` + ES modullar (`public/js/`), tashqi kutubxonasiz. Hisoblash mantigʻi `public/js/scoring.js` da, server ham, brauzer ham ishlatadi.

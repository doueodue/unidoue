# UniDoue — xavfsizlik, hodisaga javob va tiklash

Bu hujjat: (1) qanday himoya bor va u qaysi test bilan tekshiriladi, (2) hodisa (hujum shubhasi) boʻlsa qadam-baqadam nima qilish, (3) qoʻlda sozlanadigan qadamlar, (4) maʼlum cheklovlar.
Sir/kalit qiymatlari hech qachon bu repoga, commit xabarlariga yoki hisobotlarga yozilmaydi.

## 1. Himoya qatlamlari va ularni tekshiruvchi testlar

`npm test` hammasini, `npm run test:security` faqat xavfsizlik testlarini ishga tushiradi. Testlar faqat mahalliy, izolyatsiyalangan serverga (vaqtinchalik papka, tasodifiy port, soxta email provayderi) uruladi.

| Soha | Nazorat | Qanday tekshiriladi |
|---|---|---|
| **Admin kirishi** | Faqat `ADMIN_EMAILS`; har safar emailga 6 xonali kod (10 daq., bir martalik, 5 urinish); `ADMIN_EMAILS` boʻsh boʻlsa hamma uchun yopiq (fail-closed); statik `ADMIN_TOKEN` panelni ochmaydi (faqat `/api/admin/remind`) | `tests/run.js` «Admin kodli kirish», `tests/security.js` «Admin yoʻllari» |
| **Seans** | HttpOnly + SameSite=Strict (+ Secure) cookie; serverda hash bilan saqlanadi; faqat «Chiqish»/bekor qilishda tugaydi; qurilmalar roʻyxati, bittasini yoki hammasini yopish | `tests/run.js`, UI testi |
| **Deny-by-default** | Har bir `/api/admin/*` yoʻli `admGate/admAuth` orqali; yangi yoʻl himoyasiz qoʻshilsa test yiqiladi; soxta cookie, Bearer, `x-admin-token`, `?token=` ochmaydi | `tests/security.js` (statik + dinamik skan) |
| **Brute-force** | Admin kodini taxmin qilish **hisob boʻyicha** sanaladi (IP almashtirish yordam bermaydi): 10 xatodan keyin 15 daqiqa blok; foydalanuvchi login lockout; IP/endpoint limitlari | `tests/security.js` |
| **Step-up** | Ommaviy xat (>1 qabul qiluvchi) va xatni qayta yoqish uchun emailga yangi kod (10 daq. oyna) | `tests/security.js` |
| **IP soxtalashtirish** | `X-Forwarded-For` chap tomoni hujumchi yozishi mumkin → faqat proksi (Cloudflare) sarlavhasi yoki XFF ning **oʻng** tomoni ishlatiladi | `tests/security.js` (qizil→yashil) |
| **Host-header** | Parol tiklash havolasi faqat ishonchli domen asosida | `tests/security.js` |
| **Prototip kalitlari** | `__proto__`, `constructor` kabi kalitlar bilan tarif/kredit limitini buzish yopilgan (null-prototip lugʻatlar) | `tests/security.js` |
| **Email suiisteʼmoli** | Markaziy `mailGate`: manzil validatsiyasi, bitta manzilga/umumiy kvota, global oʻchirgich (`MAIL_DISABLED`, panel), admin xatlari faqat `ADMIN_EMAILS` ga, ommaviy xat limiti | `tests/security.js` |
| **Urinishlar** | Admin panelga kirishga uringanlar IP boʻyicha jamlanadi (ruxsatsiz email bilan kod soʻrash, notoʻgʻri kod, seanssiz admin API va mavjud boʻlmagan admin yoʻllarini skanerlash, favqulodda rejim vaqtidagi urinish, `/admin` sahifasini ochish); yozilgan email tasdiqlanmagan matn sifatida koʻrsatiladi; eng koʻpi 500 IP, toʻlsa avval faqat sahifa ochganlar siqib chiqariladi; query-parametrlar (token) yozilmaydi; admin sahifasi «Urinishlar» | `tests/security.js` «Urinishlar jurnali» |
| **Jurnal** | Zanjirlangan (hash + prev + seq) xavfsizlik jurnali; oʻzgartirish/oʻchirish/almashtirish aniqlanadi; sir (kod, token, parol) yozilmaydi; stdout ga ham nusxa (Render loglari = ilovadan tashqari nusxa) | `tests/security.js` |
| **Ogohlantirish** | Yangi qurilma, kodni taxmin qilish, cheklash, ommaviy xat, xat kvotasi tugashi, parol toʻldirish, trafik keskin oshishi → email (faqat `ADMIN_EMAILS`) + push; soatiga bir tur, sutkasiga 24 ta | `tests/security.js` |
| **Favqulodda** | `ADMIN_LOCKDOWN=1`, `ADMIN_REVOKE_BEFORE`, `SESSIONS_REVOKE_BEFORE`, panelda «Hamma qurilmalardan chiqarish» | `tests/security.js` |
| **Brauzer himoyasi** | Qattiq CSP (skriptlar uchun `unsafe-inline` yoʻq), HSTS, X-Frame-Options: DENY, nosniff, Referrer/Permissions-Policy; CORS ochilmagan; xato javoblarida stek/yoʻl yoʻq; `server.js`, `db.json`, `.git` va h.k. fayllar tarqatilmaydi | `tests/security.js` |
| **Maʼlumot sizishi** | `/api/me` va admin javoblarida parol hashi, tasdiqlash kodi, token yoʻq | `tests/security.js` |
| **XSS** | Admin panelda hamma foydalanuvchi/UA/xat matni `esc()` orqali; hujumchi UA sarlavhasidagi skript ishlamaydi | Headless Chrome tekshiruvi |
| **Sirlar** | Repoda kalit koʻrinishlari yoʻq; `.gitignore`: `db.json`, `security.log`, `.env`; `render.yaml` da qiymatlar yoʻq (`sync:false`/`generateValue`) | `tests/security.js` «Sirlar»; CI: gitleaks (toʻliq tarix) |
| **Zaxira** | `tools/backup.js`: manifest + SHA-256, ixtiyoriy AES-256-GCM (`BACKUP_PASSPHRASE`), verify, restore (buzilgan zaxira tiklanmaydi, eski fayl saqlanadi) | `tests/backup.js` (tiklangan maʼlumot bilan server ishga tushadi, foydalanuvchi kiradi) |
| **Ta'minot zanjiri** | Tashqi paket yoʻq (zero-dependency); `package-lock.json`; Dependabot (Actions + npm); CodeQL (SAST); gitleaks; minimal huquqli workflow | `.github/` |

### OWASP bilan moslik (qisqa)
- **Top 10 2021:** A01 Broken Access Control (deny-by-default testi), A02 (parollar tuzli scrypt bilan, admin kodlari HMAC-hash bilan saqlanadi, taqqoslash timingSafeEqual), A03 Injection (tashqi SQL/shell yoʻq; JSON-fayl DB; Neon soʻrovlari parametrlangan), A04 (kvotalar, step-up), A05 Misconfiguration (sarlavhalar, fail-closed), A07 AuthN failures (OTP, lockout, seans), A09 Logging (zanjirlangan jurnal, ogohlantirish), A10 SSRF (serverning tashqi soʻrovlari faqat sozlangan provayderlarga; foydalanuvchi bergan yagona manzil — push obunasi — `push.js validEndpoint` roʻyxati (FCM/Mozilla/WNS/Apple, https, portsiz) bilan cheklangan, `tests/push.js` da tekshiriladi; `PUSH_EXTRA_HOSTS` faqat sinov uchun, productionda qoʻymang).
- **API Top 10 2023:** API1 BOLA (foydalanuvchi yoʻllari resursni faqat sessiyadagi hisob orqali oladi, boshqa hisob identifikatori qabul qilinmaydi; yagona istisno — xatdagi obuna bekor qilish havolasi HMAC imzo + timingSafeEqual bilan; boshqa hisobga kirish `tests/run.js` da tekshiriladi), API2 Broken Auth, API3 (javoblarda maxfiy maydon yoʻq), API4 Resource consumption (hajm/limit/kvota), API5 BFLA (admin yoʻllari), API6 sensitive flows (roʻyxatdan oʻtish/parol tiklash/ommaviy xat limitlari), API8 Misconfiguration, API9 Inventory (yoʻllar manbadan skan qilinadi).
- **ASVS 4 (V2, V3, V4, V7, V8, V14)** — yuqoridagi jadvaldagi nazoratlar orqali; toʻliq ASVS sertifikatsiyasi emas, oʻz-oʻzini baholash.

## 2. Hodisaga javob (runbook)

**Belgi:** «Himoya holati» sahifasida/emailda ogohlantirish; «Kirishlar» da notanish IP/qurilma; kutilmagan xat yuborish; panel «Jurnal buzilgan» deydi.

### 2.1. Zudlik bilan toʻxtatish (5 daqiqa)
1. **Render → Environment**: `ADMIN_LOCKDOWN=1` → Save (qayta deploy). Admin paneli va admin API butunlay yopiladi, mavjud seanslar ishlamaydi.
2. Xat suiisteʼmoli boʻlsa: `MAIL_DISABLED=1` (yoki panel ochiq boʻlsa «Xat yuborishni toʻxtatish»).
3. Foydalanuvchi sessiyalari ham shubhali boʻlsa: `SESSIONS_REVOKE_BEFORE=<hozirgi vaqt, ISO>` — hamma qayta kiradi.

### 2.2. Dalillarni saqlash (sirlarni almashtirishdan OLDIN)
- Render → Logs: `SEC {` bilan boshlanuvchi qatorlar zanjirlangan jurnal nusxasi. Butun logni faylga eksport qiling (Render log retention cheklangan).
- `node tools/backup.js backup` (yoki Render shell dan `db.json` va `security.log` nusxasi). **Fayllarni oʻchirmang va tahrirlamang.**
- Resend/Brevo dashboard → yuborilgan xatlar roʻyxati (kim, qachon, nechta); Neon → qoʻshimcha loglar; GitHub → Settings → Security log / Audit log.
- Hujumchining IP/UA — «Kirishlar» sahifasi va `security.log` dagi `admin.login.*`, `admin.*` yozuvlari.

### 2.3. Sirlarni almashtirish (har birini **siz** bajarasiz; bu yerda qiymat yozilmaydi)
1. `ADMIN_TOKEN` — Render da yangi tasodifiy qiymat (≥32 belgi). Rejalashtiruvchi (cron) ishlatsa, unda ham yangilang.
2. Email provayder API kaliti (Resend/Brevo) — dashboard da eskisini **bekor qiling** (revoke), yangisini Render ga qoʻying.
3. `DATABASE_URL` (Neon) — parolni reset qiling → yangi ulanish manzilini Render ga.
4. `ANTHROPIC_API_KEY`/`AI_API_KEY`, `TG_BOT_TOKEN`, Payme/Click kalitlari, `GOOGLE_CLIENT_SECRET` — tegishli kabinetda aylantiring.
5. `VAPID_PRIVATE_KEY` — aylantirilsa mavjud push obunalari bekor boʻladi (foydalanuvchilar qayta yoqadi); faqat tarqalgan boʻlsa.
6. GitHub: parol/2FA, Personal Access Token va Render ↔ GitHub ulanishini tekshiring; repoda Secret scanning/Push protection yoqilgan boʻlsin.
7. Almashtirgach `ADMIN_REVOKE_BEFORE=<hozirgi vaqt>`, soʻng `ADMIN_LOCKDOWN` ni oʻchiring → faqat `ADMIN_EMAILS` dagi email yangi kod bilan kiradi.

### 2.4. Tahlil
- Kim urinib koʻrdi: admin → «Urinishlar» (IP boʻyicha: nima qildi, yozgan emaili, qaysi yoʻllarga urildi, hozir cheklanganmi / bloklanganmi).
- Notanish IP ogohlantirishi: har bir yangi IP ning **birinchi jiddiy urinishida** (ruxsatsiz email bilan kod soʻrash, notoʻgʻri kod, seanssiz admin API, favqulodda rejimda urinish, bloklangan IP dan soʻrov) administratorga darhol email+push keladi. Faqat `/admin` sahifasini ochish ogohlantirish bermaydi. Hujum boʻroni inboxni toʻldirmasligi uchun: soatiga 3 ta, sutkasiga 8 ta (alohida hisob — muhim ogohlantirishlar oʻrnini egallamaydi). Faol admin seansi IP si va oldin muvaffaqiyatli kirilgan (kod tasdiqlangan) IP lar «notanish» hisoblanmaydi — oʻz emailingizni adashib yozsangiz ogohlantirish kelmaydi. Butunlay oʻchirish: `ADMIN_ATT_ALERT=0` (jurnal va Urinishlar sahifasi ishlayveradi).
- Kim kirdi: «Kirishlar» + `admin.login`, `admin.login.bad`, `admin.login.ask.denied`.
- Nima qilindi: `admin.*` (notify, mail.switch, push.send, plan, …) yozuvlari — har bir oʻzgartiruvchi amal `who`, `ip` bilan yoziladi.
- Qaysi maʼlumot koʻrilgan: admin GET lar `Kirishlar` jurnalida (`use`), lekin tarkibi yozilmaydi — admin kirgan boʻlsa, **foydalanuvchilar roʻyxati, fikrlar, xatlar jurnali va toʻlovlar koʻrilgan** deb hisoblang.
- Foydalanuvchilarga taʼsir: parol hashlari admin javoblarida yoʻq; foydalanuvchi emaillari/ismlari koʻrilgan boʻlishi mumkin → qonun talab qilsa xabardor qiling.

### 2.4.1. IP ni bloklash
- Admin → «Urinishlar» → IP qatoridagi **«Bloklash»** (1 soat / 24 soat / 7 kun / doimiy) → **«Bloklangan IP lar»** kartasida koʻrinadi, **«Blokdan chiqarish»** bilan qaytariladi. Har bir amal xavfsizlik jurnaliga (`admin.ip.blocked` / `admin.ip.unblocked`, kim va qaysi IP) yoziladi.
- Bloklangan IP **`/admin` sahifasi va `/api/admin/*` ga 403** oladi — hatto oʻgʻirlangan admin cookie yoki token bilan ham. Saytning qolgan qismi (foydalanuvchilar uchun) bu IP ga ishlayveradi.
- Himoya: oʻz IP ingiz va faol admin seansi IP si bloklanmaydi (409); IP manzil va muddat qatʼiy tekshiriladi (muddat aniq berilishi shart); `::ffff:1.2.3.4` va `1.2.3.4` bitta manzil hisoblanadi; chegara 200 ta (`ADMIN_BLOCK_MAX`, eng koʻpi 1000); muddati tugagan blok oʻzi olinadi; bloklar server qayta ishga tushganda saqlanadi.
- **Cheklov:** bu faqat admin yuzasini yopadi va aniq bitta manzilni bloklaydi. IPv6 hujumchi /64 ichida manzilni almashtira oladi, botnet esa koʻp IP dan keladi; butun saytni yoki IP diapazonlarini yopish uchun Cloudflare WAF / IP Access Rules dan foydalaning. Asosiy himoya baribir emailga kod (hujumchi IP bloklanmasa ham kira olmaydi).

### 2.4.2. Foydalanuvchini bloklash (email, domen, IP — butun sayt bo‘yicha)
- Admin → **«Foydalanuvchilar»** → qatordagi **«Bloklash»** (muddat, sabab, ixtiyoriy: uning IP si ham) yoki **«Bloklash»** bo‘limi → email / `@domen` / IP qo‘lda qo‘shiladi. Ro‘yxat va «Blokdan chiqarish» ham shu bo‘limda. Har bir amal xavfsizlik jurnaliga (`admin.user.blocked` / `admin.user.unblocked`, email faqat xesh ko‘rinishida) yoziladi.
- **Bloklangan email**: kira olmaydi (to‘g‘ri parol bilan ham `403 BLOCKED`; noto‘g‘ri parolda oddiy 401 — email bloklangani sizib chiqmaydi), Google orqali ham kira olmaydi, qayta ro‘yxatdan o‘ta olmaydi, parolni tiklash xati ketmaydi, ommaviy xat/push/eslatmalar ketmaydi; mavjud sessiyalari va tiklash havolalari bekor qilinadi. **Ma’lumotlari o‘chmaydi** — blokdan chiqarilsa hammasi qaytadi. Gmail’da nuqta va `+belgi` bir xil pochta qutisi hisoblanadi (`jo.hn+x@gmail.com` = `john@gmail.com`).
- **Domen bloki** (`@spam-domen.com`): shu domendagi barcha hisoblar (mavjudlari ham) va yangi ro‘yxatdan o‘tish yopiladi. Administrator emaili yoki uning domeni bloklanmaydi (409).
- **IP bloki, qamrov**: *Butun sayt* — shu IP dan hamma narsa (sahifalar, API, ro‘yxatdan o‘tish, `/admin`) 403 oladi (`/healthz` va to‘lov webhooklari bundan mustasno); *Faqat admin paneli* — oldingi xatti-harakat (2.4.1). Oʻz IP ingiz va faol admin seansi IP si bloklanmaydi. Bitta IP dan bir necha kishi chiqishi mumkin (maktab, ofis, mobil operator) — butun sayt bo‘yicha bloklashdan oldin o‘ylab ko‘ring.
- **IP yozib borish:** har foydalanuvchi uchun birinchi (`ip0`) va oxirgi (`ip`) kirgan IP si saqlanadi; faqat admin jadvalida ko‘rinadi (foydalanuvchiga qaytarilmaydi), hisob o‘chirilganda u ham o‘chadi, maxfiylik siyosatida e’lon qilingan. Jadvalda bir IP dan kirgan hisoblar soni ko‘rsatiladi.
- **«Siz bloklandingiz» ekrani:** bloklangan kishi (kirish, ro‘yxatdan o‘tish, Google orqali kirish, ilovada ochiq turgan seans) animatsiyali to‘liq ekran ko‘radi (`public/js/blocked.js`, `public/blocked.css`, tun/kun rejimi, uz/ru/en, mobil). Unda faqat holat va (vaqtincha blokda) tugash vaqti/qolgan vaqt ko‘rsatiladi — **ichki sabab ko‘rsatilmaydi**. Butun-sayt IP blokida JavaScriptsiz sahifa (`blockpage.js`, `Accept-Language` bo‘yicha til) beriladi. Bloklanganda seanslar o‘chirilmaydi, balki yaroqsiz deb belgilanadi (`blk`, 7 kun saqlanadi): shu bilan foydalanuvchi ekranni ko‘radi, blokdan chiqarilgach esa eski seans qayta jonlanmaydi (qayta kirish kerak).
- Chegara: email/domen bloklari 2000 ta (`USER_BLOCK_MAX`, eng ko‘pi 20 000); muddati tugagan blok o‘zi olinadi; bloklar server qayta ishga tushganda saqlanadi (`db.json` / Neon).

### 2.4.3. Sayt faolligi (kim online, kim qachon kirdi va chiqdi)
- Admin → **«Sayt faolligi»**: hozir online foydalanuvchilar va mehmonlar (har biri qaysi sahifada, holati: *Faol* / *Harakatsiz* / *Boshqa oynada*, qurilma va IP), **Tashriflar** (kirdi, chiqdi, davomiylik, ko‘rilgan sahifalar), **Hodisalar** (kirish, chiqish, ro‘yxatdan o‘tish, noto‘g‘ri parol, bloklash, hisobni o‘chirish). Foydalanuvchi nomini bossangiz — uning to‘liq kartasi. Panel har 8 soniyada o‘zi yangilanadi. «Foydalanuvchilar» jadvalida ham online belgisi va oxirgi faollik vaqti ko‘rinadi.
- **Qanday ishlaydi:** brauzer (`public/js/presence.js`) ~40 soniyada `POST /api/ping` yuboradi: sahifa identifikatori (`landing`, `dashboard`, …), oyna ko‘rinishi, harakatsizlik soniyalari, oyna yopilganda `bye`. Matn, forma, kursor, bosilgan tugmalar **yuborilmaydi**. Server (`activity.js`) oynani `tid` (faqat shu oynaning `sessionStorage` ida) bo‘yicha yuritadi; **tashrif** — bitta seansning uzluksiz vaqti. 2,5 daqiqa signal bo‘lmasa — oflayn (`ACTIVITY_OFFLINE_MS`); oyna yopilsa 15 soniya kutiladi (sahifa almashinuvi/qayta yuklash yangi tashrif bo‘lib ketmasin — `ACTIVITY_GRACE_MS`).
- **Xavfsizlik:** ping tezligi IP uchun 150/daq, bitta IP dan 25 tagacha oyna, jami xotira 5000 oyna; `tid` va sahifa nomi qat’iy tekshiriladi (`[a-z0-9]{10,32}` / `[a-z0-9:_/-]{1,32}`), tana 2 KB gacha; admin endpointlari (`/api/admin/online`, `/activity`, `/user/activity`) faqat admin seansi bilan, tezlik limiti bilan, CSRF tekshiruvi bilan. Bloklangan foydalanuvchining pingi «blocked» javobini oladi va unga «Siz bloklandingiz» ekrani chiqadi. Hisob o‘chirilsa/bloklansa/chiqib ketsa uning online yozuvlari darhol yopiladi.
- **Saqlash:** tashriflar va hodisalar `db.json` (yoki Neon) da, **5 daqiqada bir marta** yoziladi (`ACTIVITY_SAVE_MS`; har pingda butun bazani yozish Render xotirasini oshirib yuborgan edi) va server o‘chirilganda (deploy) baribir yoziladi; har biri eng ko‘pi 3000 ta (`ACTIVITY_VISITS_MAX`, `ACTIVITY_EVENTS_MAX`; eskilari avtomatik o‘chadi). **Mehmonlar** (kirmaganlar) faqat server xotirasida va faqat «hozir» ko‘rinadi, jurnalga yozilmaydi. Hisob o‘chirilganda uning barcha tashrif/hodisalari o‘chadi; faqat «hisob o‘chirildi» yozuvida **yashirilgan** email (`a***@gmail.com`) qoladi. Maxfiylik siyosatida e’lon qilingan.
- **Cheklov:** server qayta ishga tushsa (deploy) online ro‘yxati bir necha soniyada qayta to‘ladi (brauzerlar o‘zi ping yuboradi), ochiq tashriflar oxirgi ma’lum vaqtida yopiladi. «Online» aniqligi ±40 soniya; telefon brauzeri fonga o‘tganda signal to‘xtashi mumkin (2,5 daqiqadan keyin oflayn deb ko‘rsatiladi).

### 2.5. Tiklash
1. `node tools/backup.js verify <zaxira>` → OK boʻlsa `restore <zaxira> --data <DATA_DIR> --force` (eski fayl `.pre-restore-<vaqt>` nomi bilan saqlanadi).
2. Serverni ishga tushiring; `/healthz`, admin kirish (yangi kod), «Himoya holati» (jurnal zanjiri butun) ni tekshiring.
3. Neon ishlatilsa: Neon konsolida point-in-time restore (branch) imkoniyatidan foydalaning; tiklangan branch ulanish manzilini `DATABASE_URL` ga qoʻying.
4. `MAIL_DISABLED` va `ADMIN_LOCKDOWN` ni olib tashlang, hodisa hisobotini yozing (nima, qachon, qanday aniqlandi, nima oʻzgartirildi).

## 3. Qoʻlda sozlanadigan (kod bilan hal boʻlmaydigan) qadamlar
1. **Render → Environment:** `ADMIN_EMAILS` (admin emaili), `COOKIE_SECURE=1`, `TRUST_PROXY=1` (render.yaml da bor), `ADMIN_ALLOW_TOKEN` **qoʻymang**. `ADMIN_TOKEN` ni almashtiring (eski token tarqalgan deb hisoblang).
2. **Email domeni (SPF/DKIM/DMARC):** Resend/Brevo da oʻz domeningizni tasdiqlang va DNS ga qoʻying (provayder aniq qiymatlarni beradi). Namuna:
   - SPF (TXT, `@`): `v=spf1 include:<provayder-spf> ~all` (faqat bitta SPF yozuvi boʻlsin)
   - DKIM: provayder bergan CNAME/TXT yozuvlari
   - DMARC (TXT, `_dmarc`): avval `v=DMARC1; p=none; rua=mailto:<hisobot-emaili>`, 2–4 haftadan keyin `p=quarantine`, soʻng `p=reject`
   `MAIL_FROM` shu domendan boʻlsin (Gmail manzilidan yuborish DMARC ni oʻtkazmaydi).
3. **Cloudflare / WAF (ixtiyoriy, tavsiya):** domenni Cloudflare orqali ulang → Bot Fight Mode, `/api/*` uchun Rate Limiting qoidasi (masalan, IP boshiga 60 soʻrov/daq.), `/admin` va `/api/admin/*` uchun qoʻshimcha qoida (faqat sizning mamlakat/ASN yoki Cloudflare Access). Cloudflare ortida `CLIENT_IP_HEADER=cf-connecting-ip` qoʻying. Ilovadagi limitlar bitta instansiya xotirasida — WAF bu qatlamni toʻldiradi.
4. **GitHub:** Settings → Branches → `main` uchun qoidalar (PR + CI «test» va «secrets» majburiy, force-push taqiqi); Code security → Secret scanning + Push protection + Dependabot alerts yoqing; barcha hisoblarda 2FA (GitHub, Render, Neon, Resend/Brevo, Cloudflare, Google).
5. **Doimiy saqlash:** `DATABASE_URL` (Neon) yoki Render disk (`DATA_DIR=/data`) — aks holda bepul rejada server qayta ishga tushganda hisoblar, admin seanslari va `security.log` yoʻqoladi. `security.log` fayli ham shu diskda; tashqi nusxa — Render loglari (`SEC` qatorlari). Kerak boʻlsa Render Log Streams orqali tashqi tizimga yuboring.
6. **Zaxira jadvali:** `BACKUP_PASSPHRASE` ni oʻzingizda saqlang; `npm run backup` ni muntazam (masalan haftalik) bajaring va faylni **serverdan tashqarida** saqlang; kamida chorakda bir marta `verify` + `restore` ni test papkasida sinab koʻring.
7. **Resend/Brevo:** API kalitiga faqat «send» huquqi, yuborish limiti dashboard da ham qoʻyilsin.

## 4. Maʼlum cheklovlar va qoldiq xavflar
- Tezlik limitlari va ogohlantirish hisoblagichlari **bitta instansiya xotirasida** (qayta ishga tushganda nollanadi, koʻp instansiyada taqsimlanmaydi). Koʻp instansiyaga oʻtilsa — Redis/WAF kerak.
- Admin kodi faqat email orqali (emailga kirish = adminga kirish). Email hisobingizda 2FA majburiy. TOTP/passkey hozircha yoʻq.
- Admin roli bitta (RBAC/«faqat oʻqish» rolli adminlar yoʻq); qayta tasdiqlash faqat eng xavfli amallarga qoʻyilgan (ommaviy xat, xatni qayta yoqish).
- Xavfsizlik jurnali — zanjirlangan, lekin bir xil serverda saqlanadi: serverga toʻliq egalik qilgan hujumchi uni boshidan qayta yozishi mumkin. Shu sababli stdout (Render loglari) nusxasi saqlanadi; tashqi log yigʻish tavsiya etiladi.
- Maʼlumotlar bazasi — JSON fayl/Neon; saqlashda shifrlash (encryption at rest) provayder darajasida (Render disk, Neon). Zaxiralar `BACKUP_PASSPHRASE` bilan shifrlanadi.
- Tashqi paket yoʻqligi uchun `npm audit` boʻsh; Node versiyasi va Render image yangilanishlari Render zimmasida (Node ≥18; tavsiya: LTS).
- DDoS himoyasi ilova darajasida emas — Cloudflare/Render tarmogʻi darajasida (3-band).

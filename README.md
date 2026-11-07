# UniDoue 2.0

Xorijda oʻqish platformasi: universitet qidiruvi (Safety/Target/Reach), qabul bashorati, solishtirish, arizalar kuzatuvchisi, esse yordamchisi, AI mentor, tariflar.

- `/` — eski sayt (barcha eski funksiyalar saqlangan)
- `/app` — yangi platforma (hisob, dashboard, tariflar, AI vositalar)

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
| `ANTHROPIC_API_KEY` | AI mentor, esse tahlili, strategiya, hisobot. **Kalitsiz AI "ulanmagan" holatida turadi** |
| `AI_MODEL` | AI modeli (standart: `claude-sonnet-5-5`) |
| `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL` | Parolni tiklash xati. Kalitsiz "ulanmagan" xabari chiqadi |
| `TG_BOT_TOKEN`, `TG_CHAT_ID` | Mentor va tarif soʻrovlari Telegramga kelishi uchun |

## Tarif berish (toʻlov ulanmaguncha)
```bash
curl -X POST https://SAYT/api/admin/plan -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"email":"user@gmail.com","plan":"plus","days":30}'
```
Foydalanuvchi soʻrovlari: `GET /api/admin/requests`. Toʻlov provayderi ulanganda shu endpoint webhookdan chaqiriladi.

## Stipendiyalar bazasi
`DATA_DIR/scholarships.json` (yoki `catalog/scholarships.json`) fayli. Faqat **rasmiy manbadan tekshirilgan** yozuvlar qoʻshing:
```json
{"updated":"2026-11-07","items":[{"name":"…","provider":"…","countries":["AQSh"],"funding":"full","amount":"…","deadline":"2027-01-15","eligibility":"…","requirements":"…","url":"https://…","verifiedAt":"2026-11-07"}]}
```

## Universitet maʼlumotlari
`public/data/universities.json`: har bir koʻrsatkichda `satV`, `accV`, `rdV` bayroqlari bor (`true` = rasmiy manbadan tekshirilgan). Hozir 9 ta universitetning SAT oraligʻi va 10 tasining muddati tekshirilgan, qolganlari "taxminiy" deb belgilanadi.

## Arxitektura
Server: bitta `server.js` (JSON baza, scrypt, HttpOnly cookie, tarif tekshiruvi serverda). Frontend: `public/app.html` + ES modullar (`public/js/`), tashqi kutubxonasiz. Hisoblash mantigʻi `public/js/scoring.js` da, server ham, brauzer ham ishlatadi.

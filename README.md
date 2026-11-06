# UniDoue

Universitetga yoʻl — real ilova: email + parol bilan hisob, serverda saqlanadigan profil/arizalar.

## Ishga tushirish (kompyuterda)

```bash
node server.js          # Node 18+ kerak, paket oʻrnatish shart emas
# http://localhost:3000
```

## Internetga chiqarish (production)

Server oddiy Node jarayoni, shuning uchun Render, Railway, Fly.io yoki oddiy VPS (Ubuntu + nginx) da ishlaydi.

Muhim sozlamalar (environment variables):

| Oʻzgaruvchi | Nima uchun |
|---|---|
| `COOKIE_SECURE=1` | HTTPS da cookie xavfsiz boʻlishi uchun (**majburiy**) |
| `TRUST_PROXY=1` | Render/Railway/nginx ortida haqiqiy IP aniqlash uchun |
| `DATA_DIR=/data` | Maʼlumotlar papkasi. **Doimiy disk (volume) ulang**, aks holda qayta ishga tushganda hisoblar yoʻqoladi |
| `TG_BOT_TOKEN`, `TG_CHAT_ID` | Mentor soʻrovlari Telegramga kelishi uchun (ixtiyoriy) |
| `ADMIN_TOKEN` | `GET /api/admin/requests` (Bearer token) orqali soʻrovlarni koʻrish |

Maʼlumotlar `DATA_DIR/db.json` da (parollar scrypt bilan hashlangan). Zaxira uchun shu faylni muntazam nusxalang.

## Hozir yoʻq (keyingi qadamlar)

- Email tasdiqlash va "parolni unutdim" — email yuboruvchi xizmat (Resend, Brevo, SMTP) kerak.
- "Google bilan kirish" — Google Cloud da OAuth client yaratish kerak.
- 1000+ foydalanuvchidan keyin `db.json` oʻrniga PostgreSQL/SQLite.
- Universitet maʼlumotlari hali namuna; rasmiy manbadan tekshirib chiqing.

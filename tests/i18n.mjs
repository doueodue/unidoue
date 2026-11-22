// RU/EN tarjima toʻliqligi: dinamik (raqamli) matnlar va asosiy kalitlar. Ishga tushirish: node --no-warnings tests/i18n.mjs
globalThis.document = { documentElement: {}, addEventListener() {}, body: null };
const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => (store[k] = v) };
const I = await import('../public/js/i18n.js');
const SAMPLES = [
  'SAT 1400 oraliq (1360–1470) ichida (tekshirilgan: 2025-26)',
  'SAT 1400 oraliq (1300–1490) ichida (taxminiy, tekshirilmagan)',
  'SAT 1400 oraliq (1430–1500) ning quyi chegarasidan 30 ball past (tekshirilgan: Class of 2029 (fall 2025 entry))',
  'SAT 1500 universitet o‘rta 50% oralig‘i (1300–1450) ning yuqori chegarasidan yuqori (taxminiy, tekshirilmagan)',
  'GPA 3.68/4; universitet ko‘rsatkichi ~3.9 (tekshirilgan)',
  'Esse qisqa (120 so‘z). Common App uchun odatda 250–650 so‘z kerak.',
  'Esse uzun (700 so‘z). Common App chegarasi 650 so‘z.',
  'Hajmi mos (400 so‘z).',
  'Gaplar uzun (o‘rtacha 31 so‘z). Qisqaroq gaplar o‘qishni osonlashtiradi.',
  '3 ta gap 35 so‘zdan uzun, ularni bo‘ling.',
  'Ko‘p takrorlangan so‘zlar: robot (5), learn (4).',
  'Bitiruv sanasi: 20-iyun, 2027. Keyingi qadam — arizalar va muddatlar.',
  '21-dekabr, 2026 gacha', 'REA: 1-noyabr, 2026', '3 hafta', '≈ 2 oy',
  'Free tarifda 1 tagacha ariza saqlanadi.', 'Joriy tarifda 3 tagacha ariza saqlanadi.',
  'Pro tarifida eng koʻpi bilan 1000 ta ariza saqlanadi.', 'Free tarifida bir vaqtda 3 ta universitet solishtiriladi.',
  'Bir vaqtda 4 tagacha universitet (PRO tarifi).', 'Rice University allaqachon ro‘yxatda.', 'Rice University allaqachon arizalar ro‘yxatida.',
  'Rice University arizasi ro‘yxatdan olib tashlanadi.', 'Rice University arizalarga qo‘shildi.',
  'Universitet hisoboti (6)', 'Qabul strategiyasi (6)',
  'SAT ni kamida 1300 ga ko‘tarish moslikni sezilarli oshiradi.', 'IELTS ni 6.5 ga yetkazing.', '5/10 · ulushi 35%', 'Tiklandi: 4 ta yozuv.',
  'MIT: nima noto‘g‘ri? Iloji bo‘lsa, to‘g‘ri qiymat va rasmiy sahifa havolasini yozing.',
  'Promo kodingiz bormi?', 'Kodni kiriting — Plus yoki Pro bepul yoqiladi.', 'Faollashtirish', 'Promo kodni kiriting.', 'Plus yoqildi', 'Pro tarifi yoqildi', 'Promo kod qabul qilindi. Amal qilish muddati:',
  'Bunday promo kod topilmadi. Yozilishini tekshiring.', 'Bu promo kod hozir faol emas.', 'Bu promo kodning amal qilish muddati tugagan.', 'Siz bu promo koddan allaqachon foydalangansiz.', 'Bu promo kod boʻyicha joylar tugagan.',
  'Sizda bundan yuqoriroq tarif faol, shuning uchun bu kod kerak emas.', 'Bu tarif sizda muddatsiz yoqilgan.', 'Juda koʻp notoʻgʻri urinish. 15 daqiqadan keyin qayta urinib koʻring.',
  'Universitetlarni solishtirish', 'Stipendiya qidiruvi', 'Oddiy va shaffof tariflar', 'Mening profilim', 'Keyingi qadam', 'Testlar', 'Ro‘yxat', 'bosqich bajarildi', 'Siz', 'Yana ko‘rsatish', 'Universitetlar ro‘yxatini tuzing', 'SAT yoki IELTS natijangizni kiriting', 'Birinchi arizani qo‘shing', 'Barcha bosqichlar bajarildi',
  'Bekor', 'Arizani o‘chirasizmi?', 'Tarifni pasaytirasizmi?', 'Hisobni o‘chirasizmi?', 'Hisob ochish bilan', 'maxfiylik siyosati', 'Graduategacha', 'kun qoldi',
  'Raqobatbardosh', 'Kuchli moslik', 'Qiyin', 'Juda qiyin', 'Mosligingizni', 'Erta muddatlar', 'Olib tashlash', 'muddat o‘tgan', 'Sanani o‘zgartirish',
  'Hali vaqt bor: testlarga tayyorlaning va universitetlar ro‘yxatini shakllantiring.', 'Profilni kuchaytirish kerak', 'Nimani yaxshilash kerak',
  '120 so‘z · 640/6000 belgi · kredit: 6 / 15 qoldi', '6 / 15 kredit qoldi', 'SAT yoki IELTS', 'Yetishmaydi: Ism, GPA, SAT yoki IELTS', 'Bu oy uchun AI sarfi chegarasiga yetdingiz. Keyingi oyda yangilanadi.', 'Xato topdingizmi?',
  'Portfolio quruvchi', 'Esse murabbiyi Plus va Pro tarifida mavjud.', 'Plus va Pro tarifida', 'Bu bo‘lim hozirgi tarifingizda yo‘q', 'Plus tarifini ko‘rish', 'Hozirgi tarifingiz:', 'Tarifni yangilagach, bu bo‘lim darhol ochiladi.', 'Esse murabbiyi: darslar, tekshiruv va AI fikri', 'Portfolio quruvchi: PDF, Word, veb-sahifa (2 ta shablon)', 'Portfolio dizayn studiyasi: 8 shablon, fon va effektlar, o‘z ranglaringiz, AI dizayner', 'Portfolio dizayni: 5 ta shablon, 10 rang, fon va effektlar', 'AI mentorga qaytish', 'Bosh panelga qaytish',
  'Dizayn', 'Veb-sayt', 'Dizaynni sozlash', 'AI dizayner', 'AI dizayn tanlasin (2 kredit)', 'Oldingisiga qaytarish', 'Tarifingizda yopiq variantlar:', 'Qog‘oz', 'To‘lqin', 'Kartada yoritish', 'Kursor nuri', 'Qurilmaga qarab', 'Dumaloq', 'Asosiy rang', 'O‘z ranglaringizni tanlash', 'Kobalt', 'Yo‘l', 'Veb-sayt effektlari',
  'Boshlash uchun', 'Jiddiy tayyorgarlik uchun', 'Hammasi ochiq', 'Joriy', 'Pro: hamma dizayn ochiq', 'Barcha shablon, fon, effekt va shriftlar, o‘z ranglaringiz va AI dizayner sizniki.',
  'Bu variant Plus va Pro tarifida ochiladi.', 'AI dizayni qo‘llandi. Xohlasangiz, o‘zingiz o‘zgartiring.', 'AI dizayner va to‘liq dizayn studiyasi (hamma shablon, fon, effekt va o‘z ranglaringiz) Pro tarifida mavjud.',
  'Esse murabbiyi', 'Murabbiy fikrini olish', 'Boshlanmagan', 'Hajmi mos', 'Klishesiz', 'Reja uchun kamida ikkita bosqichni to‘ldiring (har biri kamida 30 belgi).',
  'Avval javobingizni yozing (kamida 40 belgi).', 'Notoʻgʻri bosqich.', 'Tanlangan rasmlar:', 'Yozuvlar yangilandi:', 'Eng ko‘pi bilan 8 ta rasm.', 'sahifalar',
  'Portfolio bahosi', 'AI baholasin (3 kredit)', 'Savollarni boshlash', 'Hujjat rasmlari faqat shu qurilmada saqlanadi. Matn va profil rasmi hisobingizda saqlanadi. “AI rasmdan o‘qisin” bosilgandagina tanlangan rasmlar AI xizmatiga yuboriladi.',
  'Rasmdan oʻqish bu serverda yoqilmagan. Maʼlumotni qoʻlda kiriting.', 'Avval portfolioga maʼlumot kiriting.', 'Tanlanganlarni qo‘llash', 'Rasm juda katta (12 MB dan kichik bo‘lsin).',
  'Bildirishnomalar', 'Bildirishnomani yoqish', 'Bu qurilmada yoqilgan ✓', 'Sinov yuborish', 'Bildirishnoma yoqildi ✓', 'Bildirishnoma ruxsati berilmadi.', 'Sinov xabari yuborildi — bir necha soniyada keladi.',
  'Serverga ulanib bo‘lmadi. Internetni tekshiring.', 'Yuklab bo‘lmadi', 'Tariflarni ko‘rish', 'Payme orqali to‘lash', 'Click orqali to‘lash',
  'Men Doue — qabul yo‘lingizdagi AI mentoringizman. Universitet tanlash, test rejasi, esse va ariza muddatlari bo‘yicha yonma-yon boraman.', 'Profilimga mos universitetlar qaysilar?', 'SAT va IELTS ga qanday tayyorlanay?', 'Motivatsion xatni qanday boshlayman?', 'Stipendiya olish uchun nima qilish kerak?', 'Onlayn · qabul bo‘yicha AI mentor', 'Yangi suhbat', 'Doue’dan so‘rang…', 'Enter — yuborish · Shift+Enter — yangi qator', 'Doue yozmoqda…', 'Chuqur vositalar', 'Tanlangan universitetlar bo‘yicha batafsil hujjat.', 'Universitet qidirish…', 'Safety, target, reach va oylik reja', 'Moslik, tayyorgarlik va xavflar', 'Qabul strategiyasi', 'Universitet hisoboti', 'Nusxalash', 'Ruxsat berish',
  'AI javobi haqida xabar berish', 'AI javobi haqida xabar', 'Nima noto‘g‘ri? (ixtiyoriy)', 'Qabul natijasi hech bir tarifda kafolatlanmaydi.', 'Javob noto‘g‘ri, zararli yoki nomaqbul bo‘lsa, bizga xabar bering. Javob matni ham adminga yuboriladi.',
  'yangi', 'Hozircha xabar yo‘q.', 'Yangiliklar, tarif va muddat eslatmalari shu yerda ko‘rinadi.', 'Yangiliklarni emailga ham yuborish', 'Telefonda bildirishnoma yoqish', 'Tarifingiz yangilandi', 'Promo kod qabul qilindi', 'Juda koʻp soʻrov. Birozdan keyin urinib koʻring.',
  'Rasm yuklash', 'Rasmni almashtirish', 'Rasm yangilandi ✓', 'Rasm olib tashlandi.', 'Rasmni sudrab, yuzni doira o‘rtasiga keltiring.', 'Rasm JPEG formatida boʻlsin.', 'Rasm juda katta. Kichikroq rasm tanlang.', 'Rasm buzilgan. Boshqa rasm tanlang.', 'Rasm oʻlchami mos emas.', 'Juda koʻp urinish. Birozdan keyin urinib koʻring.', 'Universitet, shahar yoki davlat', 'Moslik bali va Safety / Target / Reach darajasini ko‘rish uchun natijalaringizni kiriting.'
];
let bad = 0;
for (const lg of ['ru', 'en']) {
  I.setLang(lg);
  for (const s of SAMPLES) {
    const o = I.trText(s);
    const okTr = o && o !== s && (lg === 'ru' ? /[А-Яа-я]/.test(o) : !/[ʻ‘][a-z]|\b(ning|uchun|bilan|tarif[a-z]*|ariza[a-z]*)\b/i.test(o));
    if (!okTr) { bad++; console.log(`  FAIL [${lg}]`, s, '→', o); }
  }
}
/* Tanishtiruv sahifasi: barcha matnlar RU/EN ga tarjima qilingan (tarjima qilinmaydigan atoqli otlar bundan mustasno) */
{
  const { readFileSync } = await import('node:fs');
  const KEEP = new Set(['UniDoue', 'Georgia Tech', 'Target', 'Doue', 'SAT', 'GPA', 'IELTS', 'Arizona State University', 'SAT 1120–1360', 'Safety', 'Rice University', 'SAT 1510–1560', 'Reach', 'Georgia Institute of Technology', 'A', 'Aziza Karimova', 'Computer Science', 'SAT 1370–1530', 'Purdue University', 'SAT 1220–1480', 'Free', 'Plus', 'Pro']);
  const SAME_EN = new Set(['AI mentor Doue', 'Portfolio']); /* inglizcha yozilishi o‘zbekchadagi bilan bir xil */
  const h = readFileSync(new URL('../public/landing.html', import.meta.url), 'utf8').replace(/<script[^]*?<\/script>/g, '').replace(/<style[^]*?<\/style>/g, '');
  const set = new Set();
  for (const m of h.matchAll(/>([^<>]+)</g)) { const x = m[1].trim(); if (x && /\p{L}/u.test(x)) set.add(x); }
  for (const m of h.matchAll(/\s(?:aria-label|title|alt|placeholder)="([^"]+)"/g)) set.add(m[1].trim());
  for (const m of readFileSync(new URL('../public/js/landing.js', import.meta.url), 'utf8').matchAll(/\bt\('([^']+)'\)/g)) set.add(m[1]);
  for (const lg of ['ru', 'en']) {
    I.setLang(lg);
    const miss = [...set].filter(x => !KEEP.has(x) && !(lg === 'en' && SAME_EN.has(x)) && !I.trText(x));
    if (miss.length) { bad += miss.length; console.log(`  FAIL landing [${lg}] tarjimasiz:`, miss.slice(0, 8)); }
  }
}
I.setLang('ru'); const d = I.trText('21-dekabr, 2026 gacha'); if (d !== 'до 21 декабря 2026') { bad++; console.log('  FAIL sana RU:', d); }
I.setLang('en'); const e = I.trText('21-dekabr, 2026 gacha'); if (e !== 'until Dec 21, 2026') { bad++; console.log('  FAIL sana EN:', e); }
console.log(bad ? `${bad} ta tarjima yetishmaydi` : `tarjima: ${SAMPLES.length * 2 + 2} ta tekshiruv oʻtdi`);
process.exit(bad ? 1 : 0);

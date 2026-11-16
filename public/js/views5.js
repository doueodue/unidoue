import { esc } from './core.js';

/* Hujjatlar yo'riqnomasi: umumiy tushuntirishlar. Aniq talab har universitetning rasmiy saytida. */
const G = [
  ['Transkript (baholar ko‘chirmasi)', ['Maktab beradigan rasmiy hujjat. 9–11-sinflarda har fan bo‘yicha olgan baholaringiz yoziladi.', 'Ichida: ism-familiya, maktab nomi, fanlar va baholar, baholash tizimi izohi (5 ballik), direktor imzosi va maktab muhri.', 'Maktab ma’muriyatidan so‘raysiz. Hujjat ingliz tilida bo‘lishi kerak: ko‘p universitetlar tarjimani, ba’zilari notarial tasdiqlangan tarjimani talab qiladi.', 'GPA shu baholardan hisoblanadi, shuning uchun profilda kiritadigan GPA transkriptga mos bo‘lsin.']],
  ['SAT va IELTS natijalari', ['Natijalar test tashkilotidan universitetga rasmiy yuboriladi. Skrinshot yoki o‘zingiz yozgan ball ko‘pincha yetarli bo‘lmaydi.', 'Ba’zi universitetlar avval o‘zingiz kiritgan ballni qabul qiladi, rasmiy natijani esa qabul bo‘lgandan keyin so‘raydi.', 'Minimal IELTS balli universitetdan universitetga farq qiladi. Ilovadagi “Haqida” oynasida u ko‘rsatilgan bo‘lsa, manbasi bilan turadi.']],
  ['Tavsiyanomalar', ['Odatda o‘qituvchi yoki maktab maslahatchisi yozadi. Sizni yaxshi biladigan o‘qituvchini tanlang.', 'Ularga kamida bir-ikki oy oldin ayting va muddatni yozib bering.', 'Qancha tavsiyanoma kerakligi va kim yozishi mumkinligi universitetning rasmiy saytida yoziladi.']],
  ['Esse', ['O‘zingizni, qiziqishlaringizni va nimalarga erishganingizni sizning ovozingizda tanishtiradigan matn.', 'Real voqeadan boshlang, umumiy gaplardan qoching. Matnni bir necha marta qayta o‘qib, ishonchli odamga ko‘rsating.', 'So‘z soni va savollar universitetga qarab o‘zgaradi.']],
  ['Moliyaviy hujjatlar', ['Ba’zi universitetlar xalqaro talabadan o‘qish uchun mablag‘i borligini tasdiqlovchi hujjat (masalan bank ma’lumotnomasi) so‘raydi.', 'Qaysi hujjat va qanday shaklda kerakligi universitetning xalqaro talabalar bo‘limida yoziladi.', 'Moliyaviy yordam so‘ralayotgan bo‘lsa, alohida forma va muddat bo‘lishi mumkin.']]
];

export async function guide(el) {
  el.innerHTML = `<div class="page-h"><div><h2>Hujjatlar <em>yo‘riqnomasi</em></h2><p>Arizada kerak bo‘ladigan hujjatlar haqida qisqa tushuntirish.</p></div></div>
  <div class="notice info" style="margin-bottom:16px"><div>Bu umumiy ma’lumot. Aniq talab, shakl va muddat uchun har universitetning rasmiy saytidagi “International applicants” bo‘limini tekshiring.</div></div>
  <div class="grid">${G.map(([t, ps], i) => `<details class="card guide" ${i === 0 ? 'open' : ''}><summary><b>${esc(t)}</b></summary>${ps.map(p => `<p style="margin-top:10px;color:var(--ink-2)">${esc(p)}</p>`).join('')}</details>`).join('')}</div>
  <a class="card tg-card" style="margin-top:16px" href="https://t.me/unidoue_yordam" target="_blank" rel="noopener noreferrer"><span class="tg-ic">✈</span><span><b>Savolingiz bormi?</b><small>Telegramda yozing: @unidoue_yordam</small></span><span class="btn sm">Yozish</span></a>`;
}

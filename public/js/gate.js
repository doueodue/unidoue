/* Tarif talab qiladigan sahifalar uchun qulf ekrani (Esse murabbiyi — Plus/Pro, Portfolio — Pro).
   Bu faqat interfeys: AI chaqiruvlarini server oʻzi ham tarif boʻyicha tekshiradi. */
import { S, esc } from './core.js';
import { t } from './i18n.js';
import { mentorTabs, bindMentorTabs } from './views3.js';

const COPY = {
  coach: {
    title: 'Esse murabbiyi', plan: 'Plus', who: 'Plus va Pro tarifida',
    lead: 'Zo‘r esse qanday yoziladi, shuni o‘rganing: qisqa dars, namuna, o‘zingiz yozasiz, murabbiy fikr bildiradi.',
    items: ['Motivatsion xat va shaxsiy esse bo‘yicha qisqa darslar va namunalar', 'Yozayotganda klishe va noaniq so‘zlar bepul belgilanadi', 'Har bosqich uchun AI murabbiy fikri va esse rejasi', 'Esseni siz uchun yozmaydi: o‘rgatadi va savol beradi'],
    cta: 'Plus tarifini ko‘rish', back: ['mentor', 'AI mentorga qaytish']
  },
  portfolio: {
    title: 'Portfolio quruvchi', plan: 'Pro', who: 'Faqat Pro tarifida',
    lead: 'Yutuqlaringizni bir hujjatga jamlang: PDF, Word yoki veb-sahifa. Sayt kerakli ma’lumotni o‘zi so‘raydi.',
    items: ['Suhbat orqali ma’lumot yig‘adi: ta’lim, testlar, faoliyat, mukofotlar', 'Rasm va sertifikat yuklaysiz, AI sertifikatdan ma’lumotni o‘qiydi', 'Portfolioni baholab, nimani kuchaytirish kerakligini aytadi', 'PDF, Word va veb-sahifa sifatida yuklab olinadi'],
    cta: 'Pro tarifini ko‘rish', back: ['dashboard', 'Bosh panelga qaytish']
  }
};
const emTitle = s => { const x = t(s), i = x.lastIndexOf(' '); return i < 0 ? '<em>' + esc(x) + '</em>' : esc(x.slice(0, i)) + ' <em>' + esc(x.slice(i + 1)) + '</em>'; }; // sarlavhaning oxirgi soʻzi kursiv; tarjima bilan ham ishlaydi
const tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const lockIc = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3"/></svg>';
const bar = (w, c = '') => `<i class="${c}" style="width:${w}%"></i>`;

const peek = f => f === 'coach'
  ? `<div class="gate-pk" aria-hidden="true"><div class="gate-pk-h">${bar(38, 'b')}${bar(16)}</div>
     <div class="gate-pk-ed">${bar(92)}${bar(78, 'w')}${bar(86)}${bar(54, 'g')}${bar(90)}${bar(68, 'w')}</div>
     <div class="gate-pk-f"><span class="ok"></span>${bar(60)}</div></div>`
  : `<div class="gate-pk gate-pk-pf" aria-hidden="true"><div class="gate-pk-top"><span class="av"></span><div>${bar(70, 'b')}${bar(46)}</div><span class="ring"></span></div>
     <div class="gate-pk-ed">${bar(100, 'b')}${bar(84)}${bar(92)}${bar(60)}</div><div class="gate-pk-ed">${bar(100, 'b')}${bar(76)}${bar(88)}</div></div>`;

/** `need` — 'coach' | 'portfolio'. Marshrut funksiyasini qaytaradi: el => qulf sahifasi. */
export const gate = need => el => {
  const c = COPY[need], cur = (S.account && S.account.plan) || 'free';
  el.innerHTML = `<div class="page-h"><div><h2>${emTitle(c.title)}</h2><p>${esc(c.lead)}</p></div></div>${need === 'coach' ? mentorTabs('coach') : ''}
  <section class="gate card" aria-labelledby="gt-h">
    <div class="gate-main">
      <span class="gate-chip">${lockIc}<span>${esc(c.who)}</span></span>
      <h3 id="gt-h">Bu bo‘lim hozirgi tarifingizda yo‘q</h3>
      <ul class="gate-ul">${c.items.map(x => `<li>${tick}<span>${esc(x)}</span></li>`).join('')}</ul>
      <div class="gate-act"><a class="btn primary" href="#/pricing">${esc(c.cta)}</a><a class="btn" href="#/${c.back[0]}">${esc(c.back[1])}</a></div>
      <p class="hint"><span>Hozirgi tarifingiz:</span> <b>${esc(cur.toUpperCase())}</b> <span>·</span> <span>Tarifni yangilagach, bu bo‘lim darhol ochiladi.</span></p>
    </div>
    ${peek(need)}
  </section>`;
  if (need === 'coach') bindMentorTabs(el);
};

/* Til tizimi. Asosiy til — oʻzbekcha: kalit sifatida oʻzbekcha matn ishlatiladi. Tarjima boʻlmasa oʻzbekcha chiqadi. */
export const LANGS = [['uz', 'UZ', 'Oʻzbekcha'], ['ru', 'RU', 'Русский'], ['en', 'EN', 'English']];
import { XRU, XEN, RULES } from './i18n_extra.js';
let cur = 'uz';
try { const v = localStorage.getItem('qabul:lang'); if (LANGS.some(l => l[0] === v)) cur = v; } catch (e) {}
export const lang = () => cur;
export function setLang(l) { if (!LANGS.some(x => x[0] === l)) return; cur = l; try { localStorage.setItem('qabul:lang', l); } catch (e) {} document.documentElement.lang = l; }
document.documentElement.lang = cur;

const D = {
  ru: {
    'Armaniston': 'Армения', 'Ozarbayjon': 'Азербайджан', 'Gruziya': 'Грузия', 'Qirg‘iziston': 'Кыргызстан', 'Tayvan': 'Тайвань', 'Lyuksemburg': 'Люксембург', 'Kipr': 'Кипр', 'Vetnam': 'Вьетнам', 'Filippin': 'Филиппины', 'Shveytsariya': 'Швейцария', 'Daniya': 'Дания', 'Norvegiya': 'Норвегия', 'Malayziya': 'Малайзия', 'Avstriya': 'Австрия', 'Ispaniya': 'Испания', 'Belgiya': 'Бельгия', 'Polsha': 'Польша', 'Chexiya': 'Чехия', 'Estoniya': 'Эстония', 'Vengriya': 'Венгрия', 'Portugaliya': 'Португалия', 'BAA': 'ОАЭ', 'Qozog‘iston': 'Казахстан', 'Litva': 'Литва', 'Latviya': 'Латвия', 'Hindiston': 'Индия', 'Tailand': 'Таиланд', 'Rossiya': 'Россия', 'Finlyandiya': 'Финляндия', 'Shotlandiya': 'Шотландия', 'Uels': 'Уэльс', 'Fransiya': 'Франция', 'Italiya': 'Италия', 'Avstraliya': 'Австралия', 'Yangi Zelandiya': 'Новая Зеландия', 'Germaniya': 'Германия', 'Yaponiya': 'Япония', 'Janubiy Koreya': 'Южная Корея', 'Xitoy': 'Китай', 'Turkiya': 'Турция', 'Gonkong': 'Гонконг', 'Shvetsiya': 'Швеция', 'Niderlandiya': 'Нидерланды', 'Singapur': 'Сингапур', 'Irlandiya': 'Ирландия', 'AQSh': 'США', 'Angliya': 'Англия', 'Kanada': 'Канада',
    'Bosh panel': 'Главная', 'Universitet qidiruvi': 'Поиск университетов', 'Boshqa davlatlar': 'Другие страны', 'Stipendiyalar': 'Стипендии', 'Mosligingizni tekshiring': 'Проверьте соответствие', 'Emailingizni tasdiqlang': 'Подтвердите email', '6 xonali kodni': '6-значный код отправлен на', 'manziliga yubordik. Pochtangizni (Spam papkasini ham) tekshiring.': '. Проверьте почту (и папку «Спам»).', 'Tasdiqlash kodi': 'Код подтверждения', 'Tasdiqlash': 'Подтвердить', 'Kodni qayta yuborish': 'Отправить код снова', 'Yordam': 'Помощь', 'Hujjatlar yo‘riqnomasi': 'Гид по документам',
    'Solishtirish': 'Сравнение', 'Arizalarim': 'Мои заявки', 'Yo‘l xaritasi': 'Дорожная карта', 'Esse yordamchisi': 'Помощник по эссе', 'AI mentor': 'ИИ-наставник', 'Tariflar': 'Тарифы', 'Profil': 'Профиль',
    'Asosiy': 'Основное', 'Ish joyi': 'Работа', 'Hisob': 'Аккаунт', 'Chiqish': 'Выйти', 'Menyu': 'Меню', 'Asosiy menyu': 'Главное меню',
    'Xush kelibsiz': 'Добро пожаловать', 'Hisob ochish': 'Создать аккаунт', 'Kirish': 'Войти', 'Hisobingizga kiring.': 'Войдите в аккаунт.', 'Bir daqiqada hisob oching, bepul boshlaysiz.': 'Создайте аккаунт за минуту и начните бесплатно.',
    'Parolni tiklash': 'Восстановление пароля', 'Emailingizni kiriting, tiklash havolasini yuboramiz.': 'Введите email, мы отправим ссылку для восстановления.', 'Havola yuborish': 'Отправить ссылку',
    'Ismingiz': 'Ваше имя', 'Email': 'Email', 'Parol': 'Пароль', 'kamida 8 ta belgi': 'минимум 8 символов', 'Parolni ko‘rsatish': 'Показать пароль', 'Parolni unutdingizmi?': 'Забыли пароль?', 'Yangimisiz?': 'Впервые здесь?',
    'Hisobingiz bormi?': 'Уже есть аккаунт?', '← Kirishga qaytish': '← Назад ко входу', 'Kuting…': 'Подождите…',
    'Xorijda o‘qishga yo‘l, <em>aniq reja</em> bilan.': 'Путь к учёбе за рубежом — <em>с чётким планом</em>.', 'Universitetlarni profilingizga solishtiring, muddatlarni kuzating va qabul rejangizni bir joyda yuriting.': 'Сравнивайте университеты с вашим профилем, следите за сроками и ведите план поступления в одном месте.',
    'Safety, Target va Reach bo‘yicha universitetlar': 'Университеты по уровням Safety, Target и Reach', 'Har bir universitet uchun tushuntirish': 'Объяснение для каждого университета', 'Arizalar va muddatlar kuzatuvi': 'Отслеживание заявок и сроков',
    'Boshqa davlatlar <em>universitetlari</em>': 'Университеты <em>других стран</em>', 'Har bir ma’lumot universitetning rasmiy sahifasidan olingan va havolasi bor. Topilmagan yoki eskirgan ma’lumot ko‘rsatilmaydi — u “rasmiy saytda tekshiring” deb belgilanadi.': 'Каждое значение взято с официальной страницы университета и имеет ссылку. Ненайденные или устаревшие данные не показываются — они помечены «проверьте на официальном сайте».',
    'Qidirish': 'Поиск', 'Universitet yoki shahar': 'Университет или город', 'Davlat': 'Страна', 'Hammasi': 'Все', 'rasmiy saytda tekshiring': 'проверьте на официальном сайте', 'manba': 'источник',
    'inglizcha bakalavr bor': 'есть бакалавриат на английском', 'asosan inglizcha emas': 'в основном не на английском', 'IELTS (min)': 'IELTS (мин.)', 'Ariza muddati': 'Срок подачи', 'O‘qish narxi': 'Стоимость обучения', 'yil': 'год', 'Talab': 'Требования', 'Rasmiy sayt →': 'Официальный сайт →',
    'sizning IELTS yetarli': 'ваш IELTS достаточен', 'ball yetishmaydi': 'баллов не хватает', 'sizga': 'вам',
    'Hech narsa topilmadi': 'Ничего не найдено', 'Boshqa so‘z yoki davlatni sinab ko‘ring.': 'Попробуйте другое слово или страну.',
    'Bu universitetlar uchun qabul ehtimoli (Safety/Target/Reach) hisoblanmaydi: ularning qabul statistikasi AQSh universitetlaridagidek ochiq emas. Faqat talablar va muddatlar ko‘rsatiladi.': 'Для этих университетов вероятность поступления (Safety/Target/Reach) не рассчитывается: их статистика приёма не так открыта, как у университетов США. Показаны только требования и сроки.',
    'Xalqaro universitetlar ro‘yxatini yuklab bo‘lmadi.': 'Не удалось загрузить список международных университетов.', 'Til': 'Язык', 'Tungi rejim': 'Тёмная тема'
  },
  en: {
    'Armaniston': 'Armenia', 'Ozarbayjon': 'Azerbaijan', 'Gruziya': 'Georgia', 'Qirg‘iziston': 'Kyrgyzstan', 'Tayvan': 'Taiwan', 'Lyuksemburg': 'Luxembourg', 'Kipr': 'Cyprus', 'Vetnam': 'Vietnam', 'Filippin': 'Philippines', 'Shveytsariya': 'Switzerland', 'Daniya': 'Denmark', 'Norvegiya': 'Norway', 'Malayziya': 'Malaysia', 'Avstriya': 'Austria', 'Ispaniya': 'Spain', 'Belgiya': 'Belgium', 'Polsha': 'Poland', 'Chexiya': 'Czechia', 'Estoniya': 'Estonia', 'Vengriya': 'Hungary', 'Portugaliya': 'Portugal', 'BAA': 'UAE', 'Qozog‘iston': 'Kazakhstan', 'Litva': 'Lithuania', 'Latviya': 'Latvia', 'Hindiston': 'India', 'Tailand': 'Thailand', 'Rossiya': 'Russia', 'Finlyandiya': 'Finland', 'Shotlandiya': 'Scotland', 'Uels': 'Wales', 'Fransiya': 'France', 'Italiya': 'Italy', 'Avstraliya': 'Australia', 'Yangi Zelandiya': 'New Zealand', 'Germaniya': 'Germany', 'Yaponiya': 'Japan', 'Janubiy Koreya': 'South Korea', 'Xitoy': 'China', 'Turkiya': 'Turkey', 'Gonkong': 'Hong Kong', 'Shvetsiya': 'Sweden', 'Niderlandiya': 'Netherlands', 'Singapur': 'Singapore', 'Irlandiya': 'Ireland', 'AQSh': 'USA', 'Angliya': 'England', 'Kanada': 'Canada',
    'Bosh panel': 'Dashboard', 'Universitet qidiruvi': 'University finder', 'Boshqa davlatlar': 'Other countries', 'Stipendiyalar': 'Scholarships', 'Mosligingizni tekshiring': 'Check your fit', 'Emailingizni tasdiqlang': 'Verify your email', '6 xonali kodni': 'We sent a 6-digit code to', 'manziliga yubordik. Pochtangizni (Spam papkasini ham) tekshiring.': '. Check your inbox (and Spam folder).', 'Tasdiqlash kodi': 'Verification code', 'Tasdiqlash': 'Verify', 'Kodni qayta yuborish': 'Resend code', 'Yordam': 'Help', 'Hujjatlar yo‘riqnomasi': 'Documents guide',
    'Solishtirish': 'Compare', 'Arizalarim': 'My applications', 'Yo‘l xaritasi': 'Roadmap', 'Esse yordamchisi': 'Essay assistant', 'AI mentor': 'AI mentor', 'Tariflar': 'Plans', 'Profil': 'Profile',
    'Asosiy': 'Main', 'Ish joyi': 'Workspace', 'Hisob': 'Account', 'Chiqish': 'Log out', 'Menyu': 'Menu', 'Asosiy menyu': 'Main menu',
    'Xush kelibsiz': 'Welcome back', 'Hisob ochish': 'Create account', 'Kirish': 'Log in', 'Hisobingizga kiring.': 'Log in to your account.', 'Bir daqiqada hisob oching, bepul boshlaysiz.': 'Create an account in a minute and start for free.',
    'Parolni tiklash': 'Reset password', 'Emailingizni kiriting, tiklash havolasini yuboramiz.': 'Enter your email and we will send a reset link.', 'Havola yuborish': 'Send link',
    'Ismingiz': 'Your name', 'Email': 'Email', 'Parol': 'Password', 'kamida 8 ta belgi': 'at least 8 characters', 'Parolni ko‘rsatish': 'Show password', 'Parolni unutdingizmi?': 'Forgot your password?', 'Yangimisiz?': 'New here?',
    'Hisobingiz bormi?': 'Already have an account?', '← Kirishga qaytish': '← Back to log in', 'Kuting…': 'Please wait…',
    'Xorijda o‘qishga yo‘l, <em>aniq reja</em> bilan.': 'Your path to studying abroad, <em>with a clear plan</em>.', 'Universitetlarni profilingizga solishtiring, muddatlarni kuzating va qabul rejangizni bir joyda yuriting.': 'Match universities to your profile, track deadlines and manage your admission plan in one place.',
    'Safety, Target va Reach bo‘yicha universitetlar': 'Universities by Safety, Target and Reach', 'Har bir universitet uchun tushuntirish': 'An explanation for every university', 'Arizalar va muddatlar kuzatuvi': 'Application and deadline tracking',
    'Boshqa davlatlar <em>universitetlari</em>': 'Universities in <em>other countries</em>', 'Har bir ma’lumot universitetning rasmiy sahifasidan olingan va havolasi bor. Topilmagan yoki eskirgan ma’lumot ko‘rsatilmaydi — u “rasmiy saytda tekshiring” deb belgilanadi.': 'Every value comes from the university’s official page and has a link. Missing or outdated data is not shown; it is marked “check on the official site”.',
    'Qidirish': 'Search', 'Universitet yoki shahar': 'University or city', 'Davlat': 'Country', 'Hammasi': 'All', 'rasmiy saytda tekshiring': 'check on the official site', 'manba': 'source',
    'inglizcha bakalavr bor': 'bachelor’s in English available', 'asosan inglizcha emas': 'mostly not in English', 'IELTS (min)': 'IELTS (min.)', 'Ariza muddati': 'Application deadline', 'O‘qish narxi': 'Tuition', 'yil': 'year', 'Talab': 'Requirements', 'Rasmiy sayt →': 'Official website →',
    'sizning IELTS yetarli': 'your IELTS is enough', 'ball yetishmaydi': 'points short', 'sizga': 'you need',
    'Hech narsa topilmadi': 'Nothing found', 'Boshqa so‘z yoki davlatni sinab ko‘ring.': 'Try another word or country.',
    'Bu universitetlar uchun qabul ehtimoli (Safety/Target/Reach) hisoblanmaydi: ularning qabul statistikasi AQSh universitetlaridagidek ochiq emas. Faqat talablar va muddatlar ko‘rsatiladi.': 'Admission chances (Safety/Target/Reach) are not calculated for these universities: their admissions statistics are not as open as those of US universities. Only requirements and deadlines are shown.',
    'Xalqaro universitetlar ro‘yxatini yuklab bo‘lmadi.': 'Could not load the international universities list.', 'Til': 'Language', 'Tungi rejim': 'Dark mode'
  }
};
Object.assign(D.ru, XRU); Object.assign(D.en, XEN);
const viaRules = (k, i) => { for (const r of RULES) { const m = r[0].exec(k); if (m) { const o = r[i](m); if (o) return o; } } return null; };
const look = (d, k) => (Object.hasOwn(d, k) && d[k] !== k ? d[k] : viaRules(k, cur === 'ru' ? 1 : 2));
/** Sahifadagi matnlarni lugʻat boʻyicha avtomatik tarjima qiladi (aynan mos kelgan matn va placeholder/title/aria-label). Dinamik matnlar t() bilan beriladi. */
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
function trNode(n) {
  const d = D[cur]; if (!d || cur === 'uz') return;
  if (n.nodeType === 3) { const v = n.nodeValue, k = v.trim(); const o = k && look(d, k); if (o) n.nodeValue = v.replace(k, o); return; }
  if (n.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(n.tagName)) return;
  for (const a of ATTRS) { const v = n.getAttribute(a); const k = v && v.trim(), o = k && look(d, k); if (o) n.setAttribute(a, o); }
  if (n.tagName !== 'TEXTAREA') for (const c of n.childNodes) trNode(c);
}
if (typeof document !== 'undefined') {
  const go = () => { trNode(document.body); new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') trNode(m.target); else m.addedNodes.forEach(trNode); } }).observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
}
export const t = s => (cur !== 'uz' && D[cur] && D[cur][s]) || s;
/** {uz,ru,en} obyektidan joriy tilni tanlaydi; boʻlmasa inglizcha (manba), keyin qolgani */
export const pick = o => (o ? o[cur] || o.en || o.uz || o.ru || '' : '');
const MON = { ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
export function dateL(iso, fallback) {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); if (!m || cur === 'uz') return fallback(iso);
  const d = +m[3], mo = MON[cur][+m[2] - 1]; return cur === 'ru' ? `${d} ${mo} ${m[1]}` : `${mo} ${d}, ${m[1]}`;
}
let shown = -1; // oldingi ekrandagi til joyi: tugma qayta chizilganda “siljish” animatsiyasi uchun
/** Til tugmasi: UZ | RU | EN segmentlari, faol til ustida siljuvchi “tabletka”. bindLang() bilan ulanadi. */
export function langSelect(id = 'lang') {
  const to = Math.max(0, LANGS.findIndex(l => l[0] === cur)), from = shown < 0 ? to : shown; shown = to;
  return `<div id="${id}" class="lang-seg" role="group" aria-label="${t('Til')}" style="--i:${from}" data-to="${to}"><span class="lang-pill" aria-hidden="true"></span>${LANGS.map(l => `<button type="button" class="lang-opt" data-l="${l[0]}" lang="${l[0]}" title="${l[2]}" aria-pressed="${l[0] === cur}">${l[1]}</button>`).join('')}</div>`;
}
/** langSelect() natijasiga bosishni ulaydi; til almashsa setLang() chaqirilib, so‘ng onChange(yangiTil) ishga tushadi */
export function bindLang(id, onChange) {
  const box = document.getElementById(id); if (!box) return;
  const to = box.dataset.to; if (box.style.getPropertyValue('--i') !== to) requestAnimationFrame(() => requestAnimationFrame(() => box.style.setProperty('--i', to)));
  box.addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b || b.dataset.l === cur) return; setLang(b.dataset.l); onChange(b.dataset.l); });
}

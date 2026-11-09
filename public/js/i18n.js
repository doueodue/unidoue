/* Til tizimi. Asosiy til — oʻzbekcha: kalit sifatida oʻzbekcha matn ishlatiladi. Tarjima boʻlmasa oʻzbekcha chiqadi. */
export const LANGS = [['uz', 'UZ', 'Oʻzbekcha'], ['ru', 'RU', 'Русский'], ['en', 'EN', 'English']];
let cur = 'uz';
try { const v = localStorage.getItem('qabul:lang'); if (LANGS.some(l => l[0] === v)) cur = v; } catch (e) {}
export const lang = () => cur;
export function setLang(l) { if (!LANGS.some(x => x[0] === l)) return; cur = l; try { localStorage.setItem('qabul:lang', l); } catch (e) {} document.documentElement.lang = l; }
document.documentElement.lang = cur;

const D = {
  ru: {
    'Shveytsariya': 'Швейцария', 'Finlyandiya': 'Финляндия', 'Shotlandiya': 'Шотландия', 'Uels': 'Уэльс', 'Fransiya': 'Франция', 'Italiya': 'Италия', 'Avstraliya': 'Австралия', 'Yangi Zelandiya': 'Новая Зеландия', 'Germaniya': 'Германия', 'Yaponiya': 'Япония', 'Janubiy Koreya': 'Южная Корея', 'Xitoy': 'Китай',
    'Bosh panel': 'Главная', 'Universitet qidiruvi': 'Поиск университетов', 'Boshqa davlatlar': 'Другие страны', 'Stipendiyalar': 'Стипендии', 'Qabul bashorati': 'Прогноз поступления',
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
    'Xalqaro universitetlar ro‘yxatini yuklab bo‘lmadi.': 'Не удалось загрузить список международных университетов.', 'Til': 'Язык'
  },
  en: {
    'Shveytsariya': 'Switzerland', 'Finlyandiya': 'Finland', 'Shotlandiya': 'Scotland', 'Uels': 'Wales', 'Fransiya': 'France', 'Italiya': 'Italy', 'Avstraliya': 'Australia', 'Yangi Zelandiya': 'New Zealand', 'Germaniya': 'Germany', 'Yaponiya': 'Japan', 'Janubiy Koreya': 'South Korea', 'Xitoy': 'China',
    'Bosh panel': 'Dashboard', 'Universitet qidiruvi': 'University finder', 'Boshqa davlatlar': 'Other countries', 'Stipendiyalar': 'Scholarships', 'Qabul bashorati': 'Admission predictor',
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
    'Xalqaro universitetlar ro‘yxatini yuklab bo‘lmadi.': 'Could not load the international universities list.', 'Til': 'Language'
  }
};
export const t = s => (cur !== 'uz' && D[cur] && D[cur][s]) || s;
/** {uz,ru,en} obyektidan joriy tilni tanlaydi; boʻlmasa inglizcha (manba), keyin qolgani */
export const pick = o => (o ? o[cur] || o.en || o.uz || o.ru || '' : '');
const MON = { ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
export function dateL(iso, fallback) {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); if (!m || cur === 'uz') return fallback(iso);
  const d = +m[3], mo = MON[cur][+m[2] - 1]; return cur === 'ru' ? `${d} ${mo} ${m[1]}` : `${mo} ${d}, ${m[1]}`;
}
export function langSelect(id = 'lang') {
  return `<select id="${id}" class="lang-sel" aria-label="${t('Til')}">${LANGS.map(l => `<option value="${l[0]}"${l[0] === cur ? ' selected' : ''}>${l[1]} · ${l[2]}</option>`).join('')}</select>`;
}

/* Qoʻshimcha tarjimalar (RU/EN): tizim toʻliq tarjima boʻlishi uchun. Kalit — oʻzbekcha matn aynan shunday.
   Raqamli/dinamik matnlar uchun MRULES: [regex, ru(fn), en(fn)]. */
const MON = { yanvar: 1, fevral: 2, mart: 3, aprel: 4, may: 5, iyun: 6, iyul: 7, avgust: 8, sentyabr: 9, oktyabr: 10, noyabr: 11, dekabr: 12 };
const RUM = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const ENM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "21-dekabr, 2026" boʻlaklaridan til boʻyicha sana; notanish oy boʻlsa null */
const dt = (d, mo, y, i) => (MON[mo] ? (i ? `${ENM[MON[mo] - 1]} ${d}, ${y}` : `${d} ${RUM[MON[mo] - 1]} ${y}`) : null);

/* [uz, ru, en] */
const P = [
  /* ---- umumiy / tugmalar ---- */
  ['Bekor', 'Отмена', 'Cancel'],
  ['O‘chirish', 'Удалить', 'Delete'],
  ['Keyinroq', 'Позже', 'Later'],
  ['Yuklab bo‘lmadi', 'Не удалось загрузить', 'Could not load'],
  ['Yuklab bo‘lmadi.', 'Не удалось загрузить.', 'Could not load.'],
  ['Serverga ulanib bo‘lmadi. Internetni tekshiring.', 'Не удалось подключиться к серверу. Проверьте интернет.', 'Could not connect to the server. Check your internet connection.'],
  ['Universitetlar ro‘yxatini yuklab bo‘lmadi.', 'Не удалось загрузить список университетов.', 'Could not load the university list.'],
  ['To‘liq moslik tahlili', 'Полный анализ соответствия', 'Full fit analysis'],
  ['Ko‘proq universitetni solishtirish', 'Сравнение большего числа университетов', 'Compare more universities'],
  ['Yuqoriroq tarif kerak', 'Нужен более высокий тариф', 'A higher plan is required'],
  ['Tariflarni ko‘rish', 'Посмотреть тарифы', 'View plans'],
  ['Limitni oshirish uchun tarifni yaxshilang.', 'Чтобы увеличить лимит, перейдите на более высокий тариф.', 'Upgrade your plan to raise the limit.'],
  ['Yo‘nalish', 'Направление', 'Field'],
  ['mentor', 'наставник', 'mentor'],
  ['Email', 'Email', 'Email'],

  /* ---- bosh panel / graduate hisoblagichi ---- */
  ['Graduategacha', 'До выпуска', 'Until graduation'],
  ['kun qoldi', 'дн. осталось', 'days left'],
  ['Sanani o‘zgartirish', 'Изменить дату', 'Change date'],
  ['Hali vaqt bor: testlarga tayyorlaning va universitetlar ro‘yxatini shakllantiring.', 'Время ещё есть: готовьтесь к тестам и формируйте список университетов.', 'There is still time: prepare for the tests and build your university list.'],
  ['SAT/IELTS topshirish va esse yozishni boshlash vaqti.', 'Пора сдавать SAT/IELTS и начинать писать эссе.', 'Time to take SAT/IELTS and start writing your essay.'],
  ['Arizalar va hujjatlarni yakunlash vaqti.', 'Пора завершать заявки и документы.', 'Time to finalize your applications and documents.'],
  ['So‘nggi sprint: muddatlar va topshirilmagan hujjatlarni tekshiring.', 'Финальный рывок: проверьте сроки и неподанные документы.', 'Final sprint: check your deadlines and any documents not yet submitted.'],
  ['Siz bitirgansiz!', 'Вы уже выпустились!', 'You have graduated!'],
  ['Profilingiz to‘liq. Universitetlar va muddatlarni kuzatishda davom eting.', 'Ваш профиль заполнен. Продолжайте следить за университетами и сроками.', 'Your profile is complete. Keep tracking universities and deadlines.'],
  ['Universitetlarni ko‘rish', 'Смотреть университеты', 'Browse universities'],
  ['Tarifni boshqarish', 'Управление тарифом', 'Manage plan'],
  ['Tasdiqlangan stipendiyalar bazasi hozircha to‘ldirilmoqda.', 'База проверенных стипендий пока наполняется.', 'The verified scholarship database is still being filled.'],

  /* ---- arizalar ---- */
  ['muddat o‘tgan', 'срок прошёл', 'deadline passed'],
  ['Arizani o‘chirasizmi?', 'Удалить заявку?', 'Delete this application?'],
  ['Hisobni o‘chirasizmi?', 'Удалить аккаунт?', 'Delete your account?'],
  ['Profil, natijalar, arizalar va so‘rovlaringiz butunlay o‘chadi. Qaytarib bo‘lmaydi. Tasdiqlash uchun parolingizni kiriting.', 'Профиль, результаты, заявки и запросы будут удалены без возможности восстановления. Для подтверждения введите пароль.', 'Your profile, results, applications and requests will be permanently deleted. This cannot be undone. Enter your password to confirm.'],
  ['Tarifni pasaytirasizmi?', 'Понизить тариф?', 'Downgrade your plan?'],
  ['Yuqori tarif imkoniyatlari darhol o‘chadi. Ma’lumotlaringiz saqlanadi, lekin arizalar limiti oshgan bo‘lsa yangilari qo‘shilmaydi.', 'Возможности высокого тарифа отключатся сразу. Ваши данные сохранятся, но если лимит заявок превышен, новые добавить не получится.', 'The features of the higher plan turn off immediately. Your data is kept, but if you are over the applications limit, you will not be able to add new ones.'],
  ['Pasaytirish', 'Понизить', 'Downgrade'],
  ['Ma’lumotlarni tiklab bo‘lmadi.', 'Не удалось восстановить данные.', 'Could not restore the data.'],

  /* ---- toʻlov (qoʻlda usul) matnlari: tartibi tilga bogʻliq boʻlmasligi uchun boʻlib berilgan ---- */
  ['To‘lov rekvizitlarini olish uchun yozing:', 'Чтобы получить реквизиты для оплаты, напишите:', 'To get the payment details, write to'],
  ['Chekni (skrinshot)', 'Отправьте чек (скриншот) в', 'Send the receipt (screenshot) to'],
  ['gacha. Uzaytirish uchun to‘lovdan keyin yozing:', '. Чтобы продлить после оплаты, напишите:', '. To extend after paying, write to'],

  /* ---- AI boʻlimlari / esse ---- */
  ['Abzatslar kam. Kirish, asosiy qism va xulosa ajratilsa, tuzilma aniq bo‘ladi.', 'Абзацев мало. Если выделить введение, основную часть и вывод, структура станет яснее.', 'Too few paragraphs. Separating an introduction, main part and conclusion makes the structure clearer.'],
  ['Birinchi gap juda qisqa. O‘quvchini ushlab turadigan aniq epizod bilan boshlang.', 'Первое предложение слишком короткое. Начните с конкретного эпизода, который заинтересует читателя.', 'The first sentence is too short. Start with a specific episode that hooks the reader.'],
  ['Esse “men” so‘ziga boy; harakat va tafsilotlar bilan to‘ldiring.', 'В эссе много «я»; дополните его действиями и деталями.', 'The essay uses “I” a lot; add actions and details.'],
  ['Aniq raqam yoki tafsilot yo‘q. Konkret misollar hikoyani kuchaytiradi.', 'Нет конкретных цифр или деталей. Конкретные примеры усиливают рассказ.', 'There are no concrete numbers or details. Specific examples strengthen the story.'],
  ['so‘z', 'слов', 'words'],
  ['abzats', 'абзацев', 'paragraphs'],
  ['gapdagi o‘rtacha so‘z', 'слов в предложении (в среднем)', 'average words per sentence'],
  ['e’tibor', 'внимание', 'attention'],
  ['Bu sodda statistik tahlil. Mazmun va hikoya sifatini AI tahlil baholaydi.', 'Это простой статистический анализ. Содержание и качество рассказа оценивает AI-анализ.', 'This is a simple statistical check. The AI analysis evaluates content and storytelling.'],
  ['AI xato qilishi mumkin; maslahatlarni o‘z ovozingizga moslang. Esse sizniki bo‘lib qolsin.', 'AI может ошибаться; адаптируйте советы под свой стиль. Пусть эссе останется вашим.', 'The AI can make mistakes; adapt the advice to your own voice. Keep the essay yours.'],
  ['Bu vosita Pro tarifida.', 'Этот инструмент доступен на тарифе Pro.', 'This tool is available on the Pro plan.'],
  ['Raqam va muddatlarni universitetning rasmiy saytida tekshiring.', 'Проверьте цифры и сроки на официальном сайте университета.', 'Check the figures and deadlines on the university’s official website.'],
  ['Chuqur esse tahlili Pro tarifida.', 'Глубокий анализ эссе доступен на тарифе Pro.', 'Deep essay analysis is available on the Pro plan.'],

  /* ---- universitetlar roʻyxati / stipendiyalar ---- */
  ['Avval natijalaringizni kiriting', 'Сначала введите свои результаты', 'Enter your results first'],
  ['GPA, SAT yoki IELTS ni profilda to‘ldiring.', 'Заполните GPA, SAT или IELTS в профиле.', 'Fill in your GPA, SAT or IELTS in your profile.'],
  ['ma’lumot yo‘q', 'нет данных', 'no data'],
  ['Filtrni o‘zgartirib ko‘ring.', 'Попробуйте изменить фильтр.', 'Try changing the filter.'],
  ['Filtrni o‘zgartiring.', 'Измените фильтр.', 'Change the filter.'],
  ['Nima uchun mos ekani: SAT, GPA va IELTS bo‘yicha tushuntirish shu yerda ko‘rinadi.', 'Почему подходит: здесь видно объяснение по SAT, GPA и IELTS.', 'Why it fits: the explanation based on SAT, GPA and IELTS appears here.'],
  ['Universitet ko‘rsatkichlari bilan solishtirish batafsil yoziladi.', 'Подробное сравнение с показателями университета.', 'A detailed comparison with the university’s figures.'],
  ['Tushuntirishni ochish (Plus)', 'Открыть объяснение (Plus)', 'Unlock the explanation (Plus)'],
  ['Har bir universitet nima uchun mos ekanini ko‘rish Pro tarifida.', 'Просмотр того, почему каждый университет подходит, доступен на тарифе Pro.', 'Seeing why each university fits is available on the Pro plan.'],
  ['Stipendiyalar ro‘yxati', 'Список стипендий', 'Scholarship list'],
  ['Talablar, muddatlar, summa va ariza havolalari shu yerda.', 'Требования, сроки, суммы и ссылки для подачи заявок — здесь.', 'Requirements, deadlines, amounts and application links are here.'],
  ['Stipendiyalar bazasi hozircha to‘ldirilmoqda', 'База стипендий пока наполняется', 'The scholarship database is still being filled'],
  ['Faqat rasmiy manbadan tekshirilgan stipendiyalar qo‘shiladi, shuning uchun ro‘yxat hozircha bo‘sh.', 'Добавляются только стипендии, проверенные по официальному источнику, поэтому список пока пуст.', 'Only scholarships verified from an official source are added, so the list is empty for now.'],

  /* ---- moslik (predictor) ---- */
  ['Mosligingizni', 'Проверьте', 'Check your'],
  ['tekshiring', 'соответствие', 'fit'],
  ['Bu sizning raqamlaringizni universitet o‘rta ko‘rsatkichlari bilan solishtiradi. Qabul ehtimoli emas.', 'Здесь ваши цифры сравниваются со средними показателями университета. Это не вероятность поступления.', 'This compares your numbers with the university’s averages. It is not an admission probability.'],
  ['Baholash', 'Оценка', 'Score'],
  ['ball', 'балл', 'points'],
  ['Moslik balli qanday hisoblandi', 'Как рассчитан балл соответствия', 'How the fit score was calculated'],
  ['Har bir mezon uchun hissa.', 'Вклад каждого критерия.', 'The contribution of each criterion.'],
  ['Faoliyat', 'Активности', 'Activities'],
  ['Yutuqlar', 'Достижения', 'Achievements'],
  ['Nimani yaxshilash kerak', 'Что стоит улучшить', 'What to improve'],
  ['Qo‘shimcha tavsiya yo‘q.', 'Дополнительных рекомендаций нет.', 'No further recommendations.'],
  ['muddat tekshirilgan', 'срок проверен', 'deadline verified'],
  ['SAT oralig‘i tekshirilgan', 'диапазон SAT проверен', 'SAT range verified'],
  ['Bu taxminiy baho, qabul kafolati emas. Haqiqiy qaror esse, tavsiyanoma, faoliyat va arizachilar raqobatiga ham bogʻliq.', 'Это приблизительная оценка, а не гарантия поступления. Реальное решение зависит также от эссе, рекомендаций, активностей и конкуренции среди абитуриентов.', 'This is an estimate, not a guarantee of admission. The real decision also depends on the essay, recommendations, activities and competition among applicants.'],
  ['Bu taxminiy baho, qabul kafolati emas. Haqiqiy qaror esse, tavsiyanoma, faoliyat va arizachilar raqobatiga ham bog‘liq.', 'Это приблизительная оценка, а не гарантия поступления. Реальное решение зависит также от эссе, рекомендаций, активностей и конкуренции среди абитуриентов.', 'This is an estimate, not a guarantee of admission. The real decision also depends on the essay, recommendations, activities and competition among applicants.'],
  ['Kuchli moslik', 'Сильное соответствие', 'Strong fit'],
  ['Raqobatbardosh', 'Конкурентный', 'Competitive'],
  ['Qiyin', 'Сложно', 'Difficult'],
  ['Juda qiyin', 'Очень сложно', 'Very difficult'],
  ['Moslik', 'Соответствие', 'Fit'],
  ['Profilni kuchaytirish kerak', 'Профиль нужно усилить', 'Your profile needs strengthening'],
  ['Qo‘shimcha tayyorgarlik foydali', 'Дополнительная подготовка пойдёт на пользу', 'Extra preparation would help'],
  ['Profilning ayrim jihatlari mos', 'Отдельные части профиля подходят', 'Some parts of your profile fit'],
  ['Kiritilgan natijalar bo‘yicha yaxshi moslik', 'Хорошее соответствие по введённым результатам', 'Good fit based on the results you entered'],
  ['Oxirgi semestrlarda GPA ni ko‘tarishga e’tibor bering.', 'В последних семестрах сосредоточьтесь на повышении GPA.', 'Focus on raising your GPA in the last semesters.'],
  ['Olimpiada, loyiha yoki volontyorlik tajribasini kengaytiring.', 'Расширьте опыт: олимпиады, проекты или волонтёрство.', 'Expand your experience: olympiads, projects or volunteering.'],
  ['SAT natijangizni kiriting, aks holda hisob kam ma’lumotga tayanadi.', 'Введите результат SAT, иначе расчёт опирается на мало данных.', 'Enter your SAT score; otherwise the calculation relies on little data.'],
  ['Universitet rasmiy minimal IELTS ballini ko‘rsatmagan (tekshirilgan)', 'Университет не указывает официальный минимальный балл IELTS (проверено)', 'The university does not state an official minimum IELTS score (verified)'],
  ['Olimpiada, loyiha, volontyorlik: o‘zingiz baholagan daraja', 'Олимпиады, проекты, волонтёрство: уровень, который вы оценили сами', 'Olympiads, projects, volunteering: the level you rated yourself'],
  ['Akademik yutuqlar: o‘zingiz baholagan daraja', 'Академические достижения: уровень, который вы оценили сами', 'Academic achievements: the level you rated yourself'],

  /* ---- solishtirish ---- */
  ['Olib tashlash', 'Убрать', 'Remove'],
  ['Joylashuv', 'Расположение', 'Location'],
  ['SAT (o‘rta 50%)', 'SAT (средние 50%)', 'SAT (middle 50%)'],
  ['Qabul darajasi', 'Уровень приёма', 'Acceptance rate'],
  ['tekshirilmagan', 'не проверено', 'not verified'],
  ['minimal ball ko‘rsatilmagan', 'минимальный балл не указан', 'no minimum score stated'],
  ['Muddat (Regular)', 'Срок (Regular)', 'Deadline (Regular)'],
  ['Erta muddatlar', 'Ранние сроки', 'Early deadlines'],
  ['O‘qish narxi, reyting va stipendiyalar ustunlari rasmiy ma’lumot yig‘ilgach qo‘shiladi. “Taxminiy” ko‘rsatkichlarni universitetning rasmiy saytida tekshiring.', 'Столбцы со стоимостью обучения, рейтингом и стипендиями появятся после сбора официальных данных. Показатели с пометкой «примерно» проверяйте на официальном сайте университета.', 'Columns for tuition, rankings and scholarships will be added once official data is collected. Check the “approximate” figures on the university’s official website.'],

  /* ---- kirish / roʻyxatdan oʻtish ---- */
  ['Hisob ochish bilan', 'Создавая аккаунт, вы соглашаетесь с', 'By creating an account you agree to the'],
  ['maxfiylik siyosati', 'политикой конфиденциальности', 'privacy policy'],
  ['ga rozilik bildirasiz.', '.', '.'],

  /* ---- kalendar (.ics) va nusxa matnlari ---- */
  ['ariza muddati', 'срок подачи заявки', 'application deadline'],
  ['Muddatni universitetning rasmiy saytidan tasdiqlang. unidoue.uz', 'Подтвердите срок на официальном сайте университета. unidoue.uz', 'Confirm the deadline on the university’s official website. unidoue.uz'],
  ['muddatga 14 kun qoldi', 'до срока осталось 14 дней', '14 days until the deadline'],
  ['muddatga 3 kun qoldi', 'до срока осталось 3 дня', '3 days until the deadline'],
  ['yo‘l xaritasi', 'дорожная карта', 'roadmap'],
];

const reg = (re, ru, en) => [re, ru, en];
/** "(tekshirilgan: 2025-26)" / "(tekshirilgan)" / "(taxminiy, tekshirilmagan)" qoʻshimchasi */
const SV = ' \\((?:(tekshirilgan)(?:: (.+))?|(taxminiy, tekshirilmagan))\\)$';
const sv = (m, k, en) => (m[k] ? ` (${en ? 'verified' : 'проверено'}${m[k + 1] ? ': ' + m[k + 1] : ''})` : m[k + 2] ? (en ? ' (estimate, not verified)' : ' (ориентировочно, не проверено)') : '');
const PL = { Free: 'Free', Plus: 'Plus', Pro: 'Pro', FREE: 'FREE', PLUS: 'PLUS', PRO: 'PRO' };

export const MRULES = [
  /* hisoblagich: haftalar / oylar */
  reg(/^(\d+) hafta$/, m => `${m[1]} нед.`, m => `${m[1]} ${m[1] === '1' ? 'week' : 'weeks'}`),
  reg(/^≈ (\d+) oy$/, m => `≈ ${m[1]} мес.`, m => `≈ ${m[1]} mo.`),
  reg(/^Bitiruv sanasi: (\d+)-(\w+), (\d{4})\. Keyingi qadam — arizalar va muddatlar\.$/, m => dt(m[1], m[2], m[3], 0) && `Дата выпуска: ${dt(m[1], m[2], m[3], 0)}. Следующий шаг — заявки и сроки.`, m => dt(m[1], m[2], m[3], 1) && `Graduation date: ${dt(m[1], m[2], m[3], 1)}. Next step: applications and deadlines.`),
  reg(/^(\d+)-(\w+), (\d{4}) gacha$/, m => dt(m[1], m[2], m[3], 0) && `до ${dt(m[1], m[2], m[3], 0)}`, m => dt(m[1], m[2], m[3], 1) && `until ${dt(m[1], m[2], m[3], 1)}`),
  reg(/^([A-Za-z][A-Za-z0-9 /-]{0,12}): (\d+)-(\w+), (\d{4})$/, m => dt(m[2], m[3], m[4], 0) && `${m[1]}: ${dt(m[2], m[3], m[4], 0)}`, m => dt(m[2], m[3], m[4], 1) && `${m[1]}: ${dt(m[2], m[3], m[4], 1)}`),
  reg(/^Tiklandi: (\d+) ta yozuv\.$/, m => `Восстановлено записей: ${m[1]}.`, m => `Restored ${m[1]} entries.`),

  /* arizalar / tarif limitlari */
  reg(/^(Free|Plus|Pro|FREE|PLUS|PRO) tarifda (\d+) tagacha ariza saqlanadi\.$/, m => `На тарифе ${PL[m[1]]} можно сохранить до ${m[2]} заявок.`, m => `The ${PL[m[1]]} plan stores up to ${m[2]} applications.`),
  reg(/^Joriy tarifda (\d+) tagacha ariza saqlanadi\.$/, m => `На текущем тарифе можно сохранить до ${m[1]} заявок.`, m => `Your current plan stores up to ${m[1]} applications.`),
  reg(/^(\w+) tarifida eng ko[ʻ‘]pi bilan (\d+) ta ariza saqlanadi\.$/, m => `На тарифе ${m[1]} можно сохранить не более ${m[2]} заявок.`, m => `The ${m[1]} plan stores at most ${m[2]} applications.`),
  reg(/^(\w+) tarifida bir vaqtda (\d+) ta universitet solishtiriladi\.$/, m => `На тарифе ${m[1]} одновременно сравниваются ${m[2]} университетов.`, m => `The ${m[1]} plan compares ${m[2]} universities at a time.`),
  reg(/^Bir vaqtda (\d+) tagacha universitet \((\w+) tarifi\)\.$/, m => `До ${m[1]} университетов одновременно (тариф ${m[2]}).`, m => `Up to ${m[1]} universities at a time (${m[2]} plan).`),
  reg(/^(.+) allaqachon (?:ro‘yxatda|arizalar ro‘yxatida)\.$/, m => `${m[1]} уже в списке заявок.`, m => `${m[1]} is already in your applications list.`),
  reg(/^(.+) arizalarga qo‘shildi\.$/, m => `${m[1]} добавлен в заявки.`, m => `${m[1]} was added to your applications.`),
  reg(/^(.+) arizasi ro‘yxatdan olib tashlanadi\.$/, m => `Заявка ${m[1]} будет удалена из списка.`, m => `The ${m[1]} application will be removed from the list.`),
  reg(/^(.+): nima noto‘g‘ri\? Iloji bo‘lsa, to‘g‘ri qiymat va rasmiy sahifa havolasini yozing\.$/, m => `${m[1]}: что неверно? По возможности укажите правильное значение и ссылку на официальную страницу.`, m => `${m[1]}: what is wrong? If possible, give the correct value and a link to the official page.`),
  reg(/^Universitet hisoboti \((\d+)\)$/, m => `Отчёт по университету (${m[1]})`, m => `University report (${m[1]})`),
  reg(/^Qabul strategiyasi \((\d+)\)$/, m => `Стратегия поступления (${m[1]})`, m => `Admission strategy (${m[1]})`),

  /* esse: tezkor tahlil */
  reg(/^Esse qisqa \((\d+) so‘z\)\. Common App uchun odatda 250–650 so‘z kerak\.$/, m => `Эссе короткое (${m[1]} слов). Для Common App обычно нужно 250–650 слов.`, m => `The essay is short (${m[1]} words). Common App usually needs 250–650 words.`),
  reg(/^Esse uzun \((\d+) so‘z\)\. Common App chegarasi 650 so‘z\.$/, m => `Эссе длинное (${m[1]} слов). Лимит Common App — 650 слов.`, m => `The essay is long (${m[1]} words). The Common App limit is 650 words.`),
  reg(/^Hajmi mos \((\d+) so‘z\)\.$/, m => `Объём подходит (${m[1]} слов).`, m => `The length is fine (${m[1]} words).`),
  reg(/^Gaplar uzun \(o‘rtacha (\d+) so‘z\)\. Qisqaroq gaplar o‘qishni osonlashtiradi\.$/, m => `Предложения длинные (в среднем ${m[1]} слов). Короткие предложения легче читать.`, m => `Sentences are long (${m[1]} words on average). Shorter sentences are easier to read.`),
  reg(/^(\d+) ta gap 35 so‘zdan uzun, ularni bo‘ling\.$/, m => `Предложений длиннее 35 слов: ${m[1]}. Разделите их.`, m => `${m[1]} sentences are longer than 35 words; split them.`),
  reg(/^Ko‘p takrorlangan so‘zlar: (.+)\.$/, m => `Часто повторяющиеся слова: ${m[1]}.`, m => `Frequently repeated words: ${m[1]}.`),

  /* moslik: sabablar va maslahatlar */
  reg(/^SAT ni kamida (\d+) ga ko‘tarish moslikni sezilarli oshiradi\.$/, m => `Повышение SAT минимум до ${m[1]} заметно улучшит соответствие.`, m => `Raising your SAT to at least ${m[1]} would noticeably improve your fit.`),
  reg(/^IELTS ni ([\d.]+) ga yetkazing\.$/, m => `Подтяните IELTS до ${m[1]}.`, m => `Raise your IELTS to ${m[1]}.`),
  reg(/^(\d+)\/(\d+) · ulushi (\d+)%$/, m => `${m[1]}/${m[2]} · доля ${m[3]}%`, m => `${m[1]}/${m[2]} · weight ${m[3]}%`),
  reg(new RegExp('^SAT (\\d+) universitet o‘rta 50% oralig‘i \\((\\d+)–(\\d+)\\) ning yuqori chegarasidan yuqori' + SV), m => `SAT ${m[1]} выше среднего диапазона 50% университета (${m[2]}–${m[3]})${sv(m, 4)}`, m => `SAT ${m[1]} is above the university’s middle 50% range (${m[2]}–${m[3]})${sv(m, 4, 1)}`),
  reg(new RegExp('^SAT (\\d+) oraliq \\((\\d+)–(\\d+)\\) ichida' + SV), m => `SAT ${m[1]} в диапазоне (${m[2]}–${m[3]})${sv(m, 4)}`, m => `SAT ${m[1]} is within the range (${m[2]}–${m[3]})${sv(m, 4, 1)}`),
  reg(new RegExp('^SAT (\\d+) oraliq \\((\\d+)–(\\d+)\\) ning quyi chegarasidan (\\d+) ball past' + SV.replace('(tekshirilgan)', '(tekshirilgan)')), m => `SAT ${m[1]} ниже нижней границы диапазона (${m[2]}–${m[3]}) на ${m[4]} баллов${sv(m, 5)}`, m => `SAT ${m[1]} is ${m[4]} points below the lower end of the range (${m[2]}–${m[3]})${sv(m, 5, 1)}`),
];

export const MRU = Object.fromEntries(P.map(x => [x[0], x[1]]));
export const MEN = Object.fromEntries(P.map(x => [x[0], x[2]]));

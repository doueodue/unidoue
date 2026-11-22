/* Esse murabbiyi: darslar, namunalar va brauzerda ishlaydigan bepul tekshiruvlar.
   Barcha matn uch tilda (uz/ru/en) yozilgan; namunalar o‘ylab topilgan va faqat texnikani ko‘rsatadi. */

export const STEPS = ['story', 'major', 'uni', 'goals', 'draft'];
export const KIND_STEPS = { personal: ['story', 'major', 'goals', 'draft'], motivation: STEPS };
export const RANGE = { story: [50, 160], major: [70, 200], uni: [70, 200], goals: [50, 160], draft: [60, 320] };
export const BUDGET = { personal: [500, 650], motivation: [350, 500] };
export const NEEDS = ['story', 'major', 'uni', 'goals'];

const C = {
  story: {
    uz: {
      name: 'Hikoya', q: 'Qaysi bir lahza sizni shu yo‘lga boshladi?',
      lesson: 'Esse umumiy gap bilan emas, bitta aniq sahna bilan boshlanadi: vaqt, joy va kichik tafsilot. O‘quvchi sahnani ko‘rsa, sizni eslab qoladi. Hayotingizni emas, bitta daqiqani yozing.',
      do: ['Bitta kun, bitta joy, bitta harakat bilan boshlang', 'Sezgilardan kamida bittasini qo‘shing: nimani eshitdingiz, ko‘rdingiz, ushladingiz', 'Birinchi gapni qisqa qiling (25 so‘zgacha)'],
      dont: ['“Bolaligimdan ... ga qiziqaman” deb boshlash', 'Mashhur iqtibos yoki lug‘at ta’rifi bilan ochish', 'Butun hayotingizni bir abzatsda sanab chiqish'],
      weak: 'Bolaligimdan texnologiyalarga ishtiyoqim bor va doim dasturchi bo‘lishni orzu qilganman.',
      strong: 'Dadamning do‘konidagi kassa dasturi har kuni soat 18:00 da qotib qolardi. O‘n to‘rt yoshimda daftar ochib, uning har bir xatosini yozib bordim. Uchinchi kechada sababi chiqdi.',
      why: ['Aniq vaqt va joy bor: soat 18:00, do‘kon', 'Muammo ko‘rinadi, “qiziqaman” deb aytilmagan', 'O‘quvchi nima bo‘lganini bilishni xohlaydi'],
      prompts: ['Eng yaxshi ko‘rgan ishingizni qilayotganda qayerda edingiz?', 'Qaysi muammo sizni tinch qo‘ymadi? Uni qanday payqadingiz?', 'Shundan keyin nima o‘zgardi? Birinchi qadamingiz nima bo‘ldi?', 'Do‘stingizga shu voqeani aytsangiz, qaysi joyida “voy!” deydi?'],
      ph: 'Bitta aniq kun va joyni tasvirlab boshlang…'
    },
    ru: {
      name: 'История', q: 'Какой момент привёл вас на этот путь?',
      lesson: 'Эссе начинается не с общей фразы, а с одной конкретной сцены: время, место и маленькая деталь. Читатель, увидев сцену, запомнит вас. Пишите не всю жизнь, а одну минуту.',
      do: ['Начните с одного дня, одного места, одного действия', 'Добавьте хотя бы одно чувство: что вы слышали, видели, держали в руках', 'Сделайте первое предложение коротким (до 25 слов)'],
      dont: ['Начинать с «С детства я увлекаюсь…»', 'Открывать известной цитатой или словарным определением', 'Перечислять всю жизнь в одном абзаце'],
      weak: 'С детства я увлекаюсь технологиями и всегда мечтал стать программистом.',
      strong: 'Кассовая программа в папином магазине зависала каждый день в 18:00. В четырнадцать лет я завёл тетрадь и записывал каждый сбой. На третий вечер причина нашлась.',
      why: ['Есть точное время и место: 18:00, магазин', 'Проблема видна, слова «увлекаюсь» нет', 'Читателю хочется узнать, что было дальше'],
      prompts: ['Где вы были, когда занимались любимым делом?', 'Какая проблема не давала вам покоя? Как вы её заметили?', 'Что изменилось после этого? Каким был ваш первый шаг?', 'Если рассказать эту историю другу, на каком месте он скажет «ого!»?'],
      ph: 'Начните с описания одного конкретного дня и места…'
    },
    en: {
      name: 'Story', q: 'Which moment set you on this path?',
      lesson: 'An essay opens with one concrete scene, not a general statement: a time, a place and a small detail. When the reader can see the scene, they remember you. Write one minute, not your whole life.',
      do: ['Start with one day, one place, one action', 'Add at least one sense: what you heard, saw or held', 'Keep the first sentence short (under 25 words)'],
      dont: ['Open with “Ever since I was a child, I have been passionate about…”', 'Open with a famous quote or a dictionary definition', 'Summarise your whole life in one paragraph'],
      weak: 'Ever since I was a child, I have been passionate about technology and have always dreamed of becoming a programmer.',
      strong: 'The cash-register program in my father’s shop froze every day at 6 p.m. At fourteen I started a notebook and wrote down every glitch. By the third evening I had found the cause.',
      why: ['A precise time and place: 6 p.m., the shop', 'The problem is visible; nobody says “passionate”', 'The reader wants to know what happened next'],
      prompts: ['Where were you when you were doing what you love most?', 'Which problem would not let you rest? How did you notice it?', 'What changed afterwards? What was your first step?', 'If you told a friend this story, where would they say “wow”?'],
      ph: 'Start by describing one specific day and place…'
    }
  },
  major: {
    uz: {
      name: 'Nega bu soha', q: 'Nega aynan shu soha?',
      lesson: '“Qiziqaman” demang, qiziqishingiz amalda qanday ko‘ringanini ko‘rsating: qaysi muammoni payqadingiz, nima qildingiz, nimani hali bilmaysiz. Harakat ishtiyoqning isboti. Oxirida: hali nimani o‘rganmoqchisiz?',
      do: ['Qiziqishingiz qayerdan boshlanganini bitta voqea bilan ko‘rsating', 'Qilgan ishingizni yozing: loyiha, tanlov, tajriba, o‘qigan kitob', '“Bilmaganim”ni ayting: nimani o‘rganmoqchisiz'],
      dont: ['“Ishtiyoqim bor” yoki “doim orzu qilganman” deb qolish', 'Sohaning ta’rifini yozish: o‘quvchi buni biladi', 'Natijalarni shunchaki sanash: har birining sababini yozing'],
      weak: 'Men informatikani yaxshi ko‘raman, chunki bu zamonaviy dunyoda eng muhim soha.',
      strong: 'Maktab tanlovida yutqazgach, algoritmim nega sekin ishlashini bilish uchun ikki hafta har kechqurun tahlil qildim. Eng qizig‘i, sababni emas, uni o‘lchash usulini topdim. Endi shu usulni mashinali o‘qitishda qo‘llashni o‘rganmoqchiman.',
      why: ['Maqsad emas, harakat sifatida yozilgan', 'Aniq muddat (ikki hafta) va aniq kashfiyot bor', 'Keyin nimani o‘rganishi ko‘rsatilgan'],
      prompts: ['Bu mavzuda birinchi marta qachon qiyin savolga duch keldingiz?', 'Dars tashqarisida shu sohada nima qildingiz?', 'Qaysi narsani hali eplay olmaysiz va uni o‘rganmoqchisiz?', 'Shu sohada qaysi aniq muammoni hal qilgingiz keladi?'],
      ph: 'Qiziqishingiz amalda qanday ko‘ringanini yozing…'
    },
    ru: {
      name: 'Почему эта сфера', q: 'Почему именно эта сфера?',
      lesson: 'Не пишите «мне интересно», покажите, как интерес проявился в действиях: какую проблему вы заметили, что сделали, чего ещё не знаете. Действие доказывает увлечённость. В конце напишите, чему хотите научиться.',
      do: ['Покажите на одном случае, откуда начался интерес', 'Напишите, что вы сделали: проект, олимпиаду, опыт, прочитанную книгу', 'Назовите то, чего вы ещё не знаете и хотите изучить'],
      dont: ['Ограничиваться «у меня есть страсть» или «я всегда мечтал»', 'Писать определение сферы: читатель его знает', 'Просто перечислять результаты без объяснения, зачем они'],
      weak: 'Я люблю информатику, потому что это самая важная сфера в современном мире.',
      strong: 'Проиграв на школьной олимпиаде, я две недели каждый вечер разбирался, почему мой алгоритм медленный. Самым интересным оказалось не найти причину, а придумать способ её измерить. Теперь я хочу научиться применять этот способ в машинном обучении.',
      why: ['Написано как действие, а не как цель', 'Есть точный срок (две недели) и конкретное открытие', 'Показано, чему автор хочет научиться дальше'],
      prompts: ['Когда вы впервые столкнулись в этой теме со сложным вопросом?', 'Что вы делали в этой сфере вне уроков?', 'Что у вас пока не получается и чему вы хотите научиться?', 'Какую конкретную проблему в этой сфере вы хотите решить?'],
      ph: 'Опишите, как ваш интерес проявился на деле…'
    },
    en: {
      name: 'Why this field', q: 'Why this field, exactly?',
      lesson: 'Do not say “I am interested”; show how the interest looked in action: which problem you noticed, what you did, what you still do not know. Action is the proof of passion. End with what you still want to learn.',
      do: ['Show where the interest began with one episode', 'Write what you did: a project, a contest, an experiment, a book', 'Name what you do not know yet and want to learn'],
      dont: ['Stop at “I have a passion” or “I always dreamed”', 'Define the field; the reader already knows it', 'List results without saying why each one mattered'],
      weak: 'I love computer science because it is the most important field in the modern world.',
      strong: 'After losing a school contest, I spent two weeks of evenings working out why my algorithm was slow. The best part was not finding the cause but inventing a way to measure it. Now I want to learn to apply that method to machine learning.',
      why: ['Written as an action, not as a goal', 'A precise time (two weeks) and a concrete discovery', 'It shows what the writer wants to learn next'],
      prompts: ['When did you first meet a hard question in this subject?', 'What did you do in this field outside class?', 'What can you not do yet that you want to learn?', 'Which specific problem in this field do you want to solve?'],
      ph: 'Describe how your interest showed up in practice…'
    }
  },
  uni: {
    uz: {
      name: 'Nega bu universitet', q: 'Nega aynan shu universitet va dastur?',
      lesson: 'Reyting va “nufuzli” so‘zi hech narsani isbotlamaydi. Dastur saytidan 2–3 aniq narsani toping: kurs, laboratoriya, professor tadqiqoti, klub. Har birini o‘z hikoyangizga bog‘lang: bu menga nega kerak. Nomlarni rasmiy saytdan tekshiring.',
      do: ['2–3 aniq xususiyatni nomlang: kurs, laboratoriya, loyiha', 'Har birini o‘z tajribangiz bilan bog‘lang', 'Nomlarni universitetning rasmiy saytidan tekshiring'],
      dont: ['“Dunyoga mashhur” yoki “reytingi baland” deb yozish', 'Istalgan universitetga mos keladigan gaplar: almashtirib bo‘lsa, o‘chiring', 'Tekshirilmagan kurs yoki laboratoriya nomlari'],
      weak: 'Universitetingiz dunyodagi eng nufuzli universitetlardan biri va men u yerda o‘qishni orzu qilaman.',
      strong: 'Sizning Data Systems laboratoriyangiz o‘lchash usullari ustida ishlashini o‘qib, ikki hafta oldingi tajribam esimga tushdi. Men ham aynan shu savol ustida ishlagan edim, faqat laboratoriyam yo‘q edi.',
      why: ['Laboratoriya va yo‘nalish nomi aniq', 'Talaba o‘z tajribasi bilan bog‘lagan', 'Boshqa universitetga ko‘chirib bo‘lmaydi'],
      prompts: ['Dastur saytida qaysi kurs sizga “aynan men uchun” dedi?', 'Qaysi professor yoki laboratoriya ishi loyihangizga yaqin?', 'Qaysi klub yoki tashabbus tajribangizni davom ettiradi?', 'Bu universitetda nima bor, boshqasida yo‘q?'],
      ph: 'Bitta aniq kurs yoki laboratoriyani o‘z tajribangiz bilan bog‘lang…'
    },
    ru: {
      name: 'Почему этот вуз', q: 'Почему именно этот университет и программа?',
      lesson: 'Рейтинг и слово «престижный» ничего не доказывают. Найдите на сайте программы 2–3 конкретные вещи: курс, лабораторию, исследование профессора, клуб. Свяжите каждую со своей историей: зачем это нужно именно мне. Названия проверьте на официальном сайте.',
      do: ['Назовите 2–3 конкретные особенности: курс, лабораторию, проект', 'Свяжите каждую со своим опытом', 'Проверьте названия на официальном сайте университета'],
      dont: ['Писать «всемирно известный» или «высокий рейтинг»', 'Фразы, подходящие любому вузу: если их можно заменить, удалите', 'Непроверенные названия курсов и лабораторий'],
      weak: 'Ваш университет входит в число самых престижных в мире, и я мечтаю там учиться.',
      strong: 'Прочитав, что ваша лаборатория Data Systems работает над методами измерения, я вспомнил свои две недели вечеров с той же задачей. Я решал именно этот вопрос, только без лаборатории.',
      why: ['Точное название лаборатории и направления', 'Связано с собственным опытом автора', 'Эти строки нельзя перенести в письмо в другой вуз'],
      prompts: ['Какой курс на сайте программы вы назвали бы «именно мой»?', 'Чья лаборатория или работа близка вашему проекту?', 'Какой клуб или инициатива продолжит ваш опыт?', 'Что есть в этом вузе, чего нет в другом?'],
      ph: 'Свяжите один конкретный курс или лабораторию со своим опытом…'
    },
    en: {
      name: 'Why this university', q: 'Why this university and program?',
      lesson: 'Rankings and the word “prestigious” prove nothing. Find 2–3 concrete things on the program site: a course, a lab, a professor’s research, a club. Connect each to your own story: why I need this. Verify every name on the official site.',
      do: ['Name 2–3 specific features: a course, a lab, a project', 'Link each one to your own experience', 'Check every name on the university’s official site'],
      dont: ['Write “world-famous” or “highly ranked”', 'Use sentences that fit any university: if you can swap the name, delete it', 'Mention course or lab names you have not verified'],
      weak: 'Your university is among the most prestigious in the world, and I dream of studying there.',
      strong: 'When I read that your Data Systems lab works on measurement methods, I remembered my own two weeks of evenings on the same question. I was working on exactly that problem, only without a lab.',
      why: ['The lab and research area are named', 'The writer links it to personal experience', 'It cannot be pasted into a letter to another university'],
      prompts: ['Which course on the program page said “this one is for me”?', 'Whose lab or research is close to your project?', 'Which club or initiative would continue your experience?', 'What does this university have that another one does not?'],
      ph: 'Link one specific course or lab to your own experience…'
    }
  },
  goals: {
    uz: {
      name: 'Maqsadlar', q: 'O‘qishdan keyin nima qilmoqchisiz?',
      lesson: 'Maqsad katta shior emas, qadamlar zanjiri: o‘qish davridagi birinchi loyiha, bitirgach ish yoki tadqiqot, keyin uzoqroq yo‘nalish. Ishonarli o‘lcham va o‘z yurtingiz yoki jamoangiz bilan bog‘liqlik qabul komissiyasini ishontiradi.',
      do: ['Uch qadam yozing: o‘qish paytida, bitirgach, o‘n yildan keyin', 'Bitta aniq muammoni nomlang: kim uchun, qayerda', 'Uni hozirgi tajribangiz bilan bog‘lang'],
      dont: ['“Dunyoni o‘zgartiraman” kabi katta, noaniq da’volar', 'Faqat maosh va lavozim haqida yozish', 'O‘zingiz bilmaydigan raqam va va’dalar'],
      weak: 'Kelajakda dunyoni yaxshiroq joyga aylantirish uchun katta kompaniyada ishlamoqchiman.',
      strong: 'O‘qish davrida do‘kon egalari uchun ochiq kodli kassa dasturini tugatmoqchiman. Bitirgach, Toshkentdagi kichik bizneslar uchun xizmat yaratadigan jamoada ularning real muammolarini o‘rganaman. Keyin shu tajribadan yangi mahsulot boshlashni xohlayman.',
      why: ['Uch bosqich bor: hozir, keyin, uzoqroq', 'Kim uchun ishlashi aniq', 'O‘lchami ishonarli: kichik biznes'],
      prompts: ['O‘qish paytida nimani tugatmoqchisiz?', 'Qaysi odamlar muammosini hal qilmoqchisiz? Ularni tasvirlay olasizmi?', 'Bitirgach birinchi ishingiz yoki loyihangiz qanday bo‘ladi?', 'Yurtingizga qanday kichik, aniq qadam bilan foyda keltirmoqchisiz?'],
      ph: 'Uch qadamni yozing: o‘qish paytida, bitirgach, keyinroq…'
    },
    ru: {
      name: 'Цели', q: 'Что вы хотите делать после учёбы?',
      lesson: 'Цель — не громкий лозунг, а цепочка шагов: первый проект во время учёбы, работа или исследование после выпуска, затем более долгое направление. Правдоподобный масштаб и связь со своей страной или сообществом убеждают приёмную комиссию.',
      do: ['Напишите три шага: во время учёбы, после выпуска, через десять лет', 'Назовите одну конкретную проблему: для кого и где', 'Свяжите её с вашим нынешним опытом'],
      dont: ['Громкие и расплывчатые заявления вроде «изменю мир»', 'Писать только о зарплате и должности', 'Цифры и обещания, в которых вы не уверены'],
      weak: 'В будущем я хочу работать в крупной компании, чтобы сделать мир лучше.',
      strong: 'За время учёбы я хочу довести до конца открытую кассовую программу для владельцев магазинов. После выпуска я буду работать в команде, которая делает сервисы для малого бизнеса в Ташкенте, и изучать их реальные проблемы. Потом хочу на этом опыте запустить свой продукт.',
      why: ['Есть три этапа: сейчас, потом, позже', 'Понятно, для кого работает автор', 'Масштаб правдоподобен: малый бизнес'],
      prompts: ['Что вы хотите довести до конца за время учёбы?', 'Чью проблему вы хотите решить? Можете описать этих людей?', 'Какой будет ваша первая работа или проект после выпуска?', 'Чем вы хотите быть полезны своей стране, одним небольшим конкретным шагом?'],
      ph: 'Напишите три шага: во время учёбы, после выпуска, позже…'
    },
    en: {
      name: 'Goals', q: 'What do you want to do after your studies?',
      lesson: 'A goal is not a grand slogan but a chain of steps: a first project during your studies, a job or research after graduating, then a longer direction. A believable scale and a link to your country or community convince the committee.',
      do: ['Write three steps: during study, after graduating, in ten years', 'Name one specific problem: for whom and where', 'Connect it to what you do today'],
      dont: ['Make big, vague claims like “I will change the world”', 'Write only about salary and titles', 'Promise numbers you cannot know'],
      weak: 'In the future I want to work at a big company to make the world a better place.',
      strong: 'During my studies I want to finish an open-source cash-register program for shop owners. After graduating, I will join a team that builds services for small businesses in Tashkent and learn their real problems. Then I want to start a new product from that experience.',
      why: ['Three stages: now, next, later', 'It is clear who the writer works for', 'The scale is believable: small business'],
      prompts: ['What do you want to finish during your studies?', 'Whose problem do you want to solve? Can you describe them?', 'What will your first job or project after graduating be?', 'How will you help your country with one small, specific step?'],
      ph: 'Write three steps: during study, after graduating, later…'
    }
  },
  draft: {
    uz: {
      name: 'Qoralama', q: 'Qoralamangizdagi bitta abzatsni birga o‘qiymiz',
      lesson: 'Qoralama birinchi variant. Hozir eng muhimi aniqlik va sizning ovozingiz. Bitta abzatsni joylang: murabbiy gap-ma-gap tushuntiradi, qayerda noaniqlik, qayerda takror, qayerda ovozingiz yo‘qolgan. Esseni u yozmaydi, qayta yozasiz.',
      do: ['Gaplarni qisqartiring: bir gap, bitta fikr', '“Amalga oshirildi” o‘rniga “men qildim” deb yozing', 'Har bir sifatni tafsilot bilan almashtiring'],
      dont: ['Murakkab so‘zlar bilan hayratda qoldirmoqchi bo‘lish', 'Bir xil so‘z yoki tuzilmani takrorlash', 'Hamma fikrni bitta abzatsga sig‘dirish'],
      weak: 'Men juda mehnatsevar va qiziquvchan o‘quvchiman, har doim yangi narsalarni o‘rganishga harakat qilaman.',
      strong: 'Har juma kechqurun yangi kitob bobini o‘qib, ertasiga sinfdoshlarimga besh daqiqada tushuntirdim. Tushunmasalar, bobni qayta o‘qirdim.',
      why: ['Sifat o‘rniga odat ko‘rsatilgan', 'Takrorlanuvchi harakat va raqam bor', '“Men” o‘zini maqtamaydi, ish qiladi'],
      prompts: ['Eng zaif yoki eng ko‘p o‘zgartirgingiz kelgan abzatsni tanlang', 'Ovoz chiqarib o‘qing: qayerda to‘xtab qoldingiz?', 'Qaysi gapni do‘stingiz tushunmaydi deb o‘ylaysiz?'],
      ph: 'Bitta abzatsni shu yerga joylang…'
    },
    ru: {
      name: 'Черновик', q: 'Давайте вместе прочитаем один абзац вашего черновика',
      lesson: 'Черновик — это первый вариант. Сейчас важнее всего ясность и ваш голос. Вставьте один абзац: тренер по строкам объяснит, где расплывчато, где повторы, где потерялся ваш голос. Эссе он не пишет, переписываете вы.',
      do: ['Сокращайте предложения: одно предложение, одна мысль', 'Вместо «было сделано» пишите «я сделал»', 'Заменяйте каждый эпитет подробностью'],
      dont: ['Пытаться удивить сложными словами', 'Повторять одно и то же слово или конструкцию', 'Втискивать все мысли в один абзац'],
      weak: 'Я очень трудолюбивый и любознательный ученик и всегда стараюсь узнавать новое.',
      strong: 'Каждую пятницу вечером я читал новую главу книги, а на следующий день за пять минут объяснял её одноклассникам. Если они не понимали, я перечитывал главу.',
      why: ['Вместо качества показана привычка', 'Есть повторяющееся действие и число', '«Я» не хвалит себя, а действует'],
      prompts: ['Выберите самый слабый абзац или тот, который хочется изменить сильнее всего', 'Прочитайте вслух: где вы запнулись?', 'Какое предложение, по-вашему, друг не поймёт?'],
      ph: 'Вставьте сюда один абзац…'
    },
    en: {
      name: 'Draft', q: 'Let’s read one paragraph of your draft together',
      lesson: 'A draft is a first version. What matters now is clarity and your own voice. Paste one paragraph: the coach explains line by line where it is vague, where it repeats, where your voice disappeared. The coach does not write the essay; you rewrite it.',
      do: ['Shorten sentences: one sentence, one idea', 'Write “I did” instead of “was done”', 'Swap every adjective for a detail'],
      dont: ['Try to impress with complicated words', 'Repeat the same word or structure', 'Squeeze every idea into one paragraph'],
      weak: 'I am a very hardworking and curious student who always tries to learn new things.',
      strong: 'Every Friday evening I read a new book chapter, and the next day I explained it to my classmates in five minutes. If they did not understand, I read the chapter again.',
      why: ['A habit is shown instead of a quality', 'There is a repeated action and a number', '“I” does not praise itself; it acts'],
      prompts: ['Pick your weakest paragraph, or the one you most want to change', 'Read it aloud: where did you stumble?', 'Which sentence do you think a friend would not understand?'],
      ph: 'Paste one paragraph here…'
    }
  }
};

export const content = (k, l) => (C[k] && (C[k][l] || C[k].en)) || null;

/* ---------- klishe va noaniq so‘zlar (uch tilda; talaba esseni boshqa tilda yozishi mumkin) ---------- */
const CLICHE = [
  'since (?:i was )?(?:a )?(?:child|childhood|young|little)', 'ever since i was', 'i have always (?:been )?(?:passionate|dreamed|wanted|loved)', 'passionate about', 'passion for',
  'change the world', 'make the world a better place', 'dream come true', 'in today\'?s (?:world|society)', 'in this day and age', 'prestigious', 'world[- ]class', 'state[- ]of[- ]the[- ]art',
  'hard work and dedication', 'comfort zone', 'life[- ]changing', 'top[- ]ranked',
  'bolaligimdan(?: beri| boshlab)?', 'kichikligimdan(?: beri)?', '(?:har )?doim orzu qil\\p{L}*', 'ishtiyoq\\p{L}*', 'dunyoni (?:o\'zgartir|yaxshiroq)\\p{L}*', 'nufuzli', 'mashhur universitet\\p{L}*', 'jahonga mashhur',
  'dunyo darajasidagi', 'mehnatsevar', 'zamonaviy dunyoda', 'bugungi kunda', 'hayotimni o\'zgartir\\p{L}*',
  'с (?:самого )?детства', 'всегда мечтал\\p{L}*', 'страст\\p{L}* к', 'изменить мир', 'сделать мир лучше', 'престижн\\p{L}*', 'в современном мире', 'в наше время', 'трудолюбив\\p{L}*', 'зон\\p{L}* комфорта', 'изменил\\p{L}* мою жизнь'
];
const VAGUE = ['very', 'really', 'a lot of', 'lots of', 'many things', 'interesting', 'juda', 'ko\'p narsa\\p{L}*', 'qiziqarli', 'turli xil', 'har xil', 'очень', 'много всего', 'интересн\\p{L}*', 'разн\\p{L}* вещ\\p{L}*'];
const mk = a => new RegExp('(?<![\\p{L}])(?:' + a.join('|') + ')(?![\\p{L}])', 'giu');
const RX = { cliche: mk(CLICHE), vague: mk(VAGUE) };
const norm = s => String(s || '').replace(/[‘’ʻʼ`´]/g, '\'');
export const words = s => (String(s || '').match(/[\p{L}\p{N}][\p{L}\p{N}'’‘ʻ-]*/gu) || []).length;

/** Matnni tahlil qiladi: belgilangan oraliqlar (klishe, noaniq, aniq tafsilot) va hisoblagichlar. Sof funksiya. */
export function analyze(text) {
  const raw = String(text || ''), s = norm(raw), marks = [], n = { cliche: 0, vague: 0, det: 0 };
  for (const t of ['cliche', 'vague']) { const r = new RegExp(RX[t].source, RX[t].flags); let m; while ((m = r.exec(s))) { if (!m[0]) { r.lastIndex++; continue; } marks.push({ s: m.index, e: m.index + m[0].length, t }); n[t]++; } }
  const taken = i => marks.some(x => i >= x.s && i < x.e);
  const dr = /\d+(?:[.,:]\d+)*/g; let d; while ((d = dr.exec(s))) if (!taken(d.index)) { marks.push({ s: d.index, e: d.index + d[0].length, t: 'det' }); n.det++; }
  const tr = /[\p{L}][\p{L}'-]*/gu; let w;
  while ((w = tr.exec(s))) {
    const x = w[0]; if (x.length < 3 || !/^\p{Lu}/u.test(x) || /^I'/.test(x) || taken(w.index)) continue;
    const before = s.slice(0, w.index).replace(/[\s"'«“(\[]+$/u, ''); if (!before || /[.!?:\n…]$/.test(before) || /\n\s*$/.test(s.slice(0, w.index))) continue;
    marks.push({ s: w.index, e: w.index + x.length, t: 'det' }); n.det++;
  }
  marks.sort((a, b) => a.s - b.s);
  const out = []; for (const m of marks) { const l = out[out.length - 1]; if (l && m.s < l.e) continue; out.push(m); }
  const first = (s.trim().split(/(?<=[.!?…])\s+/)[0] || '');
  return { words: words(raw), marks: out, n, first: words(first) };
}

/** Bosqichga xos bepul tekshiruvlar: [{id, ok, val?}] */
export function checks(step, text, a, opts = {}) {
  a = a || analyze(text); const [lo, hi] = RANGE[step] || [0, 9999], out = [{ id: 'len', ok: a.words >= lo && a.words <= hi, val: `${a.words} / ${lo}–${hi}` }, { id: 'cliche', ok: a.words > 0 && a.n.cliche === 0, val: a.n.cliche ? String(a.n.cliche) : '' }, { id: 'det', ok: a.n.det >= 2 }];
  if (step === 'story') out.push({ id: 'first', ok: a.words > 0 && a.first > 0 && a.first <= 25, val: a.first ? String(a.first) : '' });
  if (step === 'uni' && opts.uni && opts.uni.trim().length > 2) out.push({ id: 'uni', ok: norm(text).toLowerCase().includes(norm(opts.uni).trim().toLowerCase().split(/[,(]/)[0].trim()) });
  if (step === 'goals') out.push({ id: 'time', ok: /\d|yil|oy\b|keyin|bitirgach|year|month|then|after|graduat|год|лет|месяц|затем|после|потом|окончан/i.test(text) });
  return out;
}

/** Bosqich "tugagan" hisoblanadi, agar hajm pastki chegaradan oshsa */
export const isDone = (step, text) => words(text) >= (RANGE[step] ? RANGE[step][0] : 1);

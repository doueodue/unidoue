/* Bildirishnomalar paneli uchun RU/EN tarjimalar. Kalit — oʻzbekcha matn aynan shunday ([uz, ru, en]); tizim xabarlari va server xabarlari ham shu yerda. */
const P = [
  ["Bildirishnomalar", "Уведомления", "Notifications"],
  ["yangi", "новых", "new"],
  ["Hozircha xabar yo‘q.", "Пока сообщений нет.", "No messages yet."],
  ["Yangiliklar, tarif va muddat eslatmalari shu yerda ko‘rinadi.", "Новости, тариф и напоминания о сроках появятся здесь.", "News, plan updates and deadline reminders will show up here."],
  ["Yangiliklarni emailga ham yuborish", "Присылать новости и на email", "Also send news by email"],
  ["Telefonda bildirishnoma yoqish", "Включить уведомления на телефоне", "Turn on phone notifications"],
  ["Tarifingiz yangilandi", "Ваш тариф обновлён", "Your plan was updated"],
  ["Promo kod qabul qilindi", "Промокод принят", "Promo code accepted"],
  ["Juda koʻp soʻrov. Birozdan keyin urinib koʻring.", "Слишком много запросов. Повторите чуть позже.", "Too many requests. Try again in a moment."],
  ["Rasm yuklash", "Загрузить фото", "Upload photo"],
  ["Rasmni almashtirish", "Заменить фото", "Change photo"],
  ["Rasm yangilandi ✓", "Фото обновлено ✓", "Photo updated ✓"],
  ["Rasm olib tashlandi.", "Фото удалено.", "Photo removed."],
  ["Rasmni sudrab, yuzni doira o‘rtasiga keltiring.", "Перетащите фото, чтобы лицо было в центре круга.", "Drag the photo to centre your face in the circle."],
  ["Rasm JPEG formatida boʻlsin.", "Фото должно быть в формате JPEG.", "The photo must be a JPEG."],
  ["Rasm juda katta. Kichikroq rasm tanlang.", "Фото слишком большое. Выберите поменьше.", "The photo is too large. Choose a smaller one."],
  ["Rasm buzilgan. Boshqa rasm tanlang.", "Файл повреждён. Выберите другое фото.", "The file looks damaged. Choose another photo."],
  ["Rasm oʻlchami mos emas.", "Недопустимый размер фото.", "The photo size is not supported."],
  ["Rasm yoʻq.", "Фото нет.", "No photo."],
  ["Juda koʻp urinish. Birozdan keyin urinib koʻring.", "Слишком много попыток. Повторите чуть позже.", "Too many attempts. Try again in a moment."]
];
export const NRU = Object.fromEntries(P.map(x => [x[0], x[1]]));
export const NEN = Object.fromEntries(P.map(x => [x[0], x[2]]));

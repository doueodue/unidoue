/* Promo kod (Tariflar sahifasi) uchun RU/EN tarjimalar. Kalit — oʻzbekcha matn aynan shunday ([uz, ru, en]); server xabarlari ham shu yerda. */
const P = [
  ["Promo kodingiz bormi?", "У вас есть промокод?", "Have a promo code?"],
  ["Kodni kiriting — Plus yoki Pro bepul yoqiladi.", "Введите код — Plus или Pro включится бесплатно.", "Enter the code — Plus or Pro is switched on for free."],
  ["Faollashtirish", "Активировать", "Activate"],
  ["Promo kod", "Промокод", "Promo code"],
  ["Promo kodni kiriting.", "Введите промокод.", "Enter a promo code."],
  ["Tekshirilmoqda…", "Проверяем…", "Checking…"],
  ["Plus yoqildi", "Plus включён", "Plus is on"],
  ["Pro yoqildi", "Pro включён", "Pro is on"],
  ["Plus tarifi yoqildi", "Тариф Plus включён", "Plus plan activated"],
  ["Pro tarifi yoqildi", "Тариф Pro включён", "Pro plan activated"],
  ["Promo kod qabul qilindi. Amal qilish muddati:", "Промокод принят. Срок действия:", "Promo code accepted. Valid:"],
  ["Bunday promo kod topilmadi. Yozilishini tekshiring.", "Такой промокод не найден. Проверьте написание.", "This promo code was not found. Check the spelling."],
  ["Bu promo kod hozir faol emas.", "Этот промокод сейчас не активен.", "This promo code is not active right now."],
  ["Bu promo kodning amal qilish muddati tugagan.", "Срок действия этого промокода истёк.", "This promo code has expired."],
  ["Siz bu promo koddan allaqachon foydalangansiz.", "Вы уже использовали этот промокод.", "You have already used this promo code."],
  ["Bu promo kod boʻyicha joylar tugagan.", "Места по этому промокоду закончились.", "All spots for this promo code have been taken."],
  ["Sizda bundan yuqoriroq tarif faol, shuning uchun bu kod kerak emas.", "У вас уже действует более высокий тариф, поэтому этот код не нужен.", "You already have a higher plan, so this code isn't needed."],
  ["Bu tarif sizda muddatsiz yoqilgan.", "Этот тариф у вас включён бессрочно.", "This plan is already on for you with no end date."],
  ["Juda koʻp notoʻgʻri urinish. 15 daqiqadan keyin qayta urinib koʻring.", "Слишком много неверных попыток. Повторите через 15 минут.", "Too many wrong attempts. Try again in 15 minutes."],
];
export const QRU = Object.fromEntries(P.map(x => [x[0], x[1]]));
export const QEN = Object.fromEntries(P.map(x => [x[0], x[2]]));

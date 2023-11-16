import i18next from 'i18next';
// import resources from './';
import en from './en';
import ru from './ru';

i18next.init({
  lng: 'ru',
  debug: false,
  en,
  ru,
});

export default i18next;

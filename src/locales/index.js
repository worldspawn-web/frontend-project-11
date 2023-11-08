import i18next from 'i18next';
import resources from './';

i18next.init({
  lng: 'ru',
  debug: false,
  resources,
});

export default i18next;

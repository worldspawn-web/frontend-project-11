import './styles.scss';
import 'bootstrap';

import { object, string, setLocale } from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';

import resources from './locales';
import parse from './rss.js';

//
// WE CAN'T USE ASYNC/AWAIT
// WE MUST USE PROMISES
//

const app = () => {
  setLocale({
    mixed: {
      required: () => ({ key: 'requiredField' }),
      notOneOf: () => ({ key: 'alreadyInList' }),
    },
    string: {
      url: () => ({ key: 'notUrl' }),
      required: () => ({ key: 'empty' }),
    },
  });

  const state = {
    formState: 'filling',
    error: null,
    posts: [],
    feeds: [],
    url: 'https://example.com/rss',
  };

  const elements = {
    form: document.getElementById('url-form'),
    errorEl: document.getElementById('url-error'),
    input: document.getElementById('url-input'),
  };

  const i18nextInstance = i18next.createInstance();
  i18nextInstance
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => {
      const watchedState = onChange(
        state,
        render(state, elements, i18nextInstance)
      );
      const createSchema = (validatedLinks) =>
        yup.string().required().url().notOneOf(validatedLinks);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const addedLinks = watchedState.feeds.map((feed) => feed.link);
        const schema = createSchema(addedLinks);
        const formData = new FormData(e.target);
        const input = formData.get('url');
        schema.validate(input).then(() => {
          watchedState.error = null;
          watchedState.formState = 'sending';
          return getData(input);
        });
      });
    });

  let rssSchema = object().shape({
    url: string().required().url(),
  });

  const validateRss = (url) => {
    return new Promise((resolve, reject) => {
      rssSchema
        .validate({ url })
        .then(() => {
          resolve('valid');
        })
        .catch((error) => {
          reject(error.errors);
        });
    });
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get('url');
    state.url = url;

    validateRss(state.url)
      .then((result) => {
        // result will be used later
        console.log('RSS -> OK');
        state.error = [];
        watchedState.dispose(); // disable watched state after successful validation
      })
      .catch((errors) => {
        const errorMessages = errors.map((error) => i18next.t(error));
        console.log('RSS -> ERROR', errorMessages);
        watchedState.error = errorMessages;
      });
  });
};

export default app;

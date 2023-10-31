import './styles.scss';
import 'bootstrap';

import { object, string } from 'yup';
import onChange from 'on-change';

// WE WILL USE ONLY:
// GRID / ACCORDION / API
// FROM BOOTSTRAP

//
// WE CAN'T USE ASYNC/AWAIT
// WE MUST USE PROMISES
//

console.log('Hello, Mom!'); // connected successfully

const state = {
  status: 'filling',
  error: [],
  url: 'https://example.com/rss',
};

const elements = {
  form: document.getElementById('url-form'),
  errorEl: document.getElementById('url-error'),
  input: document.getElementById('url-input'),
};

const watchedState = onChange(state.error, () => {
  elements.errorEl.textContent = state.error.join(', ');

  if (state.error.length > 0) {
    //   elements.errorEl.classList.add('show');
    elements.input.classList.add('is-invalid');
  }
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
      console.log('RSS -> OK');
      watchedState.error = [];
      watchedState.dispose(); // disable watched state after successful validation
    })
    .catch((errors) => {
      console.log('RSS -> ERROR', errors);
      watchedState.error = errors;
    });
});

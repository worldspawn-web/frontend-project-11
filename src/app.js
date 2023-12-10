import './styles.scss';
import 'bootstrap';

import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';

import resources from './locales';
import parse from './rss';

import render from './render';

import {
  handleData, handleError,
} from './render.js';
import axios from 'axios';
import { uniqueId } from 'lodash';


const addProxy = (url) => {
  const newUrl = new URL('/get', 'https://allorigins.hexlet.app');
  newUrl.searchParams.append('disableCache', 'true'); // cache needs to be disabled to receive new threads (see -> all-origins doc)
  newUrl.searchParams.append('url', url);
  return newUrl.toString();
};

const getData = (url) =>
// eslint-disable-next-line implicit-arrow-linebreak
  axios.get(addProxy(url), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });

const setIds = (posts, feedId) => {
  posts.forEach((post) => {
    post.id = uniqueId();
    post.feedId = feedId;
  });
};

const updatePosts = (watchedState) => {
  const updateInterval = 5000;
  const promises = watchedState.feeds.map((feed) =>
  // eslint-disable-next-line implicit-arrow-linebreak
    getData(feed.link)
      .then((response) => {
        const { posts } = parse(response.data.contents);
        const statePosts = watchedState.posts;
        const currentIdPosts = statePosts.filter(
          (post) => post.feedId === feed.id,
        );
        const displayedPostLinks = currentIdPosts.map((post) => post.link);
        const newPosts = posts.filter(
          (post) => !displayedPostLinks.includes(post.link),
        );
        setIds(newPosts, feed.id);
        watchedState.posts.unshift(...newPosts);
      })
      .catch((error) => {
        console.error(
          `Whoops, something is wrong with fetching data from feed ${feed.id}:`,
          error,
        );
      }));
  return Promise.all(promises).finally(() =>
  // eslint-disable-next-line implicit-arrow-linebreak
    setTimeout(() => updatePosts(watchedState), updateInterval),
  // eslint-disable-next-line function-paren-newline
  );
};

const app = () => {
  yup.setLocale({
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
    processState: 'filling',
    error: null,
    posts: [],
    feeds: [],
    uiState: {
      displayedPost: null,
      viewedPostIds: new Set(),
    },
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    submit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    postsList: document.querySelector('.posts'),
    feedsList: document.querySelector('.feeds'),
    // modal
    modal: document.querySelector('.modal'),
    modalHeader: document.querySelector('.modal-header'),
    modalBody: document.querySelector('.modal-body'),
    modalHref: document.querySelector('.full-article'),
  };

  const i18nextInstance = i18next.createInstance();
  i18nextInstance
    .init({
      lng: 'ru', // def
      debug: true,
      resources,
    })
    .then(() => {
      const watchedState = onChange(
        state,
        render(state, elements, i18nextInstance),
      );

      // eslint-disable-next-line arrow-body-style
      // eslint-disable-next-line max-len
      const createSchema = (validatedLinks) => yup.string().required().url().notOneOf(validatedLinks);
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const addedLinks = watchedState.feeds.map((feed) => feed.link);
        const schema = createSchema(addedLinks);
        const formData = new FormData(e.target);
        const input = formData.get('url');

        schema
          .validate(input)
          .then(() => {
            watchedState.error = null;
            watchedState.processState = 'sending';
            return getData(input);
          })
          .then((response) => {
            const data = parse(response.data.contents, input);
            handleData(data, watchedState);
            watchedState.processState = 'added';
          })
          .catch((error) => {
            watchedState.processState = 'invalid';
            watchedState.error = handleError(error);
          });
      });

      elements.postsList.addEventListener('click', (e) => {
        const postId = e.target.dataset.id;
        if (postId) {
          watchedState.uiState.displayedPost = postId;
          watchedState.uiState.viewedPostIds.add(postId);
        }
      });
      updatePosts(watchedState);
    });
};

export default app;
export { setIds };
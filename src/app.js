import './styles.scss';
import 'bootstrap';

import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';

import resources from './locales';
import parse from './rss';

import render from './render';

//
// WE CAN'T USE ASYNC/AWAIT
// WE MUST USE PROMISES
//

const addProxy = (url) => {
  // proxy (All-Origins)
  const newUrl = new URL('/get', 'https://allorigins.hexlet.app');
  newUrl.searchParams.append('disableCache', 'true'); // cache needs to be disabled to receive new threads (see -> all-origins doc)
  newUrl.searchParams.append('url', url);
  return newUrl.toString();
};

const getData = (url) =>
// fuck the airbnb, embrace prettier
// eslint-disable-next-line implicit-arrow-linebreak
  axios.get(addProxy(url), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });

// unique ids for every post
const setIds = (posts, feedId) => {
  posts.forEach((post) => {
    post.id = uniqueId();
    post.feedId = feedId;
  });
};

const handleData = (data, watchedState) => {
  const { feed, posts } = data;
  feed.id = uniqueId();
  watchedState.feeds.push(feed);
  setIds(posts, feed.id);
  watchedState.posts.push(...posts);
};

const updatePosts = (watchedState) => {
  const promises = watchedState.feeds.map((feed) =>
  // fuck the airbnb, embrace prettier
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
      }),
  );
  // fuck the airbnb, embrace prettier
  return Promise.all(promises).finally(() =>
  // eslint-disable-next-line implicit-arrow-linebreak
    setTimeout(() => updatePosts(watchedState), 5000),
  // eslint-disable-next-line function-paren-newline 
  );
};

const handleError = (error) => {
  if (error.isParsingError) return 'notRSS';
  if (axios.isAxiosError(error)) return 'networkError';
  return error.message.key ?? 'unknown';
};

const app = () => {
  console.log('App has been called.');
  // defines yup + i18n work
  yup.setLocale({
    mixed: {
      required: () => ({ key: 'requiredField' }),
      notOneOf: () => ({ key: 'alreadyInList' }), // can't add the same rss twice
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
    uiState: {
      displayedPost: null,
      viewedPostIds: new Set(),
    },
  };

  // improved selectors
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    submit: document.querySelector('[type="submit"]'), // is this better?
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
        // whole render is being watched for any changes in DOM
        render(state, elements, i18nextInstance),
      );

      // fuck the airbnb, embrace prettier
      // eslint-disable-next-line arrow-body-style
      // eslint-disable-next-line max-len
      const createSchema = (validatedLinks) => yup.string().required().url().notOneOf(validatedLinks);
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const addedLinks = watchedState.feeds.map((feed) => feed.link);
        const schema = createSchema(addedLinks);
        const formData = new FormData(e.target);
        const input = formData.get('url');

        // eslint-disable-next-line no-debugger
        // debugger;

        schema
          .validate(input)
          .then(() => {
            watchedState.error = null;
            watchedState.formState = 'sending';
            return getData(input);
          })
          .then((response) => {
            const data = parse(response.data.contents, input);
            handleData(data, watchedState);
            watchedState.formState = 'added';
          })
          .catch((error) => {
            watchedState.formState = 'invalid';
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

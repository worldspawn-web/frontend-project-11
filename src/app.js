import './styles.scss';
import 'bootstrap';

import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import { uniq, uniqueId, update } from 'lodash';

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

const getData = (url) => axios.get(addProxy(url));

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
  return Promise.all(promises).finally(() =>
    setTimeout(() => updatePosts(watchedState), 5000),
  );
};

const handleError = (error) => {
  if (error.isParsingError) return 'notRSS';
  if (axios.isAxiosError(error)) return 'networkError';
  return error.message.key ?? 'unknown';
};

const app = () => {
  console.log('app was call');
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
    formStatus: 'filling', // to not allow send the GET request twice and switch between ui states
    error: null,
    posts: [],
    feeds: [],
    url: 'https://example.com/rss',
    modalState: {
      displayedPostId: null,
      // I think that Set will work the best here, since it removes any arr duplications
      viewedPostIds: new Set(),
    },
  };

  // all the query elements are being store here
  const elements = {
    form: document.getElementById('url-form'),
    input: document.getElementById('url-input'),
    errorEl: document.getElementById('url-error'),
    submit: document.getElementById('url-submit-btn'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
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
      debug: true, // ?
      resources,
    })
    .then(() => {
      const watchedState = onChange(
        state,
        // whole render is being watched for any changes in DOM
        render(state, elements, i18nextInstance),
      );
      const createSchema = (validatedLinks) =>
        yup.string().required().url().notOneOf(validatedLinks); // +check for already added rss

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault(); // doesn't work?
        const addedLinks = watchedState.feeds.map((feed) => feed.link);
        const schema = createSchema(addedLinks);
        const formData = new FormData(e.target);
        const input = formData.get('url');
        schema
          .validate(input)
          .then(() => {
            watchedState.error = null;
            watchedState.formStatus = 'sending';
            return getData(input);
          })
          .then((response) => {
            const data = parse(response.data.contents, input);
            handleData(data, watchedState);
            watchedState.formStatus = 'added';
          })
          .catch((error) => {
            watchedState.formStatus = 'invalid';
            watchedState.error = handleError(error);
          });

        return false;
      });

      elements.postsList.addEventListener('click', (e) => {
        const postId = e.target.dataset.id;
        if (postId) {
          watchedState.uiState.displayedPostId = postId;
          watchedState.uiState.viewedPostIds.add(postId);
        }
      });
      updatePosts(watchedState);
    });
};

export default app;

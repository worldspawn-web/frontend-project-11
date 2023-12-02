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

const handleData = (data, watchedState) => {
  const { feed, posts } = data;
  feed.id = uniqueId();
  watchedState.feeds.push(feed);
  setIds(posts, feed.id);
  watchedState.posts.push(...posts);
};

const handleError = (error) => {
  if (error.isParsingError) return 'notRSS';
  if (axios.isAxiosError(error)) return 'networkError';
  return error.message.key ?? 'unknown';
};

export {
  addProxy, getData, setIds, handleData, handleError,
};

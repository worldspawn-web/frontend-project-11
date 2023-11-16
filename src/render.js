const createFeeds = (state) => {
  const feeds = [];
  state.feeds.forEach((feed) => {
    const liElement = document.createElement('li');
    liElement.classList.add('list-group-item', 'border-0', 'border-end-0');
    const feedTitle = document.createElement('h3');
    feedTitle.classList.add('h6', 'm-0');
    feedTitle.textContent = feed.title;
    liElement.append(feedTitle);
    const pEl = document.createElement('p');
    pEl.classList.add('m-0', 'small', 'text-black-50');
    pEl.textContent = feed.description;

    liElement.append(pEl);
    feeds.push(liElement);
  });
  return feeds;
};

const createButton = (post, i18next) => {
  const btnElement = document.createElement('button');
  btnElement.setAttribute('type', 'button');
  btnElement.setAttribute('data-id', post.id);
  btnElement.setAttribute('data-bs-toggle', 'modal');
  btnElement.setAttribute('data-bs-target', '#modal');
  btnElement.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  btnElement.textContent = i18next.t('buttons.view');
  return btnElement;
};

const createPosts = (state, i18next) => {
  const posts = [];
  state.posts.forEach((post) => {
    const liElement = document.createElement('li');
    liElement.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );
    const anchorElement = document.createElement('a');
    anchorElement.setAttribute('href', post.link);
    anchorElement.setAttribute('data-id', post.id);
    anchorElement.setAttribute('target', '_blank');
    anchorElement.setAttribute('rel', 'noopener noreferrer');

    // mark as read functionality
    if (state.uiState.viewedPostIds.has(post.id)) {
      anchorElement.classList.add('fw-normal');
    } else {
      anchorElement.classList.add('fw-bold');
    }
    anchorElement.textContent = post.title;
    const btnElement = createButton(post, i18next);
    liElement.append(anchorElement);
    liElement.append(btnElement);
    posts.push(liElement);
  });
  return posts;
};

const createList = (itemsType, state, i18next) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');

  cardBody.append(cardTitle);
  card.append(cardBody);

  cardTitle.textContent = i18next.t(`items.${itemsType}`);
  switch (itemsType) {
    case 'feeds':
      list.append(...createFeeds(state));
      break;
    case 'posts':
      list.append(...createPosts(state, i18next));
      break;
    default:
      break;
  }

  card.append(list);
  return card;
};

const renderInvalid = ({ submit, urlInput, feedback }) => {
  submit.disabled = false;
  urlInput.classList.add('is-invalid');
  feedback.classList.remove('text-success');
  feedback.classList.remove('text-warning');
  feedback.classList.add('text-danger');
};

const renderSending = ({ submit, urlInput, feedback }, i18next) => {
  submit.disabled = true;
  urlInput.classList.remove('is-invalid');
  feedback.classList.remove('text-danger');
  feedback.classList.remove('text-success');
  feedback.classList.add('text-warning');
  feedback.textContent = i18next.t('status.sending');
};

const renderAdded = ({ submit, urlInput, feedback, form }, i18next) => {
  submit.disabled = false;
  urlInput.classList.remove('is-invalid');
  feedback.classList.remove('text-danger');
  feedback.classList.remove('text-warning');
  feedback.classList.add('text-success');
  feedback.textContent = i18next.t('status.success');

  form.reset();
  urlInput.focus();
};

const renderState = (elements, i18next, value) => {
  switch (value) {
    case 'invalid':
      renderInvalid(elements);
      break;
    case 'sending':
      renderSending(elements, i18next);
      break;
    case 'added': {
      renderAdded(elements, i18next);
      break;
    }
    default:
      break;
  }
};

const renderError = (state, { feedback }, i18next, error) => {
  if (error === null) return;

  feedback.classList.add('text-danger');
  feedback.textContent = i18next.t(`errors.${state.error}`);
};

const renderFeeds = (state, { feedsList }, i18next) => {
  feedsList.innerHTML = '';
  const feeds = createList('feeds', state, i18next);
  feedsList.append(feeds);
};

const renderPosts = (state, { postsList }, i18next) => {
  postsList.innerHTML = '';
  const posts = createList('posts', state, i18next);
  postsList.append(posts);
};

const renderDisplayedPost = (
  state,
  { modalHeader, modalBody, modalHref },
  id,
) => {
  const posts = state.posts.filter((post) => post.id === id);
  const [{ description, link, title }] = posts;
  modalHeader.textContent = title;
  modalBody.textContent = description;
  modalHref.setAttribute('href', link);
};

const render = (state, elements, i18next) => (path, value) => {
  const renderFunctions = {
    formState: () => renderState(elements, i18next, value),
    error: () => renderError(state, elements, i18next, value),
    feeds: () => renderFeeds(state, elements, i18next),
    posts: () => renderPosts(state, elements, i18next),
    'uiState.viewedPostIds': () => renderPosts(state, elements, i18next),
    'uiState.displayedPost': () => renderDisplayedPost(state, elements, value),
  };

  const renderFunction = renderFunctions[path];
  if (renderFunction) renderFunction();
};

export default render;

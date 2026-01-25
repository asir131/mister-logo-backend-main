const LATE_API_BASE_URL = process.env.LATE_API_BASE_URL || 'https://api.getlate.dev/v1';
const LATE_API_KEY = process.env.LATE_API_KEY;
const LATE_OAUTH_REDIRECT_URI = process.env.LATE_OAUTH_REDIRECT_URI;

function ensureApiKey() {
  if (!LATE_API_KEY) {
    throw new Error('LATE_API_KEY is not configured');
  }
}

async function request(path, options = {}) {
  ensureApiKey();
  const res = await fetch(`${LATE_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${LATE_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || data?.message || 'LATE API request failed';
    const error = new Error(message);
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function connectAccount(userId) {
  return request('/accounts/connect', {
    method: 'POST',
    body: JSON.stringify({
      externalUserId: userId,
      redirectUri: LATE_OAUTH_REDIRECT_URI,
    }),
  });
}

async function handleOAuthCallback(query) {
  return request('/accounts/callback', {
    method: 'POST',
    body: JSON.stringify({
      code: query.code,
      state: query.state,
      redirectUri: LATE_OAUTH_REDIRECT_URI,
    }),
  });
}

async function getConnectedAccounts(lateAccountId) {
  return request(`/accounts/${lateAccountId}`);
}

async function disconnectAccount(lateAccountId, platform) {
  return request(`/accounts/${lateAccountId}/disconnect`, {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
}

async function createPost({ content, mediaUrls, platforms, scheduledAt, lateAccountId }) {
  if (!lateAccountId) {
    const error = new Error('LATE account not connected.');
    error.status = 400;
    throw error;
  }
  return request('/posts', {
    method: 'POST',
    body: JSON.stringify({
      accountId: lateAccountId,
      content,
      mediaUrls,
      platforms,
      scheduledAt,
    }),
  });
}

async function getPostStatus(latePostId) {
  return request(`/posts/${latePostId}`);
}

async function deletePost(latePostId) {
  return request(`/posts/${latePostId}`, { method: 'DELETE' });
}

async function migrateTokens({ userId, tokens }) {
  return request('/accounts/migrate', {
    method: 'POST',
    body: JSON.stringify({
      externalUserId: userId,
      tokens,
    }),
  });
}

module.exports = {
  connectAccount,
  handleOAuthCallback,
  getConnectedAccounts,
  disconnectAccount,
  createPost,
  getPostStatus,
  deletePost,
  migrateTokens,
};

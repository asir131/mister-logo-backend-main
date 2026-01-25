const LATE_API_BASE_URL = process.env.LATE_API_BASE_URL || 'https://getlate.dev/api/v1';
const LATE_API_KEY = process.env.LATE_API_KEY;
const LATE_OAUTH_REDIRECT_URI = process.env.LATE_OAUTH_REDIRECT_URI;
const LATE_PROFILE_ID = process.env.LATE_PROFILE_ID;

function ensureApiKey() {
  if (!LATE_API_KEY) {
    throw new Error('LATE_API_KEY is not configured');
  }
}

async function request(path, options = {}) {
  ensureApiKey();
  const url = `${LATE_API_BASE_URL}${path}`;
  const res = await fetch(url, {
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
    error.url = url;
    error.method = options.method || 'GET';
    error.requestBody = options.body;
    throw error;
  }
  return data;
}

async function connectAccount(userId, platform) {
  if (!platform) {
    const error = new Error('platform is required for LATE connect.');
    error.status = 400;
    throw error;
  }
  if (!LATE_PROFILE_ID) {
    const error = new Error('LATE_PROFILE_ID is not configured.');
    error.status = 500;
    throw error;
  }
  const redirectUrl = LATE_OAUTH_REDIRECT_URI
    ? `${LATE_OAUTH_REDIRECT_URI}${LATE_OAUTH_REDIRECT_URI.includes('?') ? '&' : '?'}userId=${userId}`
    : '';
  const params = new URLSearchParams({
    profileId: LATE_PROFILE_ID,
    redirect_url: redirectUrl,
  });
  return request(`/connect/${platform}?${params.toString()}`, { method: 'GET' });
}

async function handleOAuthCallback(query) {
  return request(`/connect/callback?${new URLSearchParams(query).toString()}`, {
    method: 'GET',
  });
}

async function getConnectedAccounts(lateAccountId) {
  const params = lateAccountId ? `?profileId=${lateAccountId}` : '';
  return request(`/accounts${params}`, { method: 'GET' });
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
  const mediaItems = (mediaUrls || []).map((url) => {
    let type = 'image';
    if (typeof url === 'string') {
      const lower = url.toLowerCase();
      if (lower.match(/\.mp4|\.mov|\.webm|\.mkv|\.avi/)) {
        type = 'video';
      } else if (lower.match(/\.mp3|\.wav|\.m4a|\.aac/)) {
        type = 'audio';
      }
    }
    return { url, type };
  });
  return request('/posts', {
    method: 'POST',
    body: JSON.stringify({
      profileId: lateAccountId,
      content,
      mediaItems,
      platforms: platforms || [],
      scheduledFor: scheduledAt,
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

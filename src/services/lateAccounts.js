const User = require('../models/User');
const lateApi = require('./lateApi');

function normalizeAccountsResponse(data, profileId) {
  const raw = Array.isArray(data?.accounts) ? data.accounts : Array.isArray(data) ? data : [];
  return raw
    .map((account) => ({
      platform: String(account.platform || account.provider || '').toLowerCase(),
      accountId: account._id || account.id || account.accountId,
      username: account.username,
      displayName: account.displayName,
      profileId: account.profileId || profileId,
    }))
    .filter((account) => account.platform && account.accountId);
}

async function syncAccountsForUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user?.lateAccountId) {
    const error = new Error('LATE account not connected.');
    error.status = 400;
    throw error;
  }

  const response = await lateApi.getConnectedAccounts(user.lateAccountId);
  const accounts = normalizeAccountsResponse(response, user.lateAccountId);

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        connectedPlatforms: accounts.map((acc) => acc.platform),
        connectedAccounts: accounts,
      },
    },
  );
  return { accounts, lateProfileId: user.lateAccountId };
}

async function resolvePlatformsForUser(userId, targets) {
  const { accounts, lateProfileId } = await syncAccountsForUser(userId);

  const requested = (targets || []).map((t) => String(t).toLowerCase());
  const platforms = [];
  const missing = [];

  requested.forEach((platform) => {
    const match = accounts.find((acc) => acc.platform === platform);
    if (match) {
      platforms.push({ platform: match.platform, accountId: match.accountId });
    } else {
      missing.push(platform);
    }
  });

  return { platforms, missing, lateProfileId };
}

module.exports = {
  syncAccountsForUser,
  resolvePlatformsForUser,
};

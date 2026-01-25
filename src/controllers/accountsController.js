const User = require('../models/User');
const lateApi = require('../services/lateApi');
const { syncAccountsForUser } = require('../services/lateAccounts');

async function connectLate(req, res) {
  try {
    const userId = req.user.id;
    const platform = req.body?.platform || req.query?.platform;
    const data = await lateApi.connectAccount(userId, platform);
    return res.status(200).json({
      url: data.url,
      authUrl: data.authUrl,
      accountId: data.accountId,
    });
  } catch (err) {
    console.error('LATE connect error:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function lateCallback(req, res) {
  try {
    if (req.query.error) {
      return res.status(400).json({ error: req.query.error });
    }
    let userId = req.query.userId;
    if (typeof userId === 'string' && userId.includes('?')) {
      userId = userId.split('?')[0];
    }
    const connectedPlatform = req.query.connected || req.query.platform;
    const profileId = req.query.profileId || process.env.LATE_PROFILE_ID;

    if (userId && profileId) {
      const updates = {
        lateAccountId: profileId,
      };
      const ops = { $set: updates };
      if (connectedPlatform) {
        ops.$addToSet = { connectedPlatforms: connectedPlatform };
      }
      await User.updateOne({ _id: userId }, ops);
      try {
        await syncAccountsForUser(userId);
      } catch (syncError) {
        console.error('LATE sync accounts error:', syncError);
      }
    }

    return res.status(200).json({
      ok: true,
      userId,
      profileId,
      connected: connectedPlatform || null,
    });
  } catch (err) {
    console.error('LATE callback error:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function listAccounts(req, res) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (!user?.lateAccountId) {
      return res.status(200).json({ accounts: [] });
    }
    const { accounts } = await syncAccountsForUser(req.user.id);
    return res.status(200).json({
      accounts,
      lateAccountId: user.lateAccountId,
    });
  } catch (err) {
    console.error('LATE list accounts error:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function disconnectAccount(req, res) {
  try {
    const platform = req.params.platform;
    const user = await User.findById(req.user.id).lean();
    if (!user?.lateAccountId) {
      return res.status(400).json({ error: 'No LATE account connected.' });
    }
    await lateApi.disconnectAccount(user.lateAccountId, platform);
    return res.status(200).json({ disconnected: true });
  } catch (err) {
    console.error('LATE disconnect error:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  connectLate,
  lateCallback,
  listAccounts,
  disconnectAccount,
};

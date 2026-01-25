const User = require('../models/User');
const lateApi = require('../services/lateApi');

async function connectLate(req, res) {
  try {
    const userId = req.user.id;
    const data = await lateApi.connectAccount(userId);
    return res.status(200).json({ url: data.url, accountId: data.accountId });
  } catch (err) {
    console.error('LATE connect error:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function lateCallback(req, res) {
  try {
    const data = await lateApi.handleOAuthCallback(req.query);
    const accountId = data.accountId || data.id;
    const externalUserId = data.externalUserId;
    if (accountId && externalUserId) {
      await User.updateOne(
        { _id: externalUserId },
        { $set: { lateAccountId: accountId, connectedPlatforms: data.platforms || [] } },
      );
    }
    return res.status(200).json({ ok: true, accountId });
  } catch (err) {
    console.error('LATE callback error:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function listAccounts(req, res) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user?.lateAccountId) {
      return res.status(200).json({ accounts: [] });
    }
    const data = await lateApi.getConnectedAccounts(user.lateAccountId);
    return res.status(200).json({ accounts: data.accounts || data });
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

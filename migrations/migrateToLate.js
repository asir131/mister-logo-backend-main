const mongoose = require('mongoose');
const User = require('../src/models/User');
const lateApi = require('../src/services/lateApi');

const MONGODB_URI = process.env.MONGODB_URI;
const DRY_RUN = process.env.MIGRATE_DRY_RUN === 'true';

const TOKEN_FIELDS = [
  'twitterToken',
  'twitterTokens',
  'tiktokToken',
  'tiktokTokens',
  'snapchatToken',
  'snapchatTokens',
  'youtubeToken',
  'youtubeTokens',
  'instagramToken',
  'instagramTokens',
  'facebookToken',
  'facebookTokens',
];

function extractLegacyTokens(user) {
  const tokens = {};
  TOKEN_FIELDS.forEach((field) => {
    if (user[field]) {
      tokens[field] = user[field];
    }
  });
  return Object.keys(tokens).length ? tokens : null;
}

async function run() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured.');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const users = await User.find({ lateAccountId: { $exists: false } }).lean();
  console.log(`Found ${users.length} users without LATE accounts.`);

  for (const user of users) {
    const legacyTokens = user.legacyPlatformTokens || extractLegacyTokens(user);
    const payload = legacyTokens ? { tokens: legacyTokens } : { tokens: {} };

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would migrate user ${user._id}`);
      continue;
    }

    try {
      const response = await lateApi.migrateTokens({
        userId: user._id.toString(),
        ...payload,
      });

      const updates = {
        lateAccountId: response.accountId || response.id,
      };

      if (legacyTokens) {
        updates.legacyPlatformTokens = legacyTokens;
      }
      if (response.platforms) {
        updates.connectedPlatforms = response.platforms;
      }

      await User.updateOne({ _id: user._id }, { $set: updates });
      console.log(`Migrated user ${user._id}`);
    } catch (err) {
      console.error(`Failed to migrate user ${user._id}:`, err.message);
    }
  }

  await mongoose.disconnect();
  console.log('Migration complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

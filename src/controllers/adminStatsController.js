const User = require('../models/User');
const Post = require('../models/Post');
const UBlast = require('../models/UBlast');

async function getAdminStats(req, res) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startDate = new Date(startOfToday);
  startDate.setDate(startDate.getDate() - 6);

  const platforms = ['instagram', 'tiktok', 'youtube', 'snapchat', 'twitter', 'facebook'];
  const [
    totalUsers,
    totalUblasts,
    totalUblastShares,
    totalUposts,
    totalActiveUsers,
    userGrowthRaw,
    platformSharesRaw,
    topHashtagsRaw,
    latestUblast,
  ] = await Promise.all([
    User.countDocuments(),
    UBlast.countDocuments({ $or: [{ rewardType: { $exists: false } }, { rewardType: { $ne: 'reward' } }] }),
    Post.countDocuments({ ublastId: { $exists: true, $ne: null } }),
    Post.countDocuments({
      status: 'published',
      $or: [{ ublastId: null }, { ublastId: { $exists: false } }],
      $or: [
        { postType: 'upost' },
        { postType: { $exists: false } },
        { postType: null },
      ],
    }),
    User.countDocuments({
      ublastManualBlocked: { $ne: true },
      $or: [
        { ublastBlockedUntil: { $exists: false } },
        { ublastBlockedUntil: null },
        { ublastBlockedUntil: { $lte: now } },
      ],
    }),
    User.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: now } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Post.aggregate([
      {
        $match: {
          $or: [
            { shareTargets: { $exists: true, $ne: [] } },
            { shareToFacebook: true },
            { shareToInstagram: true },
          ],
        },
      },
      {
        $project: {
          targets: {
            $setUnion: [
              { $ifNull: ['$shareTargets', []] },
              { $cond: [{ $eq: ['$shareToFacebook', true] }, ['facebook'], []] },
              { $cond: [{ $eq: ['$shareToInstagram', true] }, ['instagram'], []] },
            ],
          },
        },
      },
      { $unwind: '$targets' },
      { $group: { _id: '$targets', count: { $sum: 1 } } },
    ]),
    Post.aggregate([
      {
        $match: {
          description: { $type: 'string', $ne: '' },
          status: 'published',
        },
      },
      {
        $project: {
          matches: {
            $regexFindAll: {
              input: '$description',
              regex: /#([\p{L}\p{N}_-]+)/gu,
            },
          },
        },
      },
      { $unwind: '$matches' },
      {
        $project: {
          tag: {
            $toLower: {
              $concat: ['#', { $arrayElemAt: ['$matches.captures', 0] }],
            },
          },
        },
      },
      { $group: { _id: '$tag', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    UBlast.findOne({ status: 'released' }).sort({ releasedAt: -1, createdAt: -1 }).lean(),
  ]);

  const growthByDate = new Map(
    userGrowthRaw.map((entry) => [entry._id, entry.count]),
  );
  const growthData = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const name = day.toLocaleDateString('en-US', { weekday: 'short' });
    growthData.push({ name, users: growthByDate.get(key) || 0 });
  }

  const platformCounts = new Map(
    platformSharesRaw.map((entry) => [String(entry._id), entry.count]),
  );
  const platformData = platforms.map((platform) => ({
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    shares: platformCounts.get(platform) || 0,
  }));

  const trendingHashtags = topHashtagsRaw.map((entry) => ({
    tag: entry._id,
    count: entry.count,
  }));

  let ublastSharePercent = 0;
  let ublastSharedCount = 0;
  let ublastShareTarget = totalUsers;
  if (latestUblast) {
    const releaseTime = latestUblast.releasedAt || latestUblast.createdAt;
    const endWindow = new Date(new Date(releaseTime).getTime() + 24 * 60 * 60 * 1000);
    const sharedUserIds = await Post.distinct('userId', {
      ublastId: latestUblast._id,
      createdAt: { $gte: releaseTime, $lte: endWindow },
    });
    ublastSharedCount = sharedUserIds.length;
    if (ublastShareTarget > 0) {
      ublastSharePercent = Math.round((ublastSharedCount / ublastShareTarget) * 100);
    }
  }

  return res.status(200).json({
    totalUsers,
    totalUposts,
    totalUblasts,
    totalUblastShares,
    totalActiveUsers,
    growthData,
    platformData,
    trendingHashtags,
    ublastSharePercent,
    ublastSharedCount,
    ublastShareTarget,
  });
}

module.exports = {
  getAdminStats,
};

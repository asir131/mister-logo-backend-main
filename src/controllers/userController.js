const mongoose = require('mongoose');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

function parsePaging(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  if (max) return Math.min(parsed, max);
  return parsed;
}

async function getUserOverview(req, res) {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const profile = await Profile.findOne({ userId }).lean();

  let followersCount = profile?.followersCount;
  let followingCount = profile?.followingCount;
  let postsCount = profile?.postsCount;
  let counts = {
    image: profile?.imageCount ?? 0,
    video: profile?.videoCount ?? 0,
    audio: profile?.audioCount ?? 0,
  };

  if (
    followersCount === undefined ||
    followingCount === undefined ||
    postsCount === undefined
  ) {
    const [followers, following, posts, mediaCounts] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
      Post.countDocuments({ userId }),
      Post.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$mediaType', count: { $sum: 1 } } },
      ]),
    ]);

    followersCount = followers;
    followingCount = following;
    postsCount = posts;
    counts = { image: 0, video: 0, audio: 0 };
    mediaCounts.forEach((entry) => {
      if (entry._id && counts[entry._id] !== undefined) {
        counts[entry._id] = entry.count;
      }
    });
  }

  const viewerIsFollowing =
    req.user.id !== userId &&
    (await Follow.exists({
      followerId: req.user.id,
      followingId: userId,
    }));

  return res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
    },
    profile,
    stats: {
      postsCount,
      followersCount,
      followingCount,
    },
    mediaCounts: counts,
    viewerIsFollowing: Boolean(viewerIsFollowing),
  });
}

async function getUserPosts(req, res) {
  const { userId } = req.params;
  const { mediaType } = req.query;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  if (!['image', 'video', 'audio'].includes(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be image, video, or audio.' });
  }

  const page = parsePaging(req.query.page, 1);
  const limit = parsePaging(req.query.limit, 6, 24);
  const skip = (page - 1) * limit;

  const match = {
    userId: new mongoose.Types.ObjectId(userId),
    mediaType,
  };

  const [totalCount, posts] = await Promise.all([
    Post.countDocuments(match),
    Post.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
            { $count: 'count' },
          ],
          as: 'likeCounts',
        },
      },
      {
        $lookup: {
          from: 'comments',
          let: { postId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$postId'] } } },
            { $count: 'count' },
          ],
          as: 'commentCounts',
        },
      },
      {
        $addFields: {
          likeCount: {
            $ifNull: [{ $arrayElemAt: ['$likeCounts.count', 0] }, 0],
          },
          commentCount: {
            $ifNull: [{ $arrayElemAt: ['$commentCounts.count', 0] }, 0],
          },
        },
      },
      {
        $project: {
          description: 1,
          mediaType: 1,
          mediaUrl: 1,
          createdAt: 1,
          likeCount: 1,
          commentCount: 1,
        },
      },
    ]),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return res.status(200).json({
    posts,
    page,
    totalPages,
    totalCount,
    mediaType,
  });
}

module.exports = {
  getUserOverview,
  getUserPosts,
};

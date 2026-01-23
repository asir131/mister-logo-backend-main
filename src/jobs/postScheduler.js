const Post = require('../models/Post');
const Profile = require('../models/Profile');
const { enqueuePostShare } = require('../services/shareQueue');

function buildShareStatus(post) {
  return {
    facebook: { status: post.shareToFacebook ? 'queued' : 'none' },
    instagram: { status: post.shareToInstagram ? 'queued' : 'none' },
  };
}

async function publishScheduledPosts() {
  const now = new Date();
  const scheduled = await Post.find({
    status: 'scheduled',
    scheduledFor: { $lte: now },
  }).lean();

  if (scheduled.length === 0) return;

  for (const post of scheduled) {
    const updated = await Post.findOneAndUpdate(
      { _id: post._id, status: 'scheduled' },
      {
        $set: {
          status: 'published',
          publishedAt: now,
          createdAt: now,
          shareStatus: buildShareStatus(post),
        },
      },
      { new: true },
    );

    if (!updated) continue;

    await Profile.updateOne(
      { userId: post.userId },
      {
        $inc: {
          postsCount: 1,
          [`${post.mediaType}Count`]: 1,
        },
        $push: {
          [`${post.mediaType}Posts`]: {
            postId: updated._id,
            mediaUrl: updated.mediaUrl,
            description: updated.description,
            createdAt: updated.createdAt,
          },
        },
      },
    );

    enqueuePostShare(updated);
  }
}

function startPostScheduler() {
  const intervalMs = 60 * 1000;
  setInterval(() => {
    publishScheduledPosts().catch((err) =>
      console.error('Scheduled post publish job failed:', err),
    );
  }, intervalMs);

  console.log('Scheduled post job started.');
}

module.exports = { startPostScheduler };

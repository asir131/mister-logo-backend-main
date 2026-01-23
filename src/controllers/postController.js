const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const Post = require('../models/Post');
const Profile = require('../models/Profile');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const SavedPost = require('../models/SavedPost');
const { uploadMediaBuffer } = require('../services/cloudinary');
const { enqueuePostShare } = require('../services/shareQueue');
const UBlast = require('../models/UBlast');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
}

function detectMediaType(mimetype) {
  if (!mimetype) return null;
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return null;
}

function parseScheduledFor(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function scheduleShareStatus(shareToFacebook, shareToInstagram) {
  return {
    facebook: { status: shareToFacebook ? 'queued' : 'none' },
    instagram: { status: shareToInstagram ? 'queued' : 'none' },
  };
}

async function enforceUblastShareRequirement(userId) {
  const now = new Date();
  const activeUblasts = await UBlast.find({
    status: 'released',
    expiresAt: { $gt: now },
  })
    .select('_id')
    .lean();

  if (activeUblasts.length === 0) return null;

  const shared = await Post.find({
    userId,
    ublastId: { $in: activeUblasts.map((ublast) => ublast._id) },
  })
    .select('ublastId')
    .lean();

  if (shared.length < activeUblasts.length) {
    return 'You must share active UBlasts before creating new posts.';
  }
  return null;
}

async function createPost(req, res) {
  const validationError = handleValidation(req, res);
  if (validationError !== null) return;

  const { id: userId } = req.user;
  const { description } = req.body;
  const scheduledForRaw = req.body.scheduledFor;
  const scheduledForInput = parseScheduledFor(scheduledForRaw);
  const now = new Date();

  if (scheduledForRaw && !scheduledForInput) {
    return res.status(400).json({ error: 'scheduledFor must be a valid date.' });
  }

  if (scheduledForInput && scheduledForInput.getTime() <= now.getTime()) {
    return res.status(400).json({ error: 'scheduledFor must be in the future.' });
  }

  if (!scheduledForInput) {
    const ublastError = await enforceUblastShareRequirement(userId);
    if (ublastError) {
      return res.status(403).json({ error: ublastError });
    }
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Media file is required.' });
  }

  const mediaType = detectMediaType(req.file.mimetype);
  if (!mediaType) {
    return res.status(400).json({ error: 'Unsupported media type.' });
  }

  const shareToFacebook = Boolean(req.body.shareToFacebook);
  const shareToInstagram = Boolean(req.body.shareToInstagram);

  try {
    const uploadResult = await uploadMediaBuffer(req.file.buffer, {
      folder: 'mister/posts',
    });

    const isScheduled = Boolean(scheduledForInput);
    const shareStatus = isScheduled
      ? {
          facebook: { status: 'none' },
          instagram: { status: 'none' },
        }
      : scheduleShareStatus(shareToFacebook, shareToInstagram);

    const created = await Post.create({
      userId,
      description,
      mediaType,
      mediaUrl: uploadResult.secure_url || uploadResult.url,
      mediaPublicId: uploadResult.public_id,
      mimeType: req.file.mimetype,
      size: req.file.size,
      shareToFacebook,
      shareToInstagram,
      shareStatus,
      status: isScheduled ? 'scheduled' : 'published',
      scheduledFor: isScheduled ? scheduledForInput : undefined,
      publishedAt: isScheduled ? undefined : now,
    });

    if (!isScheduled) {
      const profileUpdate = {
        $inc: {
          postsCount: 1,
          [`${mediaType}Count`]: 1,
        },
        $push: {
          [`${mediaType}Posts`]: {
            postId: created._id,
            mediaUrl: created.mediaUrl,
            description: created.description,
            createdAt: created.createdAt,
          },
        },
      };
      await Profile.updateOne({ userId }, profileUpdate);

      enqueuePostShare(created);
    }

    return res.status(201).json({
      message: isScheduled
        ? 'Post scheduled successfully.'
        : 'Post created successfully.',
      post: created,
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ error: 'Could not create post.' });
  }
}

async function deletePost(req, res) {
  const { id: userId } = req.user;
  const { postId } = req.params;

  const post = await Post.findOneAndDelete({ _id: postId, userId });
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  if (post.status === 'published' || !post.status) {
    await Promise.all([
      Like.deleteMany({ postId: post._id }),
      Comment.deleteMany({ postId: post._id }),
      SavedPost.deleteMany({ postId: post._id }),
    ]);

    await Profile.updateOne(
      { userId },
      {
        $inc: {
          postsCount: -1,
          [`${post.mediaType}Count`]: -1,
        },
        $pull: {
          [`${post.mediaType}Posts`]: { postId: post._id },
        },
      },
    );
  }

  return res.status(200).json({ message: 'Post deleted.' });
}

async function sharePost(req, res) {
  const { id: userId } = req.user;
  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ error: 'Invalid post id.' });
  }

  const ublastError = await enforceUblastShareRequirement(userId);
  if (ublastError) {
    return res.status(403).json({ error: ublastError });
  }

  const source = await Post.findById(postId).lean();
  if (!source) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  if (
    (source.status && source.status !== 'published') ||
    source.status === 'removed' ||
    source.isApproved === false
  ) {
    return res.status(400).json({ error: 'Post is not available for sharing.' });
  }

  if (!source.mediaUrl || !source.mediaType) {
    return res.status(400).json({ error: 'Post media is missing.' });
  }

  const profile = await Profile.findOne({ userId }).lean();
  if (!profile) {
    return res.status(400).json({ error: 'Profile required before sharing.' });
  }

  const created = await Post.create({
    userId,
    description: source.description,
    mediaType: source.mediaType,
    mediaUrl: source.mediaUrl,
    shareToFacebook: false,
    shareToInstagram: false,
    shareStatus: {
      facebook: { status: 'none' },
      instagram: { status: 'none' },
    },
    ublastId: source.ublastId,
    sharedFromPostId: source._id,
    status: 'published',
    publishedAt: new Date(),
  });

  await Profile.updateOne(
    { userId },
    {
      $inc: {
        postsCount: 1,
        [`${source.mediaType}Count`]: 1,
      },
      $push: {
        [`${source.mediaType}Posts`]: {
          postId: created._id,
          mediaUrl: created.mediaUrl,
          description: created.description,
          createdAt: created.createdAt,
        },
      },
    },
  );

  return res.status(201).json({ post: created });
}

function parsePaging(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  if (max) return Math.min(parsed, max);
  return parsed;
}

async function listScheduledPosts(req, res) {
  const userId = req.user.id;
  const page = parsePaging(req.query.page, 1);
  const limit = parsePaging(req.query.limit, 10, 50);
  const skip = (page - 1) * limit;

  const match = {
    userId,
    scheduledFor: { $exists: true },
  };

  const [totalCount, posts] = await Promise.all([
    Post.countDocuments(match),
    Post.find(match)
      .sort({ scheduledFor: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return res.status(200).json({
    posts,
    page,
    totalPages,
    totalCount,
  });
}

async function updateScheduledPost(req, res) {
  const validationError = handleValidation(req, res);
  if (validationError !== null) return;

  const userId = req.user.id;
  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ error: 'Invalid post id.' });
  }

  const scheduledForInput = parseScheduledFor(req.body.scheduledFor);
  if (!scheduledForInput) {
    return res.status(400).json({ error: 'scheduledFor must be provided.' });
  }
  if (scheduledForInput.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'scheduledFor must be in the future.' });
  }

  const updates = {
    scheduledFor: scheduledForInput,
  };

  if (req.body.description !== undefined) {
    updates.description = req.body.description;
  }
  if (req.body.shareToFacebook !== undefined) {
    updates.shareToFacebook = Boolean(req.body.shareToFacebook);
  }
  if (req.body.shareToInstagram !== undefined) {
    updates.shareToInstagram = Boolean(req.body.shareToInstagram);
  }

  if (req.file) {
    const mediaType = detectMediaType(req.file.mimetype);
    if (!mediaType) {
      return res.status(400).json({ error: 'Unsupported media type.' });
    }
    const uploadResult = await uploadMediaBuffer(req.file.buffer, {
      folder: 'mister/posts',
    });
    updates.mediaType = mediaType;
    updates.mediaUrl = uploadResult.secure_url || uploadResult.url;
    updates.mediaPublicId = uploadResult.public_id;
    updates.mimeType = req.file.mimetype;
    updates.size = req.file.size;
  }

  const updated = await Post.findOneAndUpdate(
    { _id: postId, userId, status: 'scheduled' },
    { $set: updates },
    { new: true },
  );

  if (!updated) {
    return res.status(404).json({ error: 'Scheduled post not found.' });
  }

  return res.status(200).json({ post: updated });
}

async function cancelScheduledPost(req, res) {
  const userId = req.user.id;
  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ error: 'Invalid post id.' });
  }

  const updated = await Post.findOneAndUpdate(
    { _id: postId, userId, status: 'scheduled' },
    { $set: { status: 'cancelled' } },
    { new: true },
  );

  if (!updated) {
    return res.status(404).json({ error: 'Scheduled post not found.' });
  }

  return res.status(200).json({ post: updated });
}

module.exports = {
  createPost,
  deletePost,
  sharePost,
  listScheduledPosts,
  updateScheduledPost,
  cancelScheduledPost,
};

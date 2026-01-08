const mongoose = require('mongoose');

const Like = require('../models/Like');
const Post = require('../models/Post');

async function likePost(req, res) {
  const userId = req.user.id;
  const { postId } = req.body;

  if (!mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ error: 'Invalid post id.' });
  }

  const postExists = await Post.exists({ _id: postId });
  if (!postExists) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  await Like.findOneAndUpdate(
    { userId, postId },
    { $setOnInsert: { userId, postId } },
    { upsert: true, new: true },
  );

  return res.status(200).json({ liked: true });
}

async function unlikePost(req, res) {
  const userId = req.user.id;
  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ error: 'Invalid post id.' });
  }

  await Like.deleteOne({ userId, postId });

  return res.status(200).json({ liked: false });
}

module.exports = {
  likePost,
  unlikePost,
};

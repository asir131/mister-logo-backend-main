const mongoose = require('mongoose');

const Follow = require('../models/Follow');
const User = require('../models/User');
const Profile = require('../models/Profile');

async function followUser(req, res) {
  const followerId = req.user.id;
  const { userId } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  if (followerId === userId) {
    return res.status(400).json({ error: 'You cannot follow yourself.' });
  }

  const targetExists = await User.exists({ _id: userId });
  if (!targetExists) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const existing = await Follow.findOne({ followerId, followingId: userId });
  if (existing) {
    return res.status(200).json({ following: true });
  }

  await Follow.create({ followerId, followingId: userId });

  await Promise.all([
    Profile.updateOne(
      { userId },
      {
        $addToSet: { followers: { userId: followerId, followedAt: new Date() } },
        $inc: { followersCount: 1 },
      },
    ),
    Profile.updateOne(
      { userId: followerId },
      {
        $addToSet: { following: { userId, followedAt: new Date() } },
        $inc: { followingCount: 1 },
      },
    ),
  ]);

  return res.status(200).json({ following: true });
}

async function unfollowUser(req, res) {
  const followerId = req.user.id;
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  const result = await Follow.deleteOne({ followerId, followingId: userId });

  if (result.deletedCount > 0) {
    await Promise.all([
      Profile.updateOne(
        { userId },
        {
          $pull: { followers: { userId: followerId } },
          $inc: { followersCount: -1 },
        },
      ),
      Profile.updateOne(
        { userId: followerId },
        {
          $pull: { following: { userId } },
          $inc: { followingCount: -1 },
        },
      ),
    ]);
  }

  return res.status(200).json({ following: false });
}

module.exports = {
  followUser,
  unfollowUser,
};

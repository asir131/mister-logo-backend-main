const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String },
    role: { type: String, required: true },
    bio: { type: String },
    profileImageUrl: { type: String },
    instagramUrl: { type: String },
    tiktokUrl: { type: String },
    youtubeUrl: { type: String },
    facebookUrl: { type: String },
    spotifyArtistUrl: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Profile', profileSchema);

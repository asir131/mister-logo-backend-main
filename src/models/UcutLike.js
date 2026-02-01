const mongoose = require('mongoose');

const ucutLikeSchema = new mongoose.Schema(
  {
    ucutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ucut', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

ucutLikeSchema.index({ ucutId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('UcutLike', ucutLikeSchema);

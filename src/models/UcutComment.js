const mongoose = require('mongoose');

const ucutCommentSchema = new mongoose.Schema(
  {
    ucutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ucut', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
);

ucutCommentSchema.index({ ucutId: 1, createdAt: -1 });

module.exports = mongoose.model('UcutComment', ucutCommentSchema);

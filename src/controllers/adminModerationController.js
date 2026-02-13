const ModerationAction = require('../models/ModerationAction');

function parsePaging(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  if (max && parsed > max) return max;
  return parsed;
}

async function listModerationActions(req, res) {
  const page = parsePaging(req.query.page, 1);
  const limit = parsePaging(req.query.limit, 20, 100);
  const skip = (page - 1) * limit;

  const [totalCount, actions] = await Promise.all([
    ModerationAction.countDocuments({}),
    ModerationAction.find({})
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const mapped = actions.map((action) => ({
    id: action._id,
    type: action.type,
    targetType: action.targetType,
    targetId: action.targetId,
    targetEmail: action.targetEmail || '',
    performedBy: action.performedBy || '',
    performedAt: action.performedAt,
  }));

  return res.status(200).json({
    actions: mapped,
    page,
    totalPages,
    totalCount,
  });
}

module.exports = {
  listModerationActions,
};

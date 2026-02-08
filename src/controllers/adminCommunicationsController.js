const { validationResult } = require('express-validator');

const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { sendSms } = require('../services/smsService');

function parsePaging(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return fallback;
  if (max && parsed > max) return max;
  return parsed;
}

function buildMatch(filter) {
  if (filter === 'active') {
    return {
      $and: [
        { ublastManualBlocked: { $ne: true } },
        {
          $or: [
            { ublastBlockedUntil: { $exists: false } },
            { ublastBlockedUntil: null },
            { ublastBlockedUntil: { $lte: new Date() } },
          ],
        },
      ],
    };
  }
  if (filter === 'restricted') {
    return {
      $or: [{ ublastManualBlocked: true }, { ublastBlockedUntil: { $gt: new Date() } }],
    };
  }
  return {};
}

async function sendBulkEmail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const subject = String(req.body?.subject || '').trim();
  const content = String(req.body?.content || '').trim();
  const filter = String(req.body?.filter || 'all').toLowerCase();
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];

  if (!subject || !content) {
    return res.status(400).json({ error: 'Subject and content are required.' });
  }

  let match = buildMatch(filter);
  if (filter === 'selected') {
    if (!userIds.length) {
      return res.status(400).json({ error: 'Select at least one user.' });
    }
    match = { _id: { $in: userIds } };
  }

  const recipients = await User.find({
    ...match,
    email: { $exists: true, $ne: '' },
  })
    .select('email')
    .lean();

  if (!recipients.length) {
    return res.status(200).json({ sent: 0, failed: 0, total: 0 });
  }

  const emails = recipients.map((entry) => entry.email).filter(Boolean);
  const chunkSize = parsePaging(process.env.EMAIL_BATCH_SIZE, 20, 100);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map((to) =>
        sendEmail({
          to,
          subject,
          text: content,
        }),
      ),
    );
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        sent += 1;
      } else {
        failed += 1;
      }
    });
  }

  return res.status(200).json({
    total: emails.length,
    sent,
    failed,
  });
}

async function sendBulkSms(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const content = String(req.body?.content || '').trim();
  const filter = String(req.body?.filter || 'all').toLowerCase();
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];

  if (!content) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  let match = buildMatch(filter);
  if (filter === 'selected') {
    if (!userIds.length) {
      return res.status(400).json({ error: 'Select at least one user.' });
    }
    match = { _id: { $in: userIds } };
  }

  const recipients = await User.find({
    ...match,
    phoneNumber: { $exists: true, $ne: '' },
  })
    .select('phoneNumber')
    .lean();

  if (!recipients.length) {
    return res.status(200).json({ sent: 0, failed: 0, total: 0 });
  }

  const numbers = recipients
    .map((entry) => entry.phoneNumber)
    .filter(Boolean);
  const chunkSize = parsePaging(process.env.SMS_BATCH_SIZE, 10, 50);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < numbers.length; i += chunkSize) {
    const chunk = numbers.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map((to) =>
        sendSms({
          to,
          body: content,
        }),
      ),
    );
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        sent += 1;
      } else {
        failed += 1;
      }
    });
  }

  return res.status(200).json({
    total: numbers.length,
    sent,
    failed,
  });
}

module.exports = {
  sendBulkEmail,
  sendBulkSms,
};

const { validationResult } = require('express-validator');

const Ucut = require('../models/Ucut');
const { uploadMediaBuffer } = require('../services/cloudinary');
const { splitMedia, DEFAULT_SEGMENT_SECONDS } = require('../services/mediaSplit');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
}

function detectMediaType(mimetype) {
  if (!mimetype) return null;
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('image/')) return 'image';
  return null;
}

function buildExpiryDate() {
  const hours = Number(process.env.UCUT_EXPIRES_HOURS || 24);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function createUcut(req, res) {
  const validationError = handleValidation(req, res);
  if (validationError !== null) return;

  const { id: userId } = req.user;
  const text = req.body?.text ? String(req.body.text).trim() : '';
  const hasText = Boolean(text);
  const hasFile = Boolean(req.file);

  if (!hasText && !hasFile) {
    return res.status(400).json({ error: 'Text or media file is required.' });
  }

  if (hasFile) {
    const mediaType = detectMediaType(req.file.mimetype);
    if (!mediaType) {
      return res.status(400).json({ error: 'Only image, audio, or video files are allowed.' });
    }

    if (mediaType === 'image') {
      try {
        const uploadResult = await uploadMediaBuffer(req.file.buffer, {
          folder: 'unap/ucuts',
          resource_type: 'image',
        });

        const created = await Ucut.create({
          userId,
          type: 'image',
          mediaType: 'image',
          text: hasText ? text : undefined,
          segments: [{ url: uploadResult.secure_url || uploadResult.url, order: 1 }],
          segmentCount: 1,
          expiresAt: buildExpiryDate(),
        });

        return res.status(201).json({ ucut: created, wasSplit: false });
      } catch (err) {
        return res.status(500).json({ error: 'Could not upload image.' });
      }
    }

    const segmentSeconds = Number(
      process.env.UCUT_SEGMENT_SECONDS || DEFAULT_SEGMENT_SECONDS,
    );

    let splitResult;
    try {
      splitResult = await splitMedia({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        segmentSeconds,
      });
    } catch (err) {
      return res.status(500).json({
        error: err.message || 'Unable to process media. Ensure ffmpeg/ffprobe are available.',
      });
    }

    const segmentUploads = [];
    const uploadResourceType = mediaType === 'audio' || mediaType === 'video' ? 'video' : 'auto';
    for (let i = 0; i < splitResult.segments.length; i += 1) {
      const segmentBuffer = splitResult.segments[i];
      const uploadResult = await uploadMediaBuffer(segmentBuffer, {
        folder: 'unap/ucuts',
        resource_type: uploadResourceType,
      });
      segmentUploads.push({
        url: uploadResult.secure_url || uploadResult.url,
        order: i + 1,
      });
    }

    const created = await Ucut.create({
      userId,
      type: mediaType,
      mediaType,
      text: hasText ? text : undefined,
      segments: segmentUploads,
      segmentCount: segmentUploads.length,
      originalDurationSeconds: splitResult.durationSeconds,
      segmentDurationSeconds: segmentSeconds,
      expiresAt: buildExpiryDate(),
    });

    return res.status(201).json({
      ucut: created,
      wasSplit: splitResult.wasSplit,
    });
  }

  const created = await Ucut.create({
    userId,
    type: 'text',
    text,
    segments: [],
    segmentCount: 0,
    expiresAt: buildExpiryDate(),
  });

  return res.status(201).json({ ucut: created });
}

async function listMyUcuts(req, res) {
  const userId = req.user.id;
  const ucuts = await Ucut.find({
    userId,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return res.status(200).json({ ucuts });
}

module.exports = {
  createUcut,
  listMyUcuts,
};

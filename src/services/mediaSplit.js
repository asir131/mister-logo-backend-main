const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

const DEFAULT_SEGMENT_SECONDS = 45;

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        const err = new Error(stderr || error.message);
        err.code = error.code;
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      return resolve({ stdout, stderr });
    });
  });
}

function getBinaryPath(envKey, fallback) {
  return process.env[envKey] || fallback;
}

function extFromMime(mimetype) {
  if (!mimetype) return '';
  if (mimetype === 'video/mp4') return '.mp4';
  if (mimetype === 'video/quicktime') return '.mov';
  if (mimetype === 'video/webm') return '.webm';
  if (mimetype === 'audio/mpeg') return '.mp3';
  if (mimetype === 'audio/wav') return '.wav';
  if (mimetype === 'audio/x-wav') return '.wav';
  if (mimetype === 'audio/aac') return '.aac';
  if (mimetype === 'audio/mp4') return '.m4a';
  if (mimetype === 'audio/x-m4a') return '.m4a';
  return '';
}

async function probeDurationSeconds(filePath) {
  const ffprobe = getBinaryPath('FFPROBE_PATH', 'ffprobe');
  const { stdout } = await runCommand(ffprobe, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]);
  const value = Number.parseFloat(String(stdout).trim());
  if (!Number.isFinite(value)) {
    throw new Error('Unable to read media duration.');
  }
  return value;
}

async function splitMedia({
  buffer,
  mimetype,
  segmentSeconds = DEFAULT_SEGMENT_SECONDS,
}) {
  const extension = extFromMime(mimetype) || '.bin';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ucuts-'));
  const inputPath = path.join(tempDir, `input${extension}`);
  await fs.writeFile(inputPath, buffer);

  let durationSeconds;
  try {
    durationSeconds = await probeDurationSeconds(inputPath);
  } catch (err) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw err;
  }

  if (durationSeconds <= segmentSeconds) {
    const singleBuffer = await fs.readFile(inputPath);
    await fs.rm(tempDir, { recursive: true, force: true });
    return {
      durationSeconds,
      segments: [singleBuffer],
      wasSplit: false,
    };
  }

  const ffmpeg = getBinaryPath('FFMPEG_PATH', 'ffmpeg');
  const outputPattern = path.join(tempDir, `segment-%03d${extension}`);
  const baseArgs = [
    '-i',
    inputPath,
    '-f',
    'segment',
    '-segment_time',
    String(segmentSeconds),
    '-reset_timestamps',
    '1',
  ];

  try {
    await runCommand(ffmpeg, [...baseArgs, '-c', 'copy', outputPattern]);
  } catch (copyError) {
    const fallbackArgs = [
      ...baseArgs,
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      outputPattern,
    ];
    await runCommand(ffmpeg, fallbackArgs);
  }

  const entries = await fs.readdir(tempDir);
  const segmentFiles = entries
    .filter((name) => name.startsWith('segment-'))
    .sort();

  if (segmentFiles.length === 0) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw new Error('Failed to split media into segments.');
  }

  const segments = [];
  for (const name of segmentFiles) {
    const filePath = path.join(tempDir, name);
    segments.push(await fs.readFile(filePath));
  }

  await fs.rm(tempDir, { recursive: true, force: true });

  return {
    durationSeconds,
    segments,
    wasSplit: true,
  };
}

module.exports = {
  splitMedia,
  DEFAULT_SEGMENT_SECONDS,
};

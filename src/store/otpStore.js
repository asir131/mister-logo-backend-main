const otpStore = new Map();

const TEN_MINUTES_MS = 10 * 60 * 1000;

function save(email, otp, userPayload, ttlMs = TEN_MINUTES_MS) {
  const expiresAt = Date.now() + ttlMs;
  otpStore.set(email, { otp, expiresAt, userPayload });
}

function consume(email, otp) {
  const entry = otpStore.get(email);
  if (!entry) {
    return { valid: false, reason: 'OTP not found. Please register again.' };
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    otpStore.delete(email);
    return { valid: false, reason: 'OTP expired. Please register again.' };
  }

  if (entry.otp !== otp) {
    return { valid: false, reason: 'Invalid OTP.' };
  }

  otpStore.delete(email);
  return { valid: true, userPayload: entry.userPayload };
}

module.exports = {
  save,
  consume,
};

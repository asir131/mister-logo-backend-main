const crypto = require('crypto');

function generateOtp() {
  const num = crypto.randomInt(0, 100_000);
  return num.toString().padStart(5, '0');
}

module.exports = generateOtp;

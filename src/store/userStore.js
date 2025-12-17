const { randomUUID } = require('crypto');

const usersByEmail = new Map();
const emailByPhone = new Map();

function add(user) {
  const id = randomUUID();
  const record = { id, ...user, createdAt: new Date().toISOString() };
  usersByEmail.set(record.email, record);
  emailByPhone.set(record.phoneNumber, record.email);
  return record;
}

function findByEmail(email) {
  return usersByEmail.get(email);
}

function findByPhone(phoneNumber) {
  const email = emailByPhone.get(phoneNumber);
  if (!email) return undefined;
  return usersByEmail.get(email);
}

function exists({ email, phoneNumber }) {
  const hasEmail = usersByEmail.has(email);
  const hasPhone = emailByPhone.has(phoneNumber);
  return { hasEmail, hasPhone };
}

module.exports = {
  add,
  findByEmail,
  findByPhone,
  exists,
};

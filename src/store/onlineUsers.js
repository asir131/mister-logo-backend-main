const onlineUsers = new Set();

function addOnlineUser(userId) {
  if (!userId) return;
  onlineUsers.add(String(userId));
}

function removeOnlineUser(userId) {
  if (!userId) return;
  onlineUsers.delete(String(userId));
}

function isUserOnline(userId) {
  if (!userId) return false;
  return onlineUsers.has(String(userId));
}

function getOnlineUserIds() {
  return new Set(onlineUsers);
}

module.exports = {
  addOnlineUser,
  removeOnlineUser,
  isUserOnline,
  getOnlineUserIds,
};

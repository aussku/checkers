const usersByUsername = new Map();
const usersByEmail = new Map();

function getByUsername(username) {
  if (!username) return null;
  return usersByUsername.get(username.toLowerCase());
}

function getByEmail(email) {
  if (!email) return null;
  return usersByEmail.get(email.toLowerCase());
}

function add(user) {
  usersByUsername.set(user.username.toLowerCase(), user);
  usersByEmail.set(user.email.toLowerCase(), user);
}

function clear() {
  usersByUsername.clear();
  usersByEmail.clear();
}

module.exports = {
  getByUsername,
  getByEmail,
  add,
  clear,
};

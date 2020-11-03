const tokenStore = {};

function setToken(user, key) {
  tokenStore[user] = key;
}

function getToken(user) {
  return tokenStore[user];
}

function getAllTokens() {
  return Object.values(tokenStore);
}

module.exports = {
  setToken,
  getToken,
  getAllTokens
};

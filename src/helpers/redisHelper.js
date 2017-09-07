

const redis = require('redis');

function getClient() {
  return (process.env.REDIS_URL) ?
    redis.createClient(process.env.REDIS_URL) : redis.createClient();
}

function getNonceByShop(shop, callback) {
  const client = getClient();
  client.get(shop, (error, result) => {
    client.quit();
    if (error) {
      callback(error, []);
    } else {
      callback(null, result);
    }
  });
}

function setNonceByShop(shop, nonce, callback) {
  const client = getClient();
  client.on('error', (err) => callback(err));
  // Key expires after 1 day
  client.set(shop, nonce, 'EX', 86400, () => {
    client.quit();
    callback(null);
  });
}

function deleteNonceByShop(shop, callback) {
  const client = getClient();
  client.on('error', (err) => callback(err));
  client.del(shop, () => {
    client.quit();
    callback(null);
  });
}

module.exports = {
  getNonceByShop,
  deleteNonceByShop,
  setNonceByShop,
};

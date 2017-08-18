const winston = require('winston');
const db = require('./db').getDBInstance();

/**
 * Save shop. If shop url already exists in the database, the access token is updated.
 * @param  {string} shopUrl
 * @param  {string} accessToken
 * @return {promise}
 */
const saveShop = (shopUrl, accessToken) => {
  return new Promise((resolve, reject) => {
    db.none('INSERT INTO shop(shop_url, access_token) VALUES($1, $2)'
                  + 'ON CONFLICT (shop_url) DO UPDATE SET access_token = $2',
      [shopUrl, accessToken])
    .then(() => {
      resolve();
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to save shop' });
    });
  });
};

/**
 * Retrives shop. Returns null if shop does not exist.
 * @param  {string} shopUrl
 * @return {promise}
 */
const getShop = (shopUrl) => {
  return new Promise((resolve, reject) => {
    db.oneOrNone('SELECT * FROM shop WHERE shop_url = $1', shopUrl)
    .then((result) => {
      resolve(result);
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to retrieve shop' });
    });
  });
};

/**
 * Deletes shop.
 * @param  {string} shopUrl
 * @return {promise}
 */
const deleteShop = (shopUrl) => {
  return new Promise((resolve, reject) => {
    db.none('DELETE FROM shop WHERE shop_url = $1', shopUrl)
    .then(() => {
      resolve();
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to delete shop' });
    });
  });
};

module.exports = {
  saveShop, getShop, deleteShop
};

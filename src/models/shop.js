
const db = require('./db').getDBInstance();

const saveShop = (shop, accessToken) => {
  return db.none('INSERT INTO shop(shop_url, access_token) VALUES($1, $2)'
                + 'ON CONFLICT (shop_url) DO UPDATE SET access_token = $2',
    [shop, accessToken]);
};

const getShop = (shop) => {
  return db.oneOrNone('SELECT * FROM shop WHERE shop_url = $1', shop);
};

const deleteShop = (shop) => {
  return db.none('DELETE FROM shop WHERE shop_url = $1', shop);
};

module.exports = {
  saveShop, getShop, deleteShop
};

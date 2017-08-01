
const db = require('./db').getDBInstance();

const saveShop = (shop, accessToken) => {
  return db.query('INSERT INTO shops(shop_url, access_token) VALUES($1, $2)'
                + 'ON CONFLICT (shop_url) DO UPDATE SET access_token = $2',
    [shop, accessToken]);
};

const getShop = (shop) => {
  return db.query('SELECT * FROM shops WHERE shop_url LIKE $1', shop);
};

const deleteShop = (shop) => {
  return db.query('DELETE FROM shops WHERE shop_url LIKE $1', shop);
};

module.exports = {
  saveShop, getShop, deleteShop
};

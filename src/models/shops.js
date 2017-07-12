
const path = require('path');
const pgp = require('pg-promise')();
const db = pgp(process.env.DATABASE_URL);
const uuid = require('node-uuid');

const saveShop = (shop, access_token) => {
  return db.query('INSERT INTO shops(id, shop_url, access_token) VALUES($1, $2, $3)',
    [uuid.v4(), shop, access_token]);
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
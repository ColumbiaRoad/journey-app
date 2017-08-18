
const Shopify = require('shopify-api-node');
const shopModel = require('../models/shop');
const winston = require('winston'); // LOGGING

let shopify = undefined;

const getShopifyInstance = (shop) => {
  return new Promise((resolve, reject) => {
    if(shopify === undefined) {
    shopModel.getShop(shop)
      .then((shop) => {
        if(shop !== undefined) {
          winston.info(`shop: ${shop.shop_url}`);
          shopify = new Shopify({
            shopName: shop.shop_url.split('.')[0],
            accessToken: shop.access_token,
            autoLimit: true
          });
          resolve(shopify);
        } else {
          reject({
            message: 'Unkown shop'
          });
        }
      })
      .catch((err) => {
        reject(err);
      });
    } else {
      resolve(shopify);
    }
  });
}

module.exports = {
  getShopifyInstance
}

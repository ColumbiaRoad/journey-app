
const Shopify = require('shopify-api-node');
const shopModel = require('../models/shop');
const winston = require('winston'); // LOGGING

let shopify = undefined;

const getShopifyInstance = (shop) => {
  return new Promise((resolve, reject) => {
    if(shopify === undefined) {
    shopModel.getShop(shop)
      .then((result) => {
        winston.info(`Shops matching: ${result.length}`);
        // Currently shops aren't deleted so there can be multiple tokens.
        // If so, take latest
        const shop = result.length > 0 ? result.pop() : undefined;
        winston.info(`shop: ${shop.shop_url}`);
        if(shop !== undefined) {
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

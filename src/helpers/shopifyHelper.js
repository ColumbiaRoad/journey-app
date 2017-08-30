const ShopifyToken = require('shopify-token');
const Shopify = require('shopify-api-node');
const shopModel = require('../models/shop');
const winston = require('winston'); // LOGGING

const getShopifyInstance = (shop, accessToken=undefined) => {
  return new Promise((resolve, reject) => {
    if(accessToken) {
      // Access token known, no need to access database
      resolve(new Shopify({
        shopName: shop.split('.')[0],
        accessToken: accessToken,
        autoLimit: true
      }));
    } else {
      shopModel.getShop(shop)
      .then((shop) => {
        if(shop !== null) {
          resolve(new Shopify({
            shopName: shop.shop_url.split('.')[0],
            accessToken: shop.access_token,
            autoLimit: true
          }));
        } else {
          reject({
            error: 'Unkown shop'
          });
        }
      })
      .catch((err) => {
        winston.error(err);
        reject(err);
      });
    }
  });
};

const getShopifyToken = () => {
  return new ShopifyToken({
    sharedSecret: process.env.SHOPIFY_APP_SECRET,
    redirectUri: `${process.env.BASE_URL}/auth/install`,
    apiKey: process.env.SHOPIFY_API_KEY
  });
};

module.exports = {
  getShopifyInstance, getShopifyToken
}

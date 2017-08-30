const ShopifyToken = require('shopify-token');
const Shopify = require('shopify-api-node');
const shopModel = require('../models/shop');
const winston = require('winston'); // LOGGING

const getShopifyInstance = (shop) => {
  return new Promise((resolve, reject) => {
    shopModel.getShop(shop)
    .then((shop) => {
      if(shop === null) {
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
      winston.error(err);
      reject(err);
    });
  });
}

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

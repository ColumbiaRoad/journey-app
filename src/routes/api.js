const Shopify = require('shopify-api-node');
const shopModel = require('../models/shops');
const winston = require('winston'); // LOGGING

const shopName = process.env.SHOP;
const shopDomain = `${shopName}.myshopify.com`;
let shopify = undefined;

function getShopifyInstance() {
  return new Promise((resolve, reject) => {
    if(shopify === undefined) {
    shopModel.getShop(shopDomain)
      .then((result) => {
        winston.info(`Shops matching: ${result.length}`);
        // Currently shops aren't deleted so there can be multiple tokens.
        // If so, take latest
        const token = result.length > 0 ? result.pop().access_token : undefined;
        if(token !== undefined) {
          shopify = new Shopify({
            shopName: shopName,
            accessToken: token,
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

module.exports = (app) => {
  app.get('/api/v1/products', (req, res) => {
    getShopifyInstance()
      .then((shopify) => {
        return shopify.product.list(req.query);
      })
      .then((products) => {
        return res.json(products);
      })
      .catch((err) => {
        if (err && err.hasOwnProperty('response')) {
          return res.json(err.response.body);
        } else {
          const message = err.hasOwnProperty('message') ? err.message : 'unkown error';
          return res.json({
            errors: message
          });
        }
      });
  });

  app.get('/api/v1/products/:id', (req, res) => {
    getShopifyInstance()
      .then((shopify) => {
        return shopify.product.get(req.params.id, req.query);
      })
      .then((product) => {
        return res.json(product);
      })
      .catch((err) => {
        return res.json(err.response.body);
      })
  });
}
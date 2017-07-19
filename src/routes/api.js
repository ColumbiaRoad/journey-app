const Shopify = require('shopify-api-node');
const shopModel = require('../models/shops');
const winston = require('winston'); // LOGGING

const shopName = process.env.SHOP;
const shopDomain = `${shopName}.myshopify.com`;
const shopify = undefined;

function getShopifyInstance() {
  return new Promise((resolve, reject) => {
    if(shopify === undefined) {
    shopModel.getShop(shopDomain)
      .then((shop) => {
        winston.info(`Shop: ${JSON.stringify(shop)}`);
        // Currently shops aren't deleted so there can be multiple tokens.
        // If so, take latest
        const token = Array.isArray(shop) ? shop.pop().access_token : shop.access_token;
        winston.info(`Token: ${token}`)
        shopify = new Shopify({
          shopName: shopName,
          accessToken: token,
          autoLimit: true
        });
        winston.info(`Shopify object: ${shopify}`);
        resolve(shopify);
      })
      .catch((err) => {
        reject(err);
      });
    } else {
      resolve(shopify);
    }
  })
  
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
          return res.json({
            error: err
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
const Shopify = require('shopify-api-node');
const shopModel = require('../models/shops');
const winston = require('winston'); // LOGGING

const shopName = process.env.SHOP;
const shopDomain = `${shopName}.myshopify.com`;
const shopify = undefined;

function getShopifyInstance() {
  if(shopify === undefined) {
    shopModel.getShop(shopDomain)
      .then((token) => {
        shopify = new Shopify({
          shopName: shopName,
          accessToken: token,
          autoLimit: true
        });
        return shopify;
      });
  } else {
    return shopify;
  }
}

module.exports = (app) => {
  app.get('/api/v1/products', (req, res) => {
    getShopifyInstance.product.list(req.query)
      .then((products) => {
        return res.json(products);
      })
      .catch((err) => {
        return res.json(err.response.body);
      });
  });

  app.get('/api/v1/products/:id', (req, res) => {
    getShopifyInstance.product.get(req.params.id, req.query)
      .then((product) => {
        return res.json(product);
      })
      .catch((err) => {
        return res.json(err.response.body);
      })
  });
}
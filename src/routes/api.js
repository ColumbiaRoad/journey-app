const Shopify = require('shopify-api-node');
const shopModel = require('../models/shops');
const winston = require('winston'); // LOGGING

const shopName = process.env.SHOP;
const shopDomain = `${shopName}.myshopify.com`;
const token = shopModel.getShop(shopDomain)
winston.info(`Shop name: ${shopName}`);
winston.info(`Shop domain: ${shopDomain}`);
winston.info(`Access token: ${token}`);

const shopify = new Shopify({
  shopName: shopName,
  accessToken: token,
  autoLimit: true
});

module.exports = (app) => {
  app.get('/api/v1/products', (req, res) => {
    shopify.product.list(req.query)
      .then((products) => {
        return res.json(products);
      })
      .catch((err) => {
        return res.json(err.response.body);
      });
  });

  app.get('/api/v1/products/:id', (req, res) => {
    shopify.product.get(req.params.id, req.query)
      .then((product) => {
        return res.json(product);
      })
      .catch((err) => {
        return res.json(err.response.body);
      })
  });
}
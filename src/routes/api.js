const Shopify = require('shopify-api-node');
const shopModel = require('../models/shops');
const shopName = process.env.SHOP;

const shopify = new Shopify({
  shopName: shopName,
  accessToken: shopModel.getShop(shopName),
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
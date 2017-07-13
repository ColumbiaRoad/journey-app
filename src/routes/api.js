const Shopify = require('shopify-api-node');

const apiKey = process.env.API_KEY;
const password = process.env.API_SECRET;
const shopName = process.env.SHOP;

const shopify = new Shopify({
  shopName: shopName,
  apiKey: apiKey,
  password: password
});

module.exports = (app) => {
  app.get('/api/v1/products', (req, res) => {
    shopify.product.list(req.query)
      .then((products) => {
        return res.json(products);
      })
      .catch((err) => {
        return res.json(err);
      });
  });

  app.get('/api/v1/products/:id', (req, res) => {
    shopify.product.get(req.params.id, req.query)
      .then((product) => {
        return res.json(product);
      })
      .catch((err) => {
        return res.json(err);
      })
  });
}
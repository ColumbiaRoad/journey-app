const axios = require('axios');
const apikey = process.env.API_KEY;
const secret = process.env.API_SECRET;
const shop = process.env.SHOP;

const baseUrl = `https://${apikey}:${secret}@${shop}.myshopify.com/admin`;

module.exports = (app) => {
  app.get('/api/v1/products', (req, res) => {
    axios.get(`${baseUrl}/products.json`)
      .then((result) => {
        return res.json(result.data);
      })
      .catch((err) => {
        return res.json(err);
      });
  });

  app.get('/api/v1/products/:productId', (req, res) => {
    axios.get(`${baseUrl}/products/${req.params.productId}.json`)
      .then((result) => {
        return res.json(result.data);
      })
      .catch((err) => {
        return res.json(err.response.data);
      })
  });
}
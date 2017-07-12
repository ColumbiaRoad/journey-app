const axios = require('axios');
const apikey = process.env.API_KEY;
const secret = process.env.API_SECRET;
const shop = process.env.SHOP;

const baseUrl = `https://${apikey}:${secret}@${shop}.myshopify.com/admin`;

module.exports = function(app) {
  app.get('/api/products', function(req, res) {
    axios.get(`${baseUrl}/products.json`)
      .then((result) => {
        return res.json(result.data);
      })
      .catch((err) => {
        return res.json(err);
      });
  });
}
const axios = require('axios');
const url = require('url');
const apikey = process.env.API_KEY;
const secret = process.env.API_SECRET;
const shop = process.env.SHOP;

const rootUrl = `https://${apikey}:${secret}@${shop}.myshopify.com/admin`;

/**
 * Builds complete URL for Shopify's Admin API. Also
 * appends query parameters if existent.
 * 
 * @param {Request} req 
 * @param {string} path 
 */
function buildUrl(req, path) {
  // Append path to root URL
  const baseUrl = `${rootUrl}${path}`
  queryString = url.parse(req.url).query;
  return queryString === null 
      ? baseUrl
      : `${baseUrl}?${queryString}`;
}

module.exports = (app) => {
  app.get('/api/v1/products', (req, res) => {
    fullUrl = buildUrl(req, `/products.json`);
    axios.get(fullUrl)
      .then((result) => {
        return res.json(result.data);
      })
      .catch((err) => {
        return res.json(err.response.data);
      });
  });

  app.get('/api/v1/products/:productId', (req, res) => {
    fullUrl = buildUrl(req, `/products/${req.params.productId}.json`);
    axios.get(fullUrl)
      .then((result) => {
        return res.json(result.data);
      })
      .catch((err) => {
        return res.json(err.response.data);
      })
  });
}
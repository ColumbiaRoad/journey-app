const util = require('util');
const jwt = require('jsonwebtoken');
const ShopifyToken = require('shopify-token');

const validationError = (result) => {
  return 'There have been validation errors: ' + util.inspect(result.array());
};

//https://stackoverflow.com/questions/14446511/what-is-the-most-efficient-method-to-groupby-on-a-javascript-array-of-objects
const groupBy = (xs, key) => {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const getJWTToken = (shop) => {
  const payload = {
    shop: shop
  };
  return jwt.sign(payload, process.env.SHOPIFY_APP_SECRET, { expiresIn: '3h' });
}

const decodeJWTToken = (token) => {
  return jwt.verify(token, process.env.SHOPIFY_APP_SECRET);
}

const getShopifyToken = () => {
  return new ShopifyToken({
    sharedSecret: process.env.SHOPIFY_APP_SECRET,
    redirectUri: `${process.env.BASE_URL}/auth/redirect/uri`,
    apiKey: process.env.SHOPIFY_API_KEY
  });
};


module.exports = {
  validationError, groupBy, getJWTToken, decodeJWTToken, getShopifyToken
};

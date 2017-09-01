const util = require('util');
const jwt = require('jsonwebtoken');

const validationError = (result) => {
  return 'There have been validation errors: ' + util.inspect(result.array());
};

const getJWTToken = (shop, scope) => {
  const payload = {
    shop: shop,
    scope: scope
  };
  return jwt.sign(payload, process.env.SHOPIFY_APP_SECRET, { expiresIn: '3h' });
}

const decodeJWTToken = (token) => {
  return jwt.verify(token, process.env.SHOPIFY_APP_SECRET);
}

const scopes = {
  api: 'api',
  app: 'application-proxy'
}

module.exports = {
  validationError, getJWTToken, decodeJWTToken, scopes
};

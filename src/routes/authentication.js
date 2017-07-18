
const util = require('util');
const crypto = require('crypto');
const winston = require('winston'); // LOGGING
const redis = require('../helpers/redisHelper');
const ShopifyToken = require('shopify-token');
const shopModel = require('../models/shops');

const validationError = (res, result) => {
  const message = 'There have been validation errors: ' + util.inspect(result.array());
  return res.status(400).send(message);
};

const getShopifyToken = () => {
  return new ShopifyToken({
    sharedSecret: process.env.SHOPIFY_APP_SECRET,
    redirectUri: `${process.env.BASE_URL}/auth/redirect/uri`,
    apiKey: process.env.SHOPIFY_API_KEY
  });
};

module.exports = function(app) {

  app.get('/auth/shopify-embedded', function(req, res) {
    req.checkQuery('hmac', 'Invalid or missing param').notEmpty();
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();

    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        return validationError(res, result);
      }
      let {hmac, shop, timestamp} = req.query;
      const shopifyToken = getShopifyToken();
      const nonce = shopifyToken.generateNonce();

      redis.setNonceByShop(shop, nonce, function(err) {
        if (err) {
          res.status(500).send();
          throw new Error();
        } else {
          const shop_name = shop.split('.')[0];
          const url = shopifyToken.generateAuthUrl(shop_name, process.env.SHOPIFY_SCOPES, nonce);
          return res.redirect(url);
        }
      })
    });
  });

  app.get('/auth/redirect/uri', function(req, res) {
    req.checkQuery('code', 'Invalid or missing param').notEmpty();
    req.checkQuery('hmac', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();
    req.checkQuery('state', 'Invalid or missing param').notEmpty();
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();

    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        return validationError(res, result);
      }
      const {code, hmac, timestamp, state, shop} = req.query;
      const shopifyToken = getShopifyToken();
      const tokenMatch = shopifyToken.verifyHmac({
        hmac, state, code, shop, timestamp
      });
      if (!tokenMatch) {
        return res.status(400).send('HMAC do not match');
      }

      redis.getNonceByShop(shop, (error, nonce) => {
        if (error || nonce !== state) {
          return res.status(400).send('State parameter do not match.');
        }
        // NONCE should be maybe deleted from redis if matches
        shopifyToken.getAccessToken(shop, code).then((token) => {
          return shopModel.saveShop(shop, token);
        }).then((saveParam) => {
          winston.info('saved to db ' + saveParam);
          return res.redirect(`${process.env.BASE_URL}/app_installed?shop=${shop}`);
        }).catch((err) => {
          winston.error(err);
          return res.redirect(`${process.env.BASE_URL}/app_installation_failed`);
        });
      });
    });
  });

  app.get('/app_installed', function(req, res) {
    // res.send('Installation works! this redirect should go to some useful place!');
    const shop = req.query.shop;
    res.redirect(`https://ja-admin-panel-us.herokuapp.com/login?shop=${shop}`);
  });

  app.get('/app_installation_failed', function(req, res) {
    res.send('Installation do not work :(');
  });
};

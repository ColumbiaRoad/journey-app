const crypto = require('crypto');
const winston = require('winston'); // LOGGING
const redis = require('../helpers/redisHelper');
const shopModel = require('../models/shop');
const getJWTToken = require('../helpers/utils').getJWTToken;
const getShopifyToken = require('../helpers/utils').getShopifyToken;
const validationError = require('../helpers/utils').validationError;

module.exports = function(app) {

  app.get('/auth/shopify-embedded', function(req, res) {
    req.checkQuery('hmac', 'Invalid or missing param').notEmpty();
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();

    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        return res.status(400).send(validationError(result));
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
        return res.status(400).send(validationError(result));
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
          const shop = req.query.shop;
          const token = getJWTToken(shop);
          res.redirect(`${process.env.ADMIN_PANEL_URL}?shop=${shop}&token=${token}`);
        }).catch((err) => {
          winston.error(err);
          return res.status(400).send('Unable to authenticate');
        });
      });
    });
  });
};

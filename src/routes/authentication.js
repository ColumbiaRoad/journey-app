const crypto = require('crypto');
const winston = require('winston'); // LOGGING
const redis = require('../helpers/redisHelper');
const shopModel = require('../models/shop');
const getJWTToken = require('../helpers/utils').getJWTToken;
const scopes = require('../helpers/utils').scopes;
const getShopifyToken = require('../helpers/shopifyHelper').getShopifyToken;
const getShopifyInstance = require('../helpers/shopifyHelper').getShopifyInstance;
const validationError = require('../helpers/utils').validationError;

function checkWebhookSignature(req) {
  const hmac = req.headers['x-shopify-hmac-sha256']
  const digest = crypto.createHmac('sha256', process.env.SHOPIFY_APP_SECRET)
  .update(req.rawBody)
  .digest('base64');
  return digest === hmac;
}

function setUpWebhook(shop, accessToken, baseUrl) {
  return getShopifyInstance(shop, accessToken)
  .then((shopify) => {
    return shopify.webhook.create({
      topic: 'app/uninstalled',
      address: `${baseUrl}/auth/uninstall`,
      format: 'json'
    });
  });
}

module.exports = function(app) {

  app.get('/auth/shopify', function(req, res) {
    req.checkQuery('hmac', 'Invalid or missing param').notEmpty();
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();

    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        return res.status(400).send(validationError(result));
      }
      let {hmac, shop, timestamp} = req.query;

      shopModel.getShop(shop)
      .then((result) => {
        // Shop does not exist in database => start installation process
        if(result === null) {
          const shopifyToken = getShopifyToken();
          const nonce = shopifyToken.generateNonce();
    
          redis.setNonceByShop(shop, nonce, (err) => {
            if (err) {
              winston.error(err);
              res.status(500).send();
            } else {
              const shop_name = shop.split('.')[0];
              const url = shopifyToken.generateAuthUrl(shop_name, process.env.SHOPIFY_SCOPES, nonce);
              return res.redirect(url);
            }
          });
        // Shop is already known => skip installation process
        } else {
          const token = getJWTToken(shop, scopes.api);
          res.redirect(`${process.env.ADMIN_PANEL_URL}?shop=${shop}&token=${token}`);
        }
      })
    });
  });

  app.get('/auth/install', function(req, res) {
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
      let accessToken;
      redis.getNonceByShop(shop, (error, nonce) => {
        if (error || nonce !== state) {
          return res.status(400).send('State parameter do not match.');
        }
        shopifyToken.getAccessToken(shop, code)
        .then((token) => {
          // Save token to access it later
          accessToken = token;
          return shopModel.saveShop(shop, accessToken);
        })
        .then(() => {
          winston.info(`saved shop ${shop}`);
          return setUpWebhook(shop, accessToken, process.env.BASE_URL);
        })
        .then((webhook) => {
          const token = getJWTToken(shop, scopes.api);
          res.redirect(`${process.env.ADMIN_PANEL_URL}?shop=${shop}&token=${token}`);
        })
        .catch((err) => {
          winston.error(err);
          if (err.response) winston.error(err.response)
          return res.status(500).send('Installation failed');
        });
      });
    });
  });

  app.post('/auth/uninstall', function(req, res) {
    if(checkWebhookSignature(req)) {
      // Answer as quickly as possible to ensure to stay within
      // Shopify's 5s timer
      res.status(200).send();
      // Only delete shop if topic is correct
      if(req.headers['x-shopify-topic'] === 'app/uninstalled') {
        const shopUrl = req.headers['x-shopify-shop-domain']
        shopModel.deleteShop(shopUrl)
        .then(() => {
          winston.info(`Shop ${shopUrl} deleted`);
        })
        .catch((err) => {
          winston.error(err);
        })
      }
    } else {
      res.status(400).json({ error: 'Invalid HMAC'});
    }
  });
};

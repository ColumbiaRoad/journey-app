
const Promise = require("bluebird");
const util = require('util');
const crypto = require('crypto');
const winston = require('winston'); // LOGGING
const redis = require('../helpers/redisHelper');
const unirest = require('unirest');

const requestForAccessToken = (req, res) => {
  const {code, hmac, timestamp, state, shop} = req.query;
  const url = `https://${shop}/admin/oauth/access_token`;
  unirest.post(url)
  .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
  .send({ "client_id": process.env.SHOPIFY_API_KEY,
          "client_secret": process.env.SHOPIFY_APP_SECRET,
          "code": code})
  .end((response) => {
    if (response.status === 200) {
      const access_token = response.body.access_token;
      //SAVE access token and shop somewhere
      // if we want more info about user, should change
      // https://help.shopify.com/api/getting-started/authentication/oauth#api-access-modes
      // to 'online access mode'
      winston.info('ACCESS TOKEN ' + access_token);
      return res.redirect(`${process.env.BASE_URL}/app_installed`);
    } else {
      return res.redirect(`${process.env.BASE_URL}/app_installation_failed`);
    }
  });
};

const validatinError = (res, result) => {
  const message = 'There have been validation errors: ' + util.inspect(result.array());
  return res.status(400).send(message);
};

module.exports = function(app) {

  app.get('/auth/shopify-embedded', function(req, res) {
    req.checkQuery('hmac', 'Invalid or missing param').notEmpty().checkHmac(req);
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();

    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        return validatinError(res, result);
      }
      let {hmac, shop, timestamp} = req.query;
      const nonce = crypto.randomFillSync(Buffer.alloc(48)).toString('hex');

      redis.setNonceByShop(shop, nonce, function(err) {
        if (err) {
          res.status(500).send();
          throw new Error();
        } else {
          const redirect_uri = `${process.env.BASE_URL}/auth/redirect/uri`;
          const url = `https://${shop}/admin/oauth/authorize` +
                      `?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&` +
                      `redirect_uri=${redirect_uri}&state=${nonce}`;//&grant_options[]=per-user`;

          return res.redirect(url);
        }
      })
    });
  });

  app.get('/auth/redirect/uri', function(req, res) {
    req.checkQuery('code', 'Invalid or missing param').notEmpty();
    req.checkQuery('hmac', 'Invalid or missing param').notEmpty().checkHmac(req);
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();
    req.checkQuery('state', 'Invalid or missing param').notEmpty();
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();

    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        return validatinError(res, result);
      }

      redis.getNonceByShop(req.query.shop, (error, nonce) => {
        if (error || nonce !== req.query.state) {
          return res.status(400).send('State parameter do not match.');
        }
        // NONCE should be maybe deleted from redis if matches
        return requestForAccessToken(req, res);
      });
    });
  });

  app.get('/app_installed', function(req, res) {
    res.send('Installation works! this redirect should go to some useful place!');
  });

  app.get('/app_installation_failed', function(req, res) {
    res.send('Installation do not work :(');
  });
};


//app/auth/shopify-embedded?hmac=4a52a613d2b2363ef6cb19cd59eeb4bee11a9ff570566dc13c0ccf80642ada8e&shop=samusteststore.myshopify.com&timestamp=1499847378
const Promise = require("bluebird");
const util = require('util');
const crypto = require('crypto');
const winston = require('winston');
const redis = require('../helpers/redisHelper');

function saveNonce(shop, nonce) {
  winston.info('shop ' + shop + ', nonce ' + nonce);
}

module.exports = function(app) {

  app.get('/auth/shopify-embedded', function(req, res) {
    req.checkQuery('hmac', 'Invalid or missing param').notEmpty();
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();
    //CHECK HMAC HERE AND PROCEED ONLY IF SUCCESS
    // IT COULD BE CUSTOM VALIDATOR ALSO
    // https://github.com/ctavan/express-validator  look customValidators
    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        const message = 'There have been validation errors: ' + util.inspect(result.array());
        res.status(400).send(message);
        throw new Error(message);
      }
      let {hmac, shop, timestamp} = req.query;
      const nonce = crypto.randomFillSync(Buffer.alloc(48)).toString('hex');

      redis.setNonceByShop(shop, nonce, function(err) {
        if (err) {
          res.status(500).send();
          throw new Error();
        } else {
          const redirect_uri = `${process.env.BASE_URL}/auth/redirect/uri`;
          const url = `https://${shop}.myshopify.com/admin/oauth/authorize` +
                      `?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&` +
                      `redirect_uri=${redirect_uri}&state=${nonce}&grant_options[]=per-user`;

          return res.redirect(url);
        }
      })
    });
  });

  //https://example.org/some/redirect/uri?code={authorization_code}&hmac=da9d83c171400a41f8db91a950508985&timestamp=1409617544&state={nonce}&shop={hostname}
  app.post('/auth/redirect/uri', function(req, res) {
    req.checkQuery('code', 'Invalid or missing param').notEmpty();
    req.checkQuery('hmac', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();
    req.checkQuery('state', 'Invalid or missing param').notEmpty();
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();

    const {code, hmac, timestamp, state, shop} = req.query;

  });

};

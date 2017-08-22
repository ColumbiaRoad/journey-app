const getShopifyInstance = require('../helpers/shopifyHelper').getShopifyInstance;
const winston = require('winston'); // LOGGING
const crypto = require('crypto');
const questionnaireModel = require('../models/questionnaire');
const validationError = require('../helpers/utils').validationError;

function checkSignature(query) {
  const params = Object.keys(query).filter(k => k !== 'hmac' && k !== 'signature').sort().map((k) => {
    return `${k}=${Array.isArray(query[k]) ? query[k].join() : query[k]}`;
  }).join('');
  const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_APP_SECRET);
  hmac.update(params);
  return hmac.digest('hex') === query.signature;
}

module.exports = function(app) {
  app.get('/questionnaire', (req, res) => {
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();
    req.checkQuery('signature', 'Invalid or missing param').notEmpty();

    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        return res.status(400).send(validationError(result));
      }
      const query = Object.assign({}, req.query);
      query.hmac = req.query.signature;
      const tokenMatch = checkSignature(req.query);
      if (!tokenMatch) {
        return res.status(400).send('Invalid signature');
      }
      const options = {
        root: `${__dirname}/../liquid/`,
        headers: {
          'content-type': 'application/liquid'
        }
      }
      res.sendFile('questionnaire.liquid', options);
    });
  });
}
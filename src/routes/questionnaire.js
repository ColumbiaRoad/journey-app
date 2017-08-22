const getShopifyInstance = require('../helpers/shopifyHelper').getShopifyInstance;
const winston = require('winston'); // LOGGING
const crypto = require('crypto');
const encodeUrl = require('encodeurl');
const questionnaireModel = require('../models/questionnaire');
const validationError = require('../helpers/utils').validationError;
const getShopifyToken = require('../helpers/utils').getShopifyToken;

module.exports = function(app) {
  app.get('/questionnaire', (req, res) => {
    req.getValidationResult().then(function(result) {
      if (!result.isEmpty()) {
        return res.status(400).send(validationError(result));
      }
      const shopifyToken = getShopifyToken();
      // const pairs = Object.keys(req.query).filter(k => k !== 'signature').sort().map((k) => {
      //   return `${k}=${req.query[k]}`;
      // });
      // console.log(pairs.join(''));
      // const digest = crypto.createHmac('sha256', process.env.SHOPIFY_APP_SECRET)
      // .update(pairs.join(''))
      // .digest('hex');
      const tokenMatch = shopifyToken.verifyHmac(req.query);
      if (!tokenMatch) {
        console.log('Invalid signature');
        return res.status(400).send('Invalid signature');
      }
      console.log(`tokenMatch: ${tokenMatch}`);
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
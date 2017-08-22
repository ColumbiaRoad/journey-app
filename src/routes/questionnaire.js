const getShopifyInstance = require('../helpers/shopifyHelper').getShopifyInstance;
const winston = require('winston'); // LOGGING
const crypto = require('crypto');
const questionnaireModel = require('../models/questionnaire');
const validationError = require('../helpers/utils').validationError;
const Hogan = require('hogan.js');
const fs = require('fs');

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
      res.setHeader('content-type', 'application/liquid');
      // Send liquid file
      fs.readFile(`${__dirname}/../liquid/questionnaire.liquid`,'utf8', (err, data) => {
        if (err) {
          winston.error(err);
          res.send('<p>Unable to find questionnaire.</p>');
        } else {
          // Parse liquid file using hogan.js with custom delimiters
          // to allow passing variables to allow passing variables to it
          const template = Hogan.compile(data, {delimiters: '<% %>'});
          res.send(template.render({name: 'max'}));
        }
      })
    });
  });
}
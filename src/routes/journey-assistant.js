const winston = require('winston'); // LOGGING
const crypto = require('crypto');
const Hogan = require('hogan.js');
const readFile = require('fs').readFile;
const path = require('path');
const jwt = require('express-jwt');
const getShopifyInstance = require('../helpers/shopifyHelper').getShopifyInstance;
const questionnaireModel = require('../models/questionnaire');
const validationError = require('../helpers/utils').validationError;
const getJWTToken = require('../helpers/utils').getJWTToken;
const scopes = require('../helpers/utils').scopes;
const guard = require('express-jwt-permissions')({
  requestProperty: 'auth',
  permissionsProperty: 'scope'
});

// Configure express to look for a JWT token as a query paramter
const jwtCheck = jwt({
  secret: process.env.SHOPIFY_APP_SECRET,
  requestProperty: 'auth',
  getToken: function fromQuerystring (req) {
    if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
});

// Catch errors caused by validating the JWT token
const handleErrors = (err, req, res, next) => {
  if (err.code === 'invalid_token') {
    res.status(401).send('Invalid token');
  } else if (err.code === 'permission_denied') {
    res.status(403).send('Insufficient Permissions');
  }
};

function checkSignature(query) {
  const params = Object.keys(query).filter(k => k !== 'hmac' && k !== 'signature').sort().map((k) => {
    return `${k}=${Array.isArray(query[k]) ? query[k].join() : query[k]}`;
  }).join('');
  const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_APP_SECRET);
  hmac.update(params);
  return hmac.digest('hex') === query.signature;
}

function findProductVariant(product, answers) {
  const answerOrder = {};
  for(let i = 1; i <= 3; i++) {
    answerOrder[`option${i}`] = product.options.find((o) => o.position === i)
    ? answers[product.options.find((o) => o.position === i).name]
    : null;
  }
  return product.variants.find((variant) => {
    return JSON.stringify({ 
      option1: variant.option1, 
      option2: variant.option2,
      option3: variant.option3  
    }) === JSON.stringify(answerOrder);
  });
}

module.exports = function(app) {
  app.get('/journey-assistant', (req, res) => {
    req.checkQuery('shop', 'Invalid or missing param').notEmpty();
    req.checkQuery('timestamp', 'Invalid or missing param').notEmpty().isInt();
    req.checkQuery('signature', 'Invalid or missing param').notEmpty();

    req.getValidationResult().then((result) => {
      let questionnaireId;
      if (!result.isEmpty()) {
        return res.status(400).send(validationError(result));
      }
      const query = Object.assign({}, req.query);
      query.hmac = req.query.signature;
      const tokenMatch = checkSignature(req.query);
      if (!tokenMatch) {
        return res.status(400).send('Invalid signature');
      }
      questionnaireModel.getAllQuestionnaires(req.query.shop)
      .then((result) => {
        if(result.questionnaireIds.length > 0) {
          questionnaireId = result.questionnaireIds[0]
          return questionnaireModel.getQuestionnaire(questionnaireId);
        } else {
          return Promise.reject({error: 'unable to find questionnaire for given shop'});
        }
      })
      .then((questionnaire) => {
        // Send liquid file
        readFile(path.join(__dirname, '../liquid/questionnaire.liquid.mustache'),'utf8', (err, data) => {
          if (err) {
            return Promise.reject(err);
          } else {
            questionnaire.selectedProducts = questionnaire.selectedProducts.map((item) => {
              const mapping = questionnaire.rootQuestion.answerMapping.find(m => m.value == item.productId);
              return Object.assign({
                rootQuestionAnswer: mapping.answer
              }, item);
            });
            // Parse liquid file using Hogan.js with custom delimiters
            // to allow passing variables to it
            const template = Hogan.compile(data, {delimiters: '<% %>'});
            res.setHeader('content-type', 'application/liquid');
            res.send(template.render({
              shop: req.query.shop,
              questionnaire: questionnaire,
              token: getJWTToken(req.query.shop, scopes.app),
              actionUrl: `${req.protocol}://${req.get('host')}/journey-assistant/${questionnaireId}`
            }));
          }
        });
      })
      .catch((err) => {
        winston.error(err);
        res.status(500).send('<p>An error occurred.</p>');
      });
    });
  });

  app.get('/journey-assistant/:questionnaireId',
    // Validate JWT token in query
    jwtCheck,
    // Check permissions
    guard.check(scopes.app),
    // Handle any JWT related errors
    handleErrors,
    (req, res) => {
      req.checkQuery('productId', 'Invalid or missing param').notEmpty().isInt();
      req.getValidationResult()
      .then((result) => {
        let questionnaireId;
        if (!result.isEmpty()) {
          return res.status(400).send(validationError(result));
        }
        return getShopifyInstance(req.auth.shop);
      })
      .then((shopify) => {
        return shopify.product.get(req.query.productId, { fields: 'id,handle,options,variants' });
      })
      .then((product) => {
        const answers = {};
        for(const option of product.options.map(o => o.name)) {
          answers[option] = req.query[option];
        }
        const matchingVariant = findProductVariant(product, answers);
        if(matchingVariant) {
          res.redirect(`https://${req.auth.shop}/products/${product.handle}?variant=${matchingVariant.id}&ref=journey-assistant`);
        } else {
          // If no matching variant is found, default to product page
          res.redirect(`https://${req.auth.shop}/products/${product.handle}?ref=journey-assistant`);
        }
      })
      .catch((err) => {
        winston.error(err);
        res.status(404).send('<p>Unknown shop or product</p>');
      })
    }
  );
}
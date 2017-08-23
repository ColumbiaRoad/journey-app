const getShopifyInstance = require('../helpers/shopifyHelper').getShopifyInstance;
const winston = require('winston'); // LOGGING
const crypto = require('crypto');
const questionnaireModel = require('../models/questionnaire');
const validationError = require('../helpers/utils').validationError;
const Hogan = require('hogan.js');
const readFile = require("fs").readFile;

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
      questionnaireModel.getAllQuestionnaires(req.query.shop)
      .then((result) => {
        if(result.questionnaireIds.length > 0) {
          const questionnaireId = result.questionnaireIds[0]
          return questionnaireModel.getQuestionnaire(questionnaireId);
        } else {
          return Promise.reject({error: 'unable to find questionnaire for given shop'});
        }
      })
      .then((questionnaire) => {
        // Send liquid file
        readFile(`${__dirname}/../liquid/questionnaire.liquid.mustache`,'utf8', (err, data) => {
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
}
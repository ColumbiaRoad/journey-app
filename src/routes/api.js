const Shopify = require('shopify-api-node');
const shopModel = require('../models/shops');
const winston = require('winston'); // LOGGING
const surveyModel = require('../models/surveys');
const validationError = require('../helpers/utils').validationError;

let shopify = undefined;

function getShopifyInstance(shop) {
  return new Promise((resolve, reject) => {
    if(shopify === undefined) {
    shopModel.getShop(shop)
      .then((result) => {
        winston.info(`Shops matching: ${result.length}`);
        // Currently shops aren't deleted so there can be multiple tokens.
        // If so, take latest
        const shop = result.length > 0 ? result.pop() : undefined;
        if(shop !== undefined) {
          shopify = new Shopify({
            shopName: shop.shop_url.split('.')[0],
            accessToken: shop.access_token,
            autoLimit: true
          });
          resolve(shopify);
        } else {
          reject({
            message: 'Unkown shop'
          });
        }
      })
      .catch((err) => {
        reject(err);
      });
    } else {
      resolve(shopify);
    }
  });

}

module.exports = function(app) {
  app.get('/api/v1/products', (req, res) => {
    getShopifyInstance(req.auth.shop)
      .then((shopify) => {
        return shopify.product.list(req.query);
      })
      .then((products) => {
        return res.json(products);
      })
      .catch((err) => {
        if (err && err.hasOwnProperty('response')) {
          return res.json(err.response.body);
        } else {
          const message = err.hasOwnProperty('message') ? err.message : 'unkown error';
          return res.json({
            errors: message
          });
        }
      });
  });

  app.get('/api/v1/products/:id', (req, res) => {
    getShopifyInstance(req.auth.shop)
      .then((shopify) => {
        return shopify.product.get(req.params.id, req.query);
      })
      .then((product) => {
        return res.json(product);
      })
      .catch((err) => {
        return res.json(err.response.body);
      });
  });

  /**
   * Saves survey (e.g questions and answers) in same format as test/save-survey-route.js
   */
  app.post('/api/v1/survey-model', (req, res) => {
    req.checkBody({
     'questions': {
        notEmpty: true
    }});
    req.getValidationResult().then((result) => {
      if (!result.isEmpty()) {
        throw new Error(validationError(result));
      }
      const shopName = (req.auth) ? req.auth.shop : 'salashoppi'; // FOR TESTING
      return Promise.all(req.body.questions.map((questionObject) => {
        return surveyModel.saveQuestionAndAnswers(
          shopName, questionObject.question, questionObject.questionRowId,
          questionObject.productId, questionObject.answers
        );
      }));
    })
    .then((response) => {
      return res.json({status: 'ok'});
    })
    .catch((err) => {
      winston.error(err);
      return res.status(400).send('Unable to save model');
    });
  });
}

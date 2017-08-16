const Shopify = require('shopify-api-node');
const shopModel = require('../models/shop');
const winston = require('winston'); // LOGGING
const questionnaireModel = require('../models/questionnaire');
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
   * Saves questionnaire (e.g questions and answers) in same format as test/save-questionnaire-route.js
   */
  app.post('/api/v1/questionnaire', (req, res) => {
    req.checkBody('questions', 'Invalid or missing param').notEmpty();
    req.checkBody('productId', 'Invalid or missing param').notEmpty();
    req.getValidationResult().then((result) => {
      if (!result.isEmpty()) {
        throw new Error(validationError(result));
      }
      const shopName = req.auth.shop;
      // TODO create questionnaire in DB
      return Promise.all(req.body.questions.map((questionItem) => {
        return questionnaireModel.saveQuestionAndAnswers(
          shopName, req.body.productId,
          questionItem.question, questionItem.optionId, questionItem.answerMapping
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

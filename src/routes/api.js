
const getShopifyInstance = require('../helpers/shopifyHelper').getShopifyInstance;
const winston = require('winston'); // LOGGING
const questionnaireModel = require('../models/questionnaire');
const validationError = require('../helpers/utils').validationError;

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
        winston.error(err);
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
        winston.error(err);
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

  /**
   * Saves questionnaire (e.g questions and answers) in same format as test/save-questionnaire-route.js
   */
  app.post('/api/v1/questionnaire', (req, res) => {
    req.checkBody('questionnaire', 'Invalid or missing param').notEmpty();
    req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) {
        throw new Error(validationError(result));
      }
      const shopName = req.auth.shop;
      return questionnaireModel.createQuestionnaire(shopName);
    })
    .then((result) => {
      return questionnaireModel.saveQuestionnaire(result.questionnaireId, req.body.questionnaire);
    })
    .then((savedQuestionnaire) => {
      const id = savedQuestionnaire.find(e => e.questionnaireId).questionnaireId;
      return res.json({ status: 'ok', questionnaireId: id });
    })
    .catch((err) => {
      winston.error(`Error when saving questionnaire: ${err}`);
      return res.status(400).json(err);
    });
  });

  app.get('/api/v1/questionnaire/:id', (req, res) => {
    questionnaireModel.getQuestionnaire(req.params.id)
    .then((questionnaire) => {
      return res.json({ status: 'ok', questionnaire: questionnaire });
    })
    .catch((err) => {
      return res.status(404).json(err);
    });
  });

  app.delete('/api/v1/questionnaire/:id', (req, res) => {
    questionnaireModel.deleteQuestionnaire(req.params.id)
    .then((result) => {
      return res.json({ status: 'ok' });
    })
    .catch((err) => {
      return res.status(404).json(err);
    });
  });

  app.get('/api/v1/shop/questionnaire', (req, res) => {
    questionnaireModel.getAllQuestionnaires(req.auth.shop)
    .then((result) => {
      if(result.questionnaireIds.length > 0) {
        return questionnaireModel.getQuestionnaire(result.questionnaireIds[0]);
      } else {
        return Promise.reject('Unable to find questionnaires');
      }
    })
    .then((questionnaire) => {
      return res.json({ status: 'ok', questionnaire: questionnaire });
    })
    .catch((err) => {
      return res.json({error: err});
    });
  });

  app.post('/api/v1/shop/questionnaire', (req, res) => {
    const shop = req.auth.shop;
    req.checkBody('questionnaire', 'Invalid or missing param').notEmpty();
    req.getValidationResult()
    .then((result) => {
      if (!result.isEmpty()) {
        throw new Error(validationError(result));
      }
      return questionnaireModel.getAllQuestionnaires(shop)
    })
    .then((result) => {
      if(result.questionnaireIds.length > 0) {
        return questionnaireModel.updateQuestionnaire(result.questionnaireIds[0], req.body.questionnaire);
      } else {
        questionnaireModel.createQuestionnaire(shop)
        .then((result) => {
          return questionnaireModel.saveQuestionnaire(result.questionnaireId, req.body.questionnaire);
        })
        .catch((err) => {
          res.json(err);
        })
      }
    })
    .then((result) => {
      res.json({ status: 'ok' });
    })
    .catch((err) => {
      winston.error(err);
      res.status(400).json(err);
    })
  });
}

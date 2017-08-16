
const utils = require('../helpers/utils');
const questionnaireModel = require('../models/questionnaire');
const winston = require('winston'); // LOGGING
const getShopifyInstance = require('../helpers/shopifyHelper').getShopifyInstance;

module.exports = function(app) {

  const javascript = (variants) => {
    return `
      <script>
        var variants = ${JSON.stringify(variangs)};
        function next(form, max, id) {
          document.getElementById(form + id).style.display = 'none';
          if (max - 1 !== id) {
            document.getElementById(form + (id + 1)).style.display = 'block';

          }
        }
      </script>
    `;
  };

  const answerWithLink = (answer, questionCount, questionIdForm, index) => {
    return `<p onClick="next('${questionIdForm}', ${questionCount}, ${index})" > ${answer} </p>`;
  };

  const formatOneQuestion = (question, questionCount, index) => {
    const questionIdForm = 'survey_question_';
    const questionId = `${questionIdForm}${index}`;
    const displayValue = (index === 0) ? 'block' : 'none';
    return `<div
              style="text-align:center;display:${displayValue};"
              id=${questionId}>` +
            '<h1>' + question[0].question + '</h1>' +
            question.map((item) => answerWithLink(
              item.answer, questionCount, questionIdForm, index
            )).join(' ') + '</div>';
  };

  const createPage = (grouppedQuestions, variants) => {
    let liquidHTML = '';
    const surveyKeys = Object.keys(grouppedQuestions);
     surveyKeys.forEach((question, index) => {
       liquidHTML += formatOneQuestion(grouppedQuestions[question], surveyKeys.length, index);
     });
     liquidHTML += javascript(variants);
     return liquidHTML;
  };

  const createVariantMapping = (variants, product) => {
    const options = product.options;
    const optionsKeys = Object.keys(variants[0]).filter((keyStr) => keyStr.indexOf('option') !== -1);
    const variantKeys = optionsKeys.concat(['id']); // add here all useful keys of variant objects
    return variants.map((variant) => {
      return variantKeys.reduce((obj, key) => {
        const newValue = variant[key];
        if (optionsKeys.indexOf(key) !== -1) {
          for (var i = 0; i < options.length; i++) {
            var optValues = options[i].values;
            if (optValues.indexOf(newValue) !== -1) {
              obj[options[i].name] = newValue;
            }
          }
        } else {
          obj[key] = newValue;
        }
        return obj;
      }, {});
    });
  };

  app.get('/journey-assistant', function(req, res) {
    const shopUrl = req.query.shop;
    Promise.all([
      questionnaireModel.getAllQuestionnaires(shopUrl),
      getShopifyInstance(shopUrl)
    ])
    .then(([model, shopify]) => {
      if (model.length < 1 || shopify === undefined) {
        winston.error('model length: ' + model.length);
        const message = `No shop ${shopUrl} found.`;
        throw new Error(message);
      }
      debugger;
      const productId = model[0].product_id;
      return Promise.all([
        model,
        shopify.productVariant.list(productId),
        shopify.product.get(productId)
      ]);
    })
    .then(([model, variants, product]) => {
      const variantMapping = createVariantMapping(variants, product);
      debugger;
      const grouppedQuestions = utils.groupBy(model, 'question');
      let liquidHTML = createPage(grouppedQuestions, variantMapping);
      res.setHeader('content-type', 'application/liquid'); // Let's tell shopify that liquid is coming!
      return res.send(liquidHTML);
    })
    .catch((err) => {
      winston.error(err);
      return res.status(400).send('something went wrong');
    });
  });
}

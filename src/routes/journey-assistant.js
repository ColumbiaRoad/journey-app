
const utils = require('../helpers/utils');
const questionnaireModel = require('../models/questionnaire');
const winston = require('winston'); // LOGGING

module.exports = function(app) {
  const formatOneQuestion = (question) => {
    return '<div style="text-align:center;">' +
            '<h1>' + question[0].question + '</h1>' +
            question.map((r) => '<p>' + r.answer + '</p>').join(' ') +
           '</div>';
  };

  const createPage = (grouppedQuestions) => {
    let liquidHTML = '';
     Object.keys(grouppedQuestions).forEach((question) => {
       liquidHTML += formatOneQuestion(grouppedQuestions[question]);
     });
     return liquidHTML;
  };

  app.get('/journey-assistant', function(req, res) {
    const shopUrl = req.query.shop;
    questionnaireModel.getAllQuestionsAndAnswers(shopUrl).then((model) => {
      if (model.length < 1) {
        const message = `No shop ${shopUrl} found.`;
        winston.error(message);
        return res.status(400).send(message);
      }
      const grouppedQuestions = utils.groupBy(model, 'question');
      let liquidHTML = createPage(grouppedQuestions);

      res.setHeader('content-type', 'application/liquid'); // Let's tell shopify that liquid is coming!
      return res.send(liquidHTML);
    })
    .catch((err) => {
      winston.error(err);
      return res.status(400).send('something went wrong');
    });
  });
}

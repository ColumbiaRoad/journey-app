
const db = require('./db').getDBInstance();
const shopModel = require('./shops');

/**
 * Saves to db
 * @param  {[string]} shop_name
 * @param  {[string]} question  Like "do you want women or mens bike?"
 * @param  {[array]} answers   Array containing objects like {answer: '', variant: {}}
 * @return {[promise]}
 */
const saveQuestionAndAnswers = (shopName, surveyId, productId, question, optionId, answerMapping) => {
  return shopModel.getShop(shopName).then((shop) => {
    if (shop.length < 1) {
      throw new Error('No shop found with name: ' + shopName);
    }
    return db.query('INSERT INTO questions(question, product_id, option_id, survey_id) '+
      'VALUES($1, $2, $3, $4) RETURNING question_id;',
      [question, productId, optionId, surveyId]);
  }).then((addedQuestion) => {
    const questionId = addedQuestion[0].question_id;
    return db.tx(transaction => {
      return transaction.batch(answerMapping.map((mapping) => {
          return (
            transaction.none(
              `INSERT INTO answers(answer, property_value, answer_row_id, question_id) VALUES ($1, $2, $3, $4);`,
            [mapping.answer, mapping.value, mapping.id, questionId]));
          }));
      });
  });
};

const getAllQuestionsAndAnswers = (shopUrl) => {
  const query = 'SELECT * FROM answers INNER JOIN questions USING (question_id) ' +
    'INNER JOIN shops USING (shop_id) WHERE shop_url LIKE $1;';
  return db.many(query, [shopUrl]);
};

module.exports = {
  saveQuestionAndAnswers, getAllQuestionsAndAnswers
};

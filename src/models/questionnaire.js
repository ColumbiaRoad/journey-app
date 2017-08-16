
const db = require('./db').getDBInstance();
const shopModel = require('./shop');

/**
 * Saves to db
 * @param  {[string]} shopName
 * @param  {[string]} questionnaireId
 * @param  {[string]} productId
 * @param  {[string]} question  Like "do you want women or mens bike?"
 * @param  {[string]} optionId
 * @param  {[array]} answerMapping   Array containing objects like {id: '', answer: '', value: ''}
 * @return {[promise]}
 */
const saveQuestionAndAnswers = (shopName, questionnaireId, productId, question, optionId, answerMapping) => {
  return shopModel.getShop(shopName).then((shop) => {
    if (shop.length < 1) {
      throw new Error('No shop found with name: ' + shopName);
    }
    return db.query('INSERT INTO question(question, product_id, option_id, questionnaire_id) '+
      'VALUES($1, $2, $3, $4) RETURNING question_id;',
      [question, productId, optionId, questionnaireId]);
  }).then((addedQuestion) => {
    const questionId = addedQuestion[0].question_id;
    return db.tx(transaction => {
      return transaction.batch(answerMapping.map((mapping) => {
          return (
            transaction.none(
              `INSERT INTO answer(answer, property_value, answer_row_id, question_id) VALUES ($1, $2, $3, $4);`,
            [mapping.answer, mapping.value, mapping.id, questionId]));
          }));
      });
  });
};

const getAllQuestionnaires = (shopUrl) => {
  const query = 'SELECT questionnaire_id FROM questionnaire INNER JOIN shop USING  (shop_id) ' +
    'WHERE shop_url = $1;';
  return db.many(query, [shopUrl]);
};

const getQuestionnaire = (questionnaireId) => {
  const query = 'SELECT * FROM questionnaire INNER JOIN question USING (questionnaire_id) ' +
    'INNER JOIN answer USING (question_id) WHERE questionnaire_id = $1;';
  return results = db.many(query, [questionnaireId]);
}

module.exports = {
  saveQuestionAndAnswers
};

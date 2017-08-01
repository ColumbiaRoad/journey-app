
const db = require('./db').getDBInstance();
const shopModel = require('./shops');

/**
 * Saves to db
 * @param  {[string]} shop_name
 * @param  {[string]} question  Like "do you want women or mens bike?"
 * @param  {[array]} answers   Array containing objects like {answer: '', variant: {}}
 * @return {[promise]}
 */
const saveQuestionAndAnswers = (shopName, question, answers) => {
  return shopModel.getShop(shopName).then((shop) => {
    if (shop.length < 1) {
      throw new Error('No shop found with name: ' + shopName);
    }
    return db.query('INSERT INTO questions(question, shop_id) '+
      'VALUES($1, $2) RETURNING question_id;', [question, shop[0].shop_id]);
  }).then((addedQuestion) => {
    const questionId = addedQuestion[0].question_id;
    return db.tx(transaction => {
      return transaction.batch(answers.map((answer) => {
          return (
            transaction.none(
              `INSERT INTO answers(question_id, answer, variant) VALUES ($1, $2, $3);`,
            [questionId, answer.answer, answer.variant]));
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

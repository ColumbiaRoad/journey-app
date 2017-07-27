
const pgp = require('pg-promise')();
const db = pgp(process.env.DATABASE_URL);
const shopModel = require('./shops');

/**
 * Saves to db
 * @param  {[string]} shop_name
 * @param  {[string]} question  Like "do you want women or mens bike?"
 * @param  {[array]} answers   Array containing objects like {answer: '', variant: {}}
 * @return {[promise]}
 */
const saveQuestionAndAnswers = (shop_name, question, answers) => {
  return shopModel.getShop(shop_name).then((shop) => {
    return db.query('INSERT INTO questions(question, shop_id) '+
      'VALUES($1, $2) RETURNING question_id;', [question, shop[0].shop_id]);
  }).then((added_question) => {
    const question_id = added_question[0].question_id;
    let query = 'INSERT INTO answers(question_id, answer, variant) VALUES ';
    const params = [question_id];
    answers.forEach((answer, i) => {
      const answerId = 2 * (i + 1);
      const variantId = answerId + 1;
      const lastIndex = i == answers.length - 1;
      const firstIndex = i == 0;
      query += `${(firstIndex) ? '' : ','}($1,$${answerId},$${variantId})${(lastIndex) ? ';' : ''}`;
      params.push(answer.answer);
      params.push(answer.variant);
    });
    return db.query(query, params);
  });
};

const getAllQuestionsAndAnswers = (shop_url) => {
  return shopModel.getShop(shop_url).then((shop) => {
    const query = 'SELECT * FROM answers INNER JOIN questions USING (question_id) ' +
      'INNER JOIN shops USING (shop_id) WHERE shop_url LIKE $1;';
    return db.query(query, [shop_url]);
  });
};

module.exports = {
  saveQuestionAndAnswers, getAllQuestionsAndAnswers
};

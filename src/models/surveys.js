
const pgp = require('pg-promise')();
const db = pgp(process.env.DATABASE_URL);
const shopModel = require('./shops');

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
//'INSERT INTO answers(question_id, answer, variant) VALUES ($1, $2, $3);',
module.exports = {
  saveQuestionAndAnswers
};

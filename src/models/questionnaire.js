const _ = require('lodash');
const winston = require('winston');
const db = require('./db').getDBInstance();
const shopModel = require('./shop');

/**
 * Creates empty questionnaire.
 * @param  {string} shopUrl
 * @return {promise}
 */
function createQuestionnaire(shopUrl) {
  return new Promise((resolve, reject) => {
    db.one('INSERT INTO questionnaire(shop) VALUES($1) RETURNING questionnaire_id;', shopUrl)
    .then((result) => {
      resolve({ questionnaireId: result.questionnaire_id });
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to create questionnaire' });
    });
  });
};

/**
 * Saves complete questionnaire. Returns object for questionnaire ID, as well as
 * each saved question, excluding the root question.
 * @param  {string} questionnaireId
 * @param  {object} questionnnaire
 * @return {promise}
 */
function saveQuestionnaire(questionnaireId, questionnaire) {
  return new Promise((resolve, reject) => {
    db.task(t => {
      return saveQuestionAndAnswers(questionnaireId, undefined, questionnaire.rootQuestion.question,
        undefined, questionnaire.rootQuestion.answerMapping, t)
      .then((result) => {
        return t.none('UPDATE questionnaire SET root_question_id = $1 WHERE questionnaire_id = $2;',
          [result.questionId, questionnaireId]);
      })
      .then(() => {
        return questionnaire.selectedProducts.map((product) => {
          return product.questions.map((questionItem) => {
            return saveQuestionAndAnswers(questionnaireId, product.productId, questionItem.question,
              questionItem.option, questionItem.answerMapping, t);
          });
        });
      });
    })
    .then((data) => {
      const flat = [].concat.apply([], data);
      flat.push(new Promise((resolve) => {resolve({ questionnaireId })}));
      resolve(Promise.all(flat));
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to save questionnaire' });
    });
  });
}

/**
 * Saves single question object including its answers. Pass pg-promise task if
 * called withing a batch operation
 * @param  {string} questionnaireId
 * @param  {string} productId
 * @param  {string} question  Like "do you want women or mens bike?"
 * @param  {string} optionId
 * @param  {[object]} answerMapping   Array containing objects like {id: '', answer: '', value: ''}
 * @param  {task} task task from pg-promise library
 * @return {promise}
 */
function saveQuestionAndAnswers(questionnaireId, productId, question, optionId, answerMapping, task=db) {
  return new Promise((resolve, reject) => {
    task.task(t => {
      return t.one('INSERT INTO question(question, product_id, option_id, questionnaire_id) '+
          'VALUES($1, $2, $3, $4) RETURNING question_id;',
          [question, productId, optionId, questionnaireId])
      .then((addedQuestion) => {
        const questionId = addedQuestion.question_id;
        return t.tx(transaction => {
          return transaction.batch(answerMapping.map((mapping) => {
              return (
                transaction.one(
                  'INSERT INTO answer(answer, property_value, answer_row_id, question_id) VALUES ($1, $2, $3, $4) RETURNING question_id;',
                [mapping.answer, mapping.value, mapping.id, questionId])
              );
          }));
        });
      });
    })
    .then((result) => {
      resolve({ questionId: result[0].question_id, savedAnswers: result.length });
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to save question with answers' });
    });
  });
};

/**
 * Retrieves questionnaire object. If successful, questionnaire is returned in the same
 * format as it is saved.
 * @param  {string} questionnaireId
 * @return {promise}
 */
function getQuestionnaire(questionnaireId) {
  const query = 'SELECT * FROM questionnaire INNER JOIN question USING (questionnaire_id) ' +
    'INNER JOIN answer USING (question_id) WHERE questionnaire_id = $1;';
  return new Promise((resolve, reject) => {
    results = db.any(query, questionnaireId)
    .then((result) => {
      const rootQuestion = result.filter(e => e.question_id === e.root_question_id);
      const products = _.groupBy(result.filter(e => e.question_id !== e.root_question_id),
        (e) => { return e.product_id });
      const questionnaire = {};

      questionnaire.rootQuestion = {
        question: rootQuestion[0] ? rootQuestion[0].question : '',
        answerMapping: rootQuestion.map((e) => {
          return {
            id: e.answer_row_id,
            answer: e.answer,
            value: e.property_value
          }
        })
      };
      questionnaire.selectedProducts = Object.keys(products).map((key) => {
        const questions = _.groupBy(products[key], e => e.option_id);
        return {
          productId: key,
          questions: Object.keys(questions).map((qKey) => {
            return {
              option: questions[qKey][0].option_id,
              question: questions[qKey][0].question,
              answerMapping: questions[qKey].map((e) => {
                return {
                  id: e.answer_row_id,
                  answer: e.answer,
                  value: e.property_value
                };
              })
            };
          })
        };
      });
      resolve(questionnaire);
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to retrieve questionnaire' });
    });
  });
}

/**
 * Retrieves IDs of all questionnaires of a shop. 
 * @param  {string} shopUrl
 * @return {[promise]}
 */
function getAllQuestionnaires(shopUrl) {
  const query = 'SELECT * FROM questionnaire INNER JOIN shop ON questionnaire.shop = shop.shop_url ' +
    'WHERE shop_url = $1;';
  return new Promise((resolve, reject) => {
    db.any(query, shopUrl)
    .then((result) => {
      resolve(result);
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to get questionnaires' });
    });
  });
};

/**
 * Updates existing questionnaire. Deletes all question as well as answer mappings including
 * root question and saves updated questions as new ones.
 * @param  {string} questionnaireId
 * @param  {object} updatedQuestionnaire
 * @return {[promise]}
 */
function updateQuestionnaire(questionnaireId, updatedQuestionnaire) {
  return new Promise((resolve, reject) => {
    db.tx(transaction => {
      const q1 = transaction.none('UPDATE questionnaire SET root_question_id = null WHERE questionnaire_id = $1;', questionnaireId);
      const q2 = transaction.none('DELETE from question WHERE questionnaire_id = $1', questionnaireId);
      return transaction.batch([q1, q2]);
    })
    .then(() => {
      return saveQuestionnaire(questionnaireId, updatedQuestionnaire);
    })
    .then((result) => {
      resolve(result);
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to update questionnaire' });
    });
  });
}

/**
 * Deletes questionnaire. Returns ID of deleted questionnaire or -1 if nothing was deleted.
 * @param  {string} questionnaireId
 * @return {promise}
 */
function deleteQuestionnaire(questionnaireId) {
  const query = 'DELETE from questionnaire WHERE questionnaire_id = $1 RETURNING questionnaire_id;';
  return new Promise((resolve, reject) => {
    db.oneOrNone(query, questionnaireId)
    .then((result) => {
      resolve({ questionnaireId: result ? result.questionnaire_id : -1 });
    })
    .catch((err) => {
      winston.error(err);
      reject({ error: 'unable to delete questionnaire' });
    });
  });
}

module.exports = {
  createQuestionnaire,
  saveQuestionnaire,
  saveQuestionAndAnswers,
  getQuestionnaire,
  getAllQuestionnaires,
  updateQuestionnaire,
  deleteQuestionnaire
};


//this wont work if local db set up is not done
require('dotenv').config()

const assert = require('assert');
const shopModel = require('../src/models/shop');
const questionnaireModel = require('../src/models/questionnaire');
const winston = require('winston'); // LOGGING

describe('DB shops table /', function() {
  it('can insert question and answer', function(done) {
    const dbname = 'test2';
    shopModel.saveShop(dbname, 'testshop').then((params) => {
      return questionnaireModel.saveQuestionAndAnswers(
        dbname, 'will this work?', 'rowID', 'prod id', [{answer:'yes!', mapping:'val'}]
      );
    }).then((response) => {
      return shopModel.getShop(dbname);
    }).then((shops) => {
      assert(shops[0]['access_token'] === 'testshop');
      return shopModel.deleteShop(dbname);
    }).then((response) => {
      done();
    }).catch((err) => {
      winston.error(err);
    });
  });

  it('can insert and get question and multiple answers', function(done) {
    const dbname = 'test3';
    const answerList = [{answer:'yes!', mapping:'sasd'}, {answer: "oui!", mapping:'vval'}];
    shopModel.saveShop(dbname, 'testshop').then((params) => {
      return questionnaireModel.saveQuestionAndAnswers(
        dbname, 'this will work!', 'rowID', 'prod id', answerList
      );
    }).then((response) => {
      return questionnaireModel.getAllQuestionsAndAnswers(dbname);
    }).then((rows) => {
      assert(rows.length > 1);
      assert(
        (rows[0].answer === answerList[0].answer) || (rows[0].answer === answerList[1].answer)
      );
      return shopModel.getShop(dbname);
    }).then((shops) => {
      assert(shops[0]['access_token'] === 'testshop');
      return shopModel.deleteShop(dbname);
    }).then((response) => {
      done();
    });
  });
});

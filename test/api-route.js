require('dotenv').config();
const request = require('supertest');
const expect = require('expect.js');
const express = require('../src/config/express');
const app = express();
const getJWTToken = require('../src/helpers/utils').getJWTToken;
const scopes = require('../src/helpers/utils').scopes;
const shopModel = require('../src/models/shop');
const questionnaireModel = require('../src/models/questionnaire');

describe('route /api/v1/products', function() {
  let validToken;
  let invalidToken;
  let appToken;
  let shopName;
  let questionnaire;
  let questionnaireId;

  before(function(done) {
    questionnaire = {
      rootQuestion: {
        question: 'What are you looking for?',
        answerMapping: [
          { id: 'j6ew2kx6', answer: 'This!', value: '11152891412' },
          { id: 'j6ew2kz9', answer: 'That!', value: '11152897108' }
        ]
      },
      selectedProducts: [
        {
          productId: 11152897108,
          questions: [
            {
              option: 'Title',
              question: 'Are you mainstream?',
              answerMapping: [
                { id: 'j6ew3la5', answer: 'Yes', value: 'Default Title' },
                { id: 'j6ew3lk1', answer: 'No', value: 'Default Title' }
              ]
            }
          ]
        }, {
          productId: 11152891412,
          questions: [
            {
              option: 'Size',
              question: 'What fit do you prefer?',
              answerMapping: [
                { id: 'j6ew4mo1', answer: 'Loose fit', value: '42' },
                { id: 'j6ew4my8', answer: 'Regular fit', value: '40' },
                { id: 'j6ew4qs4', answer: 'Tight fit', value: '39' }
              ]
            }, {
              option: 'Color',
              question: 'Do you like to be recognized?',
              answerMapping: [
                { id: 'j6ew5cl2', answer: 'YES!', value: 'yellow' },
                { id: 'j6ew5cu6', answer: 'no', value: 'green' }
              ]
            }
          ]
        }
      ]
    };
    shopName = 'api-route-test.myshopify.com';
    validToken = getJWTToken(shopName, scopes.api);
    invalidToken = 'foobar';
    appToken = getJWTToken(shopName, 'test');
    shopModel.saveShop(shopName, 'testToken')
    .then(function(result) {
      return questionnaireModel.createQuestionnaire(shopName)
    })
    .then(function(result) {
      questionnaireId = result.questionnaireId;
      return questionnaireModel.saveQuestionnaire(questionnaireId, questionnaire)
    })
    .then(function(result) {
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  after(function(done) {
    shopModel.deleteShop(shopName)
    .then(() => {
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('access granted to API with valid token', function(done) {
    request(app)
      .get(`/api/v1/questionnaire/${questionnaireId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('access denied to API with invalid token', function(done) {
    request(app)
    .get(`/api/v1/questionnaire/${questionnaireId}`)
    .set('Authorization', `Bearer ${invalidToken}`)
    .expect(401)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('access denied to API with valid token with application proxy token', function(done) {
    request(app)
    .get(`/api/v1/questionnaire/${questionnaireId}`)
    .set('Authorization', `Bearer ${appToken}`)
    .expect(403)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});
require('dotenv').config();
const request = require('supertest');
const expect = require('expect.js');
const crypto = require('crypto');
const express = require('../src/config/express');
const app = express();
const shopModel = require('../src/models/shop');
const questionnaireModel = require('../src/models/questionnaire');
const getJWTToken = require('../src/helpers/utils').getJWTToken;
const scopes = require('../src/helpers/utils').scopes;

describe('route /app', function() {
  let shopName;
  let validToken;
  let invalidToken;
  let apiToken;
  let questionnaireId;

  before(function(done) {
    shopName = 'journeyAssistantRouteTest';
    validToken = getJWTToken(shopName, scopes.app);
    invalidToken = 'test';
    apiToken = getJWTToken(shopName, scopes.api);
    const questionnaire = {
      rootQuestion: {
        question: 'What are you looking for?',
        answerMapping: [
          { id: 'j6ew2kx6', answer: 'This!', value: '11152897108' },
          { id: 'j6ew2kz9', answer: 'That!', value: '11152891412' }
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
                { id: 'j6ew3lk1', answer: 'No', value: 'Custom Title' }
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
    shopModel.saveShop(shopName, 'someAccessToken')
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
    .then(function(result) {
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('GET /app', function(done) {
    const params = {
      shop: shopName,
      path_prefix: '/apps/findmybike',
      timestamp: new Date().getTime()
    }
    const pairs = Object.keys(params).sort().map((k) => {
      return `${k}=${params[k]}`;
    });
    const digest = crypto.createHmac('sha256', process.env.SHOPIFY_APP_SECRET)
    .update(pairs.join(''))
    .digest('hex');
    const url = `/app?shop=${params.shop}&path_prefix=${params.path_prefix}&timestamp=${params.timestamp}&signature=${digest}`;
    request(app)
      .get(url)
      .expect(200)
      .expect('content-type', 'application/liquid; charset=utf-8')
      .end(function(err, res) {
        if(err) return done(err);
        done();
      });
  });

  it('access granted with valid token', function(done) {
    const url = `/app/${questionnaireId}?productId=1234&token=${validToken}`;
    request(app)
    .get(url)
    .set('Authorization', `Bearer ${validToken}`)
    .expect(404) // Expect 404 because we're accessing Shopify
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('access denied with invalid token', function(done) {
    const url = `/app/${questionnaireId}?productId=1234&token=${invalidToken}`;
    request(app)
    .get(url)
    .set('Authorization', `Bearer ${validToken}`)
    .expect(401)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });

  it('access denied with API token', function(done) {
    const url = `/app/${questionnaireId}?productId=1234&token=${apiToken}`;
    request(app)
    .get(url)
    .set('Authorization', `Bearer ${validToken}`)
    .expect(403)
    .end(function(err, res) {
      if (err) return done(err);
      done();
    });
  });
});
require('dotenv').config();
const request = require('supertest');
const expect = require('expect.js');
const db = require('../src/models/db').getDBInstance();
const express = require('../src/config/express');
const app = express();
const getJWTToken = require('../src/helpers/utils').getJWTToken;
const scopes = require('../src/helpers/utils').scopes;
const shopModel = require('../src/models/shop');
const questionnaireModel = require('../src/models/questionnaire');

describe('route /api/v1/questionnaire', function() {
  let shopName;
  let questionnaire;
  let token;
  let questionnaireId;
  before(function(done) {
    shopName = 'questionnaire-route-test.myshopify.com';
    token = getJWTToken(shopName, scopes.api);    
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
    db.none('DELETE FROM shop WHERE shop_url = $1;', shopName)
    .then(function(result) {
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  describe('POST /api/v1/questionnaire', function() {
    it('save valid questionnaire', function(done) {
      request(app)
        .post('/api/v1/questionnaire')
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionnaire: questionnaire
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });
  });

  describe('GET /api/v1/questionnaire/:id', function() {
    it('get existing questionnaire', function(done) {
      request(app)
        .get(`/api/v1/questionnaire/${questionnaireId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.status).to.be('ok');
          expect(res.body.questionnaire).to.eql(questionnaire);
          done();
        });
    });
  });

  describe('DELETE /api/v1/questionnaire/:id', function() {
    it('delete existing questionnaire', function(done) {
      request(app)
        .delete(`/api/v1/questionnaire/${questionnaireId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body.status).to.be('ok');
          done();
        });
    });
  });
  describe('GET /api/v1/shop/questionnaire', function() {
    it('get questionnaire for existing shop', function(done) {
      request(app)
      .get(`/api/v1/shop/questionnaire`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end(function(err, res) {
        if(err) return done(err);
        expect(res.body.questionnaire).to.eql(questionnaire);
        done();
      });
    });
  });
});

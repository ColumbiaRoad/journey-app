
require('dotenv').config();

const request = require('supertest');
const express = require('../src/config/express');
const app = express();
const assert = require('assert');
const jwt = require('jsonwebtoken');

const shopModel = require('../src/models/shops');

function getJWTToken(shop) {
  const payload = {
    shop: shop
  };
  return jwt.sign(payload, process.env.SHOPIFY_APP_SECRET, { expiresIn: '3h' });
}

describe('POST /api/v1/survey-model', function() {
  it('Can save survey via api', (done) => {
    const bodyJson = {
      questions: [
          {
            question: 'big or small?',
            productId: 'id',
            questionRowId: 'sdsds',
            answers: [
              {
                answer: 'big',
                mapping: 'valueeee'
              }
            ]
        }
      ]
    };
    const token = getJWTToken('testishoppi');
    request(app)
      .post('/api/v1/survey-model')
      .set('Authorization', `Bearer ${token}`)
      .send(bodyJson)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});


require('dotenv').config();

const request = require('supertest');
const express = require('../src/config/express');
const app = express();
const assert = require('assert');
const jwt = require('jsonwebtoken');

const shopModel = require('../src/models/shop');

function getJWTToken(shop) {
  const payload = {
    shop: shop
  };
  return jwt.sign(payload, process.env.SHOPIFY_APP_SECRET, { expiresIn: '3h' });
}

describe('POST /api/v1/questionnaire', function() {
  it('Can save survey via api', (done) => {
    const bodyJson = {
      productId: 'id',      
      questions: [
        {
          question: 'big or small?',
          optionId: 'asdf',
          answerMapping: [
            {
              id: 'foobar',
              answer: 'big',
              value: 'valueeee'
            }
          ]
        }
      ]
    };
    const token = getJWTToken('testshop');
    request(app)
      .post('/api/v1/questionnaire')
      .set('Authorization', `Bearer ${token}`)
      .send(bodyJson)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});


require('dotenv').config();

const request = require('supertest');
const express = require('../src/config/express');
const app = express();
const assert = require('assert');

describe('POST /api/v1/survey_model', function() {
  it('Can save survey via api', (done) => {
    const bodyJson = {
      questions: [
          {
            question: 'big or small?',
            answers: [
              {
                answer: 'big',
                variant: {random: 'this object can be everything'}
              }
            ]
        }
      ]
    };
    request(app)
      .post('/api/v1/survey_model')
      .send(bodyJson)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});

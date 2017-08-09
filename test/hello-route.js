
require('dotenv').config();

const request = require('supertest');
const express = require('../src/config/express');
const app = express();
const assert = require('assert');

/*
describe('GET /', function() {
  it('Contains hello', function(done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(function(res) {
        assert(res.text.indexOf('Hello') !== -1, true)
      })
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
});
*/

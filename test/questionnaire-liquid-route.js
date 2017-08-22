require('dotenv').config();
const request = require('supertest');
const expect = require('expect.js');
const crypto = require('crypto');
const encodeUrl = require('encodeurl');
const express = require('../src/config/express');
const app = express();

describe('route /questionnaire', function() {
  it('get liquid file', function(done) {
    const params = {
      shop: 'testshop.myshopify.com',
      path_prefix: '/apps/findmybike',
      timestamp: new Date().getTime()
    }
    const pairs = Object.keys(params).sort().map((k) => {
      return `${k}=${params[k]}`;
    });
    console.log(pairs.join('&'));
    const digest = crypto.createHmac('sha256', process.env.SHOPIFY_APP_SECRET)
    .update(pairs.join(''))
    .digest('hex');
    const url = encodeUrl(`/questionnaire?shop=${params.shop}&path_prefix=${params.path_prefix}&hmac=${params.timestamp}&signature=${digest}`);
    request(app)
      .get(url)
      .expect(200)
      .expect('content-type', 'application/liquid')
      .end(function(err, res) {
        if(err) return done(err);
        done();
      });
  });
});
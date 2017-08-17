//this wont work if local db set up is not done
require('dotenv').config()
const db = require('../src/models/db').getDBInstance();
const expect = require('expect.js');
const shopModel = require('../src/models/shop');

describe('shop model', function() {
  let shopName;
  let token;

  before(function() {
    shopName = 'shopModelTest';
    token = 'someAccessToken';
  });

  it('save new shop', function(done) {
    shopModel.saveShop(shopName, token)
    .then(function(result) {
      expect(result).to.be(null);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('get existing shop', function(done) {
    shopModel.getShop(shopName)
    .then(function(shop) {
      expect(shop.shop_url).to.be(shopName);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('get non-exsiting shop', function(done) {
    shopModel.getShop('foo')
    .then(function(shop) {
      expect(shop).not.to.be.ok();
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('update access token', function(done) {
    shopModel.saveShop(shopName, 'newToken')
    .then(function(result) {
      return shopModel.getShop(shopName);
    })
    .then(function(shop) {
      expect(shop.access_token).not.to.be(token);
      expect(shop.access_token).to.be('newToken');
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('delete shop', function(done) {
    shopModel.deleteShop(shopName)
    .then(function(result) {
      return shopModel.getShop(shopName);
    })
    .then(function(shop) {
      expect(shop).to.be(null);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });
});

//this wont work if local db set up is not done
require('dotenv').config()
const db = require('../src/models/db').getDBInstance();
const expect = require('expect.js');
const shopModel = require('../src/models/shop');

describe('shop model', function() {
  let shopName;
  let token;

  before(function() {
    // Clear table before starting
    shopName = 'testShop';
    token = 'someAccessToken';
  });

  it('save new shop', function() {
    return shopModel.saveShop(shopName, token)
    .then(function(result) {
      expect(result).to.be(undefined);
    });
  });

  it('get existing shop', function() {
    return shopModel.getShop(shopName)
    .then(function(shop) {
      expect(shop.shop_url).to.be(shopName);
    });
  });

  it('get non-exsiting shop', function() {
    return shopModel.getShop('foo')
    .then(function(shop) {
      expect(shop).to.be(null);
    });
  });

  it('update access token', function() {
    return shopModel.saveShop(shopName, 'newToken')
    .then(function(result) {
      return shopModel.getShop(shopName);
    })
    .then(function(shop) {
      expect(shop.access_token).not.to.be(token);
      expect(shop.access_token).to.be('newToken');
    });
  });

  it('delete shop', function() {
    return shopModel.deleteShop(shopName)
    .then(function(result) {
      expect(result).to.be(undefined);
      return shopModel.getShop(shopName);
    })
    .then(function(shop) {
      expect(shop).to.be(null);
    });
  });
});

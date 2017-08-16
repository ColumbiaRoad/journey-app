
//this wont work if local db set up is not done
require('dotenv').config()

const assert = require('assert');
const shopModel = require('../src/models/shop');

describe('DB shops table /', function() {
  it('can insert', function(done) {
    const dbname = 'testi';
    shopModel.saveShop(dbname, 'pesti').then((params) => {
      return shopModel.getShop(dbname);
    }).then((shops) => {
      assert(shops[0]['access_token'] === 'pesti');
      return shopModel.deleteShop(dbname);
    }).then((response) => {
      done();
    });
  });
});

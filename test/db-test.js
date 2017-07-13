
//this wont work if local db set up is not done
require('dotenv').config()

const assert = require('assert');
const shopModel = require('../src/models/shops');

describe('DB shops table /', function() {
  it('can insert', function(done) {
    shopModel.saveShop('testi', 'pesti').then((params) => {
      //delete it now
      done();
    });
  });
});

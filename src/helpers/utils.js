const util = require('util');

const validationError = (res, result) => {
  const message = 'There have been validation errors: ' + util.inspect(result.array());
  return res.status(400).send(message);
};

//https://stackoverflow.com/questions/14446511/what-is-the-most-efficient-method-to-groupby-on-a-javascript-array-of-objects
const groupBy = (xs, key) => {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};


module.exports = {
  validationError, groupBy
};

const util = require('util');

const validationError = (res, result) => {
  const message = 'There have been validation errors: ' + util.inspect(result.array());
  return res.status(400).send(message);
};

module.exports = {
  validationError
};

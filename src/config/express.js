
const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');

module.exports = function() {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json());
  app.use(expressValidator({
    customValidators: {
        checkHmac: require('../helpers/hmacChecker').checkHmac
    }
  }));

  // IMPORT ROUTES HERE
  require('../routes/hello')(app);
  require('../routes/authentication')(app);

  return app;
};

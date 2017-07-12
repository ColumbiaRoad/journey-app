
const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');

module.exports = function() {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json());
  app.use(expressValidator());

  // IMPORT ROUTES HERE
  require('../routes/hello')(app);
  require('../routes/authentication')(app);
  require('../routes/api.js');

  return app;
};

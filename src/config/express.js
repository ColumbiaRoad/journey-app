
module.exports = function() {
  const express = require('express');
  const app = express();

  const bodyParser = require('body-parser');

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json());

  // IMPORT ROUTES HERE
  require('../routes/hello')(app);

  return app;
};


const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const jwt = require('express-jwt');

module.exports = function() {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json());
  app.use(expressValidator());
  const jwtConfig = {
    secret: process.env.SHOPIFY_APP_SECRET,
    requestProperty: 'auth'
  };
  // Require JWT token for all paths but the ones starting with /auth/
  app.use(jwt(jwtConfig).unless({path: [/^\/auth\//]}));
  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json('Invalid token');
    }
  });

  // IMPORT ROUTES HERE
  require('../routes/hello')(app);
  require('../routes/authentication')(app);
  require('../routes/api.js')(app);

  return app;
};

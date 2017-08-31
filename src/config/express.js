
const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const jwt = require('express-jwt');

const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.ACCESS_CONTROL_ALLOW_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    next();
};

module.exports = function() {
  const app = express();
  // Custom Middleware to compute rawBody
  app.use(function(req, res, next){
    req.rawBody = '';
    req.on('data', function(chunk){
        req.rawBody += chunk;
    });
    next();
  });
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(expressValidator());

  app.use(allowCrossDomain);
  const jwtConfig = {
    secret: process.env.SHOPIFY_APP_SECRET,
    requestProperty: 'auth'
  };
  // Require JWT token for all paths but the ones starting with /auth/
  app.use(jwt(jwtConfig).unless({path: [/^\/auth\//, /^\/journey-assistant/]}));
  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json('Invalid token');
    }
  });


  // IMPORT ROUTES HERE
  require('../routes/authentication')(app);
  require('../routes/api.js')(app);
  require('../routes/journey-assistant.js')(app);

  return app;
};

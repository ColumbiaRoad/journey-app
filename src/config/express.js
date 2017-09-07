
const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const jwt = require('express-jwt');
const cors = require('cors');
const scopes = require('../helpers/utils').scopes;

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

  const corsConfig = {
    origin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN
  };
  app.use(cors(corsConfig));
  const jwtConfig = {
    secret: process.env.SHOPIFY_APP_SECRET,
    requestProperty: 'auth'
  };

  const guard = require('express-jwt-permissions')({
    requestProperty: 'auth',
    permissionsProperty: 'scope'
  });

  // Require JWT token for all paths but the ones starting with /auth/ or /app
  app.use(jwt(jwtConfig).unless({path: [/^\/auth\//, /^\/app/]}));
  // Require API right to access api
  app.use('/api/', guard.check(scopes.api));
  app.options('/api/', cors(corsConfig));
  app.use(function (err, req, res, next) {
    if (err.code === 'invalid_token') {
      res.status(401).send('Invalid token');
    } else if (err.code === 'permission_denied') {
      res.status(403).send('Insufficient Permissions');
    }
  });


  // IMPORT ROUTES HERE
  require('../routes/authentication')(app);
  require('../routes/api.js')(app);
  require('../routes/app.js')(app);

  return app;
};


# journey-assistant-api

Serves as backend/api for our Journey Assistant Shopify app.

## Routes

### `/auth/`
Meant as main entry point for Shopify. Endpoints expect certain parameters, as documented by Shopify, to be present, absence of said parameters will cause validation errors. Furthermore, signatures are checked.

### `/api/v1/`
Main entry point for the frontend application. Each request made to this endpoint must provide a JSON Web Token, absence of said token will cause `401`. The token needed to succesfully access any of the endpoints is generated during the authentication process which is initiated by Shopify. Each token is valid for 3 hours (a Shopify page refresh reinitiate the authentication process and thus generate a new token) and has the following form:
```js
{
  shop: shopUrl // Example: columbiaroad.myshopify.com
}
```

### `/journey-assistant/`
Meant as entry for Shopify when accessing our application proxy. Like every endpoint that is directly accessed by Shopify, the general endpoint `/journey-assistant/` expects certain parameters to be present and validates the provided signature. The second endpoint `/journey-assistant/:questionnaire` is accessed by the HTML code that was served by our applicaiton proxy and expects a JSON Web Token to be present. The token is of the same form as before.

## Configured scripts
* `npm start` start server
* `npm test` run all tests in /test/

## Environment variables
* DATABASE_URL: URL pointing to your ProstgreSQL database
* REDIS_URL: URL pointing to your Redis slave
* SHOPIFY_SCOPES: [scopes](https://help.shopify.com/api/getting-started/authentication/oauth#scopes) that will be requested by our application during the installation. Defines access rights of our application. Currently, only `read_products` is necessary
* SHOPIFY_API_KEY: API key of your app's [credentials](https://help.shopify.com/api/getting-started/authentication/oauth#step-1-get-the-clients-credentials)
* SHOPIFY_API_SECRET: Secret of your app's [credentials](https://help.shopify.com/api/getting-started/authentication/oauth#step-1-get-the-clients-credentials)
* BASE_URL: URL where this application is hosted, including protocol. **No trailing `/`!**
* ADMIN_PANEL_URL: URL where your frontend application is hosted, including protocol. **No trailing `/`!**
* ACCESS_CONTROL_ALLOW_ORIGIN: Needed for [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS), should be either identical to `ADMIN_PANEL_URL` or `*`

## Local setup

* Setup PostgreSQL database
* Setup Redis slave
* Create `.env` file according to `.env-template`
* Run migrations to setup database tables:
`./node_modules/node-pg-migrate/bin/pg-migrate up`

## Heroku setup

* Install free Redis and Postres add-ons for your dyno
* Configure environment varibales according to `.env-template`
* Run migrations to setup database tables:
`./node_modules/node-pg-migrate/bin/pg-migrate up`

## Create new migrations

Inside your project folder, run: 
`./node_modules/node-pg-migrate/bin/pg-migrate create migration_name.js`

Check https://github.com/theoephraim/node-pg-migrate for more.

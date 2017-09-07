
# journey-app

Serves as backend/api for our Journey Assistant Shopify app.

## Routes

#### `/auth/`
Meant as main entry point for Shopify. Endpoints expect certain parameters, [as documented by Shopify](https://help.shopify.com/api/getting-started/authentication/oauth), to be present, absence of said parameters will cause validation errors. Furthermore, signatures are checked.

#### `/api/v1/`
Main entry point for the frontend application. Each request made to this endpoint must provide a JSON Web Token, absence of said token will cause `401`. Furthermore, the token has to have the correct access rights, namely `scope: api`, or `403` is returned. The token needed to succesfully access any of the endpoints is generated during the authentication process which is initiated by Shopify. Each token is valid for 3 hours (a Shopify page refresh reinitiates the authentication process and thus generates a fresh token) and has the following form:
```js
{
  shop: shopUrl // Example: columbiaroad.myshopify.com
  scope: accessScope // Example: api
}
```

#### `/app/`
Meant as entry point for Shopify when accessing our application proxy. Like every endpoint that is directly accessed by Shopify, the general endpoint `/app/` expects [certain parameters](https://help.shopify.com/api/tutorials/application-proxies#security) to be present and validates the provided signature. The second endpoint `/app/:questionnaire` is accessed by the HTML code that was served by our application proxy and expects a JSON Web Token to be present. The token is of the same form as before. The necessary access right to succesfully access this endpoint is `scope: application-proxy`.

## Scopes
Where possible (i.e. not direclty accessed by Shopify) routes are protected by JWT tokens. To ensure shop visitors cannot steal a token from the questionnaire form and access confidential store data, scopes are used for tokens to introduce different access rights. The following scopes exist:
* `api`: grants access to API routes, thus access to database data as well as Shopify data
* `application-proxy`: grants access to `/app/:questionnaireId` route which is needed for the application proxy

## Configured scripts
* `npm start` start server
* `npm test` run all tests in `test/`

## Environment variables
* DATABASE_URL: URL pointing to your ProstgreSQL database
* REDIS_URL: URL pointing to your Redis slave
* SHOPIFY_SCOPES: [scopes](https://help.shopify.com/api/getting-started/authentication/oauth#scopes) that will be requested by our application during the installation. Defines access rights of our application. Currently, only `read_products` is necessary
* SHOPIFY_API_KEY: API key of your app's [credentials](https://help.shopify.com/api/getting-started/authentication/oauth#step-1-get-the-clients-credentials)
* SHOPIFY_API_SECRET: Secret of your app's [credentials](https://help.shopify.com/api/getting-started/authentication/oauth#step-1-get-the-clients-credentials)
* BASE_URL: URL where this application is hosted, including protocol. **No trailing `/`!**
* ADMIN_PANEL_URL: URL where your frontend application is hosted, including protocol. **No trailing `/`!**
* ACCESS_CONTROL_ALLOW_ORIGIN: Needed for [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS), should be either identical to `ADMIN_PANEL_URL` or `true`, more info [here](https://www.npmjs.com/package/cors#configuration-options)

## Local setup
* Run `npm install` to install dependencies
* Setup PostgreSQL database
* Setup Redis slave
* Create `.env` file according to `.env-template`
* Run migrations to setup database tables:
`./node_modules/node-pg-migrate/bin/pg-migrate up`

## Heroku setup
* Create app on Heroku: `heroku create $APP_NAME --region eu`
* Install free Redis and Postres add-ons for your app
* Configure environment varibales according to `.env-template`
* Add Node.js buildpack
* Deploy code to Heroku: `git push heroku`
* Run migrations to setup database tables:
`./node_modules/node-pg-migrate/bin/pg-migrate up`

## Create new migrations

Inside your project folder, run: 
`./node_modules/node-pg-migrate/bin/pg-migrate create migration_name`

Check https://github.com/theoephraim/node-pg-migrate for more.

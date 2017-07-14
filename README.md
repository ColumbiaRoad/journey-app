
### journey-assistant-api

Run
``` npm start ```

To run tests
``` npm test ```

# local setup db

Create new Postgresql database and update ``` DATABASE_URL ``` with your credentials.
Then run all migrations to db by
``` ./node_modules/node-pg-migrate/bin/pg-migrate up```

# heroku setup

Create new dyno and add all env variables specified in .env-template to heroku.
Add free redis and postgres add-ons to new dyno.
Run ```heroku run ./node_modules/node-pg-migrate/bin/pg-migrate up```.

# Create new migration

``` ./node_modules/node-pg-migrate/bin/pg-migrate create create_shop_table.js ```
Check https://github.com/theoephraim/node-pg-migrate for more.

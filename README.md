
### journey-assistant-api

Run
``` npm start ```

To run tests
``` npm test ```

# local setup db

Create new Postgresql database and update ``` DATABASE_URL ``` with your credentials.
Then run all migrations to db.

Create new migration
``` ./node_modules/node-pg-migrate/bin/pg-migrate create create_shop_table.js ```
Check https://github.com/theoephraim/node-pg-migrate for more.

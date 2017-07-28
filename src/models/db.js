
const pgp = require('pg-promise')();

let db = undefined;

const getDBInstance = () => {
  if (db === undefined) {
    db = pgp(process.env.DATABASE_URL);
  }
  return db;
};

module.exports = {
  getDBInstance,
}

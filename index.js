
require('dotenv').config()

const express = require('./src/config/express.js');
const app = express();

const port = process.env.PORT || 9000;
app.listen(port, function () {
  console.log(`app listening on port ${port}!`);
})

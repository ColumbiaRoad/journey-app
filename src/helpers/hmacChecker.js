const crypto = require('crypto');

const formatKey = (str) => {
  return str.replace('&', '%26').replace('%','%25')
};

const formatValue = (str) => {
    return formatKey(str).replace('=','%3D');
};

/*
* More info in https://help.shopify.com/api/getting-started/authentication/oauth
*/
const checkHmac = (hmac, req) => {
  const formedMessage = Object.keys(req.query).sort().reduce((message, key) => {
    return (key !== 'hmac') ?
      `${message}${formatKey(key)}=${formatValue(req.query[key])}&` : message;
  }, '');
  const message = formedMessage.substring(0, formedMessage.length - 1);
  const hash = crypto.createHmac('sha256', process.env.SHOPIFY_APP_SECRET)
                   .update(message)
                   .digest('hex');
  return hmac === hash;
};

module.exports = {
  checkHmac
}

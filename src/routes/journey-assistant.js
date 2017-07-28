
module.exports = function(app) {
  app.get('/journey-assistant', function(req, res) {
    return res.send('This should be either liquid or something that looks good to end user.');
  });
}

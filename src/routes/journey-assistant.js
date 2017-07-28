
module.exports = function(app) {
  app.get('/journey-assistant', function(req, res) {
    const liquid = '<p> Your stores cart has {{ cart.item_count }} items. </p>';

    res.setHeader('Content-Type:', 'application/liquid'); // Let's tell shopify that liquid is coming!
    return res.send(liquid);
  });
}


module.exports = function(app) {

  // REPLACE THIS BY DB CONNECTION
  const getModel = (shop_url) => {
    return {
        rows:[{
            answer: 'big',
            variant: {"random":"this object can be everything"},
            question: 'big or small?',
            shop_url:'salashoppi',
            access_token:'access_token'
        }]
      };
  };

  const formatOneQuestion = (question_row) => {
    return '<div>' +
            '<p>' + question_row.question + '</p>' +
            '<p>' + question_row.answer +
           '</div>';
  };

  app.get('/journey-assistant', function(req, res) {
    const shop_url = req.body.shop_url;
    const model = getModel(shop_url);
    let liquidHTML = '';
    model.rows.forEach((question_row) => {
      liquidHTML += formatOneQuestion(question_row);
    });

    res.setHeader('content-type', 'application/liquid'); // Let's tell shopify that liquid is coming!
    return res.send(liquidHTML);
  });
}


module.exports = function(app) {
  //Move to utils file
  //https://stackoverflow.com/questions/14446511/what-is-the-most-efficient-method-to-groupby-on-a-javascript-array-of-objects
  const groupBy = (xs, key) => {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  // REPLACE THIS BY DB CONNECTION
  const getModel = (shopUrl) => {
    return {
        rows:[
          {
            answer: 'big',
            variant: {"random":"this object can be everything"},
            question: 'big or small?',
            shop_url:'salashoppi',
            access_token:'access_token'
          },
          {
            answer: 'small',
            variant: {"random":"this object can be everything"},
            question: 'big or small?',
            shop_url:'salashoppi',
            access_token:'access_token'
          },
          {
            answer: 'pink',
            variant: {"random":"this object can be everything"},
            question: 'what color?',
            shop_url:'salashoppi',
            access_token:'access_token'
          }
        ]
      };
  };

  const formatOneQuestion = (question) => {
    return '<div>' +
            '<h1>' + question[0].question + '</h1>' +
            question.map((r) => '<p>' + r.answer + '</p>').join(' ') +
           '</div>';
  };

  app.get('/journey-assistant', function(req, res) {
    const shop_url = req.body.shop_url;
    const model = getModel(shop_url);
    const grouppedQuestions = groupBy(model.rows, 'question');
    let liquidHTML = '';
    Object.keys(grouppedQuestions).forEach((question) => {
      liquidHTML += formatOneQuestion(grouppedQuestions[question]);
    });

    res.setHeader('content-type', 'application/liquid'); // Let's tell shopify that liquid is coming!
    return res.send(liquidHTML);
  });
}

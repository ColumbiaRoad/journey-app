exports.up = (pgm) => {
  pgm.addColumns('questionnaire',
    {
      root_question_id: 'integer REFERENCES question (question_id)'    
    }  
  );
};

exports.down = (pgm) => {
  pgm.dropColumns('questionnaire', ['root_question_id']);
};

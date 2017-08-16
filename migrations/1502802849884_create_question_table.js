exports.up = (pgm) => {
  pgm.createTable('question',
    {
      question_id: 'SERIAL PRIMARY KEY',
      question: 'varchar',
      product_id: 'varchar',
      option_id: 'varchar',
      questionnaire_id: 'integer REFERENCES questionnaire (questionnaire_id) ON DELETE CASCADE'
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('question');
};
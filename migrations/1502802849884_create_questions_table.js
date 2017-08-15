exports.up = (pgm) => {
  pgm.createTable('questions',
    {
      question_id: 'SERIAL PRIMARY KEY',
      question: 'varchar',
      product_id: 'varchar',
      option_id: 'varchar',
      survey_id: 'integer REFERENCES surveys (survey_id) ON DELETE CASCADE'
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('questions');
};
exports.up = (pgm) => {
  pgm.createTable('answers',
    {
      answer_id: 'SERIAL PRIMARY KEY',
      answer: 'varchar',
      property_value: 'varchar',
      question_id: 'integer REFERENCES questions (question_id) ON DELETE CASCADE',
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('answers');
};

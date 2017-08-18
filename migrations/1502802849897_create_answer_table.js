exports.up = (pgm) => {
  pgm.createTable('answer',
    {
      answer_id: 'SERIAL PRIMARY KEY',
      answer: 'varchar',
      property_value: 'varchar',
      answer_row_id: 'varchar',
      question_id: 'integer REFERENCES question (question_id) ON DELETE CASCADE',
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('answer');
};

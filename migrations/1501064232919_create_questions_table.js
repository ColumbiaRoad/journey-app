exports.up = (pgm) => {
  pgm.createTable('questions',
    {
      question_id: 'SERIAL PRIMARY KEY',
      question: 'varchar',
      shop_id: 'integer REFERENCES shops (shop_id) ON DELETE CASCADE',
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('questions');
};

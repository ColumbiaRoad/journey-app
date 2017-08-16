exports.up = (pgm) => {
  pgm.createTable('questionnaire',
    {
      questionnaire_id: 'SERIAL PRIMARY KEY',
      shop_id: 'integer REFERENCES shop (shop_id) ON DELETE CASCADE',
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('questionnaire');
};

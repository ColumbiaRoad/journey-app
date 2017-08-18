exports.up = (pgm) => {
  pgm.createTable('questionnaire',
    {
      questionnaire_id: 'SERIAL PRIMARY KEY',
      shop: 'varchar REFERENCES shop (shop_url) ON DELETE CASCADE'
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('questionnaire');
};

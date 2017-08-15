exports.up = (pgm) => {
  pgm.createTable('surveys',
    {
      survey_id: 'SERIAL PRIMARY KEY',
      shop_id: 'integer REFERENCES shops (shop_id) ON DELETE CASCADE',
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('surveys');
};

exports.up = (pgm) => {
  pgm.createTable('shops',
    {
      shop_id: 'SERIAL PRIMARY KEY',
      shop_url: 'varchar UNIQUE',
      access_token: 'varchar',
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('shops');
};

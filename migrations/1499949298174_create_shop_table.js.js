exports.up = (pgm) => {
  pgm.createTable('shop',
    {
      shop_id: 'SERIAL PRIMARY KEY',
      shop_url: 'varchar UNIQUE',
      access_token: 'varchar',
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('shop');
};

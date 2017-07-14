exports.up = (pgm) => {
  pgm.createTable('shops',
    { id: 'char(36)',
      shop_url: 'varchar',
      access_token: 'varchar'
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('shops');
};

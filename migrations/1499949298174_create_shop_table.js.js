exports.up = (pgm) => {
  pgm.createTable('shops',
    { id: 'char(36) UNIQUE',
      shop_url: 'varchar UNIQUE',
      access_token: 'varchar',
      survey_model: 'json',
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable('shops');
};

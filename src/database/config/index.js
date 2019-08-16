require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const base = {
  dialect: 'postgres',
  logging: false,
};

const pool = {
  max: 20,
  min: 1,
  idle: 20000,
  acquire: 20000,
};

const define = {
  timestamps: true,
  paranoid: true,
  underscored: false,
};


const development = {
  ...base,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  host: process.env.POSTGRES_HOST,
  pool,
  define,
};

const test = { ...development, database: `${process.env.POSTGRES_DATABASE}_test` };

const production = {
  ...base,
  logging: true,
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  pool: { ...pool, max: 20 },
  define,
};

module.exports = (() => {
  switch (env) {
    case 'production':
      return production;
    case 'test':
      return test;

    default:
      return development;
  }
})();

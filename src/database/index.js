require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('./config');

let sequelize;
const env = process.env.NODE_ENV || 'development';
const database = {};


if (env === 'production') {
  sequelize = new Sequelize(process.env.DATABASE_URL, config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}


fs
  .readdirSync(path.join(__dirname, 'models'))
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, 'models', file));
    database[model.name] = model;
  });

Object.keys(database).forEach((modelName) => {
  if (database[modelName].associate) {
    database[modelName].associate(database);
  }
});


database.sequelize = sequelize;
database.Sequelize = Sequelize;

module.exports = database;

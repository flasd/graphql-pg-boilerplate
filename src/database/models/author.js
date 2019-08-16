const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const columns = {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false,
      defaultValue() {
        return uuid();
      },
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
  };

  const metadata = {
    tableName: 'author',
  };

  const author = sequelize.define('author', columns, metadata);

  author.associate = (models) => {
    author.hasMany(models.post, { foreignKey: { name: 'author_id' }, allowNull: false });
  };

  return author;
};

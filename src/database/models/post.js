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
    title: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    body: {
      allowNull: false,
      type: DataTypes.TEXT,
    },
  };

  const metadata = {
    tableName: 'post',
  };

  const post = sequelize.define('post', columns, metadata);

  post.associate = (models) => {
    post.belongsTo(models.author, { foreignKey: { name: 'author_id' }, allowNull: false });
  };

  return post;
};

const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'userToken';

  const columns = {
    id: {
      allowNull: false,
      primaryKey: true,
      autoIncrement: false,
      type: DataTypes.UUID,
      defaultValue() {
        return uuid();
      },
    },

    userId: {
      allowNull: false,
      type: DataTypes.UUID,
    },

    fcmToken: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING(255),
    },

    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    },

    deletedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    },
  };

  const metadata = {
    tableName,
  };

  const userToken = sequelize.define(tableName, columns, metadata);

  userToken.associate = (models) => {
    userToken.belongsTo(models.user, {
      foreignKey: { name: 'userId' },
      foreignKeyConstraint: true,
      allowNull: false,
    });
  };

  return userToken;
};

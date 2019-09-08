const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'userUpload';

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

    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    deleteFailed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
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

  const userUpload = sequelize.define(tableName, columns, metadata);

  userUpload.associate = (models) => {
    userUpload.belongsTo(models.user, {
      foreignKey: { name: 'userId' },
      foreignKeyConstraint: true,
      allowNull: false,
    });
  };

  return userUpload;
};

const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'userPagarme';

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

    pagarmeUserId: {
      type: DataTypes.STRING(127),
      allowNull: false,
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

  const userPagarme = sequelize.define(tableName, columns, metadata);

  userPagarme.associate = (models) => {
    userPagarme.belongsTo(models.user, {
      foreignKey: { name: 'userId' },
      foreignKeyConstraint: true,
      allowNull: false,
    });
  };

  return userPagarme;
};

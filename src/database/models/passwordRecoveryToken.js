const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'passwordRecoveryToken';

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

    token: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
  };

  const metadata = {
    tableName,
    paranoid: false,
  };

  const passwordRecoveryToken = sequelize.define(tableName, columns, metadata);

  passwordRecoveryToken.associate = (models) => {
    passwordRecoveryToken.belongsTo(models.user, {
      foreignKey: { name: 'userId' },
      foreignKeyConstraint: true,
      allowNull: false,
    });
  };

  return passwordRecoveryToken;
};

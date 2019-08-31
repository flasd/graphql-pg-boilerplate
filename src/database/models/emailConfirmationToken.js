const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'emailConfirmationToken';

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

  const emailConfirmationToken = sequelize.define(tableName, columns, metadata);

  emailConfirmationToken.associate = (models) => {
    emailConfirmationToken.belongsTo(models.user, {
      foreignKey: { name: 'userId' },
      foreignKeyConstraint: true,
      allowNull: false,
    });
  };

  return emailConfirmationToken;
};

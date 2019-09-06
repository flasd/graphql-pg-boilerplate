const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'product';

  const columns = {
    id: {
      allowNull: false,
      primaryKey: true,
      autoIncrement: false,
      unique: true,
      type: DataTypes.UUID,
      defaultValue() {
        return uuid();
      },
    },

    name: {
      allowNull: false,
      type: DataTypes.STRING(127),
    },

    unitPrice: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },

    tangible: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
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

  const product = sequelize.define(tableName, columns, metadata);

  product.associate = (/* models */) => {
    // Associate...
  };

  return product;
};

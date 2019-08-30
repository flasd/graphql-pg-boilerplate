const { genSaltSync, hashSync, compareSync } = require('bcryptjs');
const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'user';

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

    email: {
      allowNull: false,
      type: DataTypes.STRING(255),
    },

    name: {
      allowNull: false,
      type: DataTypes.STRING(127),
    },

    password: {
      allowNull: false,
      type: DataTypes.STRING(127),
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
    hooks: {
      beforeCreate: (user) => {
        const salt = genSaltSync();
        // eslint-disable-next-line no-param-reassign
        user.password = hashSync(user.password, salt);
      },
      beforeUpdate: (user) => {
        if (user.changed('password')) {
          const salt = genSaltSync();
          // eslint-disable-next-line no-param-reassign
          user.password = hashSync(user.password, salt);
        }
      },
    },
  };

  const user = sequelize.define(tableName, columns, metadata);

  user.associate = (/* models */) => {
    // User.hasMany(models.something, {
    //   foreignKey: { name: 'user_id' },
    //   allowNull: false,
    // });
  };

  // cannot be arrow function because of the 'this' binding
  user.prototype.hasPassword = function hasPassword(candidate) {
    return compareSync(
      candidate,
      this.password,
    );
  };

  return user;
};
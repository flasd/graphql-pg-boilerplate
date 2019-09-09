const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'notificationTopic';

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

    name: {
      allowNull: false,
      unique: true,
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
  };

  const notificationTopic = sequelize.define(tableName, columns, metadata);

  notificationTopic.associate = (models) => {
    notificationTopic.hasMany(models.notification, {
      foreignKey: { name: 'topicId' },
      foreignKeyConstraint: true,
      allowNull: true,
    });
  };

  return notificationTopic;
};

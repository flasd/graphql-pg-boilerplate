const uuid = require('uuid/v4');

module.exports = (sequelize, DataTypes) => {
  const tableName = 'notification';

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
      allowNull: true,
      type: DataTypes.UUID,
    },

    topicId: {
      allowNull: true,
      type: DataTypes.UUID,
    },

    icon: {
      allowNull: true,
      type: DataTypes.UUID,
    },

    image: {
      allowNull: true,
      type: DataTypes.UUID,
    },

    title: {
      allowNull: false,
      type: DataTypes.STRING(95),
    },

    body: {
      allowNull: false,
      type: DataTypes.STRING(140),
    },

    action: {
      allowNull: false,
      type: DataTypes.STRING(255),
    },

    color: {
      allowNull: false,
      type: DataTypes.STRING(7),
    },

    priority: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
    },

    data: {
      allowNull: true,
      type: DataTypes.JSON,
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

  const notification = sequelize.define(tableName, columns, metadata);

  notification.associate = (models) => {
    notification.belongsTo(models.notificationTopic, {
      foreignKey: { name: 'topicId' },
      foreignKeyConstraint: true,
      allowNull: true,
    });

    notification.belongsTo(models.userUpload, {
      foreignKey: { name: 'icon' },
      foreignKeyConstraint: true,
      allowNull: true,
    });

    notification.belongsTo(models.userUpload, {
      foreignKey: { name: 'image' },
      foreignKeyConstraint: true,
      allowNull: true,
    });
  };

  return notification;
};

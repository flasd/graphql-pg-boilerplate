module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .createTable('notification', {
      id: {
        allowNull: false,
        primaryKey: true,
        unique: true,
        type: Sequelize.UUID,
      },

      topicId: {
        allowNull: true,
        onUpdate: 'cascade',
        onDelete: 'cascade',
        type: Sequelize.UUID,
        references: { model: 'notificationTopic', key: 'id' },
      },

      title: {
        allowNull: false,
        type: Sequelize.STRING(95),
      },

      body: {
        allowNull: false,
        type: Sequelize.STRING(140),
      },

      action: {
        allowNull: false,
        type: Sequelize.STRING(255),
      },

      color: {
        allowNull: false,
        type: Sequelize.STRING(7),
      },

      icon: {
        allowNull: false,
        onUpdate: 'cascade',
        onDelete: 'cascade',
        type: Sequelize.UUID,
        references: { model: 'userUpload', key: 'id' },
      },

      image: {
        allowNull: false,
        onUpdate: 'cascade',
        onDelete: 'cascade',
        type: Sequelize.UUID,
        references: { model: 'userUpload', key: 'id' },
      },

      priority: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },

      data: {
        allowNull: true,
        type: Sequelize.JSON,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },

      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    }),

  down: (queryInterface) => queryInterface
    .dropTable('notification')
  ,
};


module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .createTable('notificationTopic', {
      id: {
        allowNull: false,
        primaryKey: true,
        unique: true,
        type: Sequelize.UUID,
      },

      name: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(127),
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
    .dropTable('notificationTopic')
  ,
};

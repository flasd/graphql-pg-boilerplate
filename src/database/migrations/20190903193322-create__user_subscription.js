
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .createTable('userSubscription', {
      id: {
        allowNull: false,
        primaryKey: true,
        unique: true,
        type: Sequelize.UUID,
      },

      userId: {
        allowNull: false,
        onUpdate: 'cascade',
        onDelete: 'cascade',
        type: Sequelize.UUID,
        references: { model: 'user', key: 'id' },
      },

      subscriptionId: {
        allowNull: false,
        type: Sequelize.STRING(127),
      },

      subscriptionEnd: {
        allowNull: false,
        type: Sequelize.DATE,
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

  down: (queryInterface) => queryInterface.dropTable('userSubscription'),
};

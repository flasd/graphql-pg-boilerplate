
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .createTable('userPagarme', {
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

      pagarmeUserId: {
        allowNull: false,
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

  down: (queryInterface) => queryInterface.dropTable('userPagarme'),
};

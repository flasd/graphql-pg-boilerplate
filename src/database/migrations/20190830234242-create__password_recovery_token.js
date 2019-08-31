
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .createTable('passwordRecoveryToken', {
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

      token: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    }),

  down: (queryInterface) => queryInterface.dropTable('passwordRecoveryToken'),
};


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
    }),

  down: (queryInterface) => queryInterface.dropTable('userPagarme'),
};

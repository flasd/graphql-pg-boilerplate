
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .createTable('userToken', {
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

      fcmToken: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(255),
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

  down: (queryInterface) => queryInterface.dropTable('userToken'),
};

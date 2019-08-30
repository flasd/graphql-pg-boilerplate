
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .createTable('user', {
      id: {
        allowNull: false,
        primaryKey: true,
        unique: true,
        type: Sequelize.UUID,
      },

      email: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(255),
      },

      name: {
        allowNull: false,
        type: Sequelize.STRING(127),
      },

      password: {
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

  down: (queryInterface) => queryInterface.dropTable('user'),
};


module.exports = {
  up: (queryInterface, Sequelize) => queryInterface
    .createTable('product', {
      id: {
        allowNull: false,
        primaryKey: true,
        unique: true,
        type: Sequelize.UUID,
      },

      name: {
        allowNull: false,
        type: Sequelize.STRING(127),
      },

      unitPrice: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },

      tangible: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
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
    .dropTable('product')
  ,
};

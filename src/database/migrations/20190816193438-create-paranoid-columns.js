
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('post', 'deletedAt', {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.addColumn('author', 'deletedAt', {
      allowNull: true,
      type: Sequelize.DATE,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('post', 'deletedAt');
    await queryInterface.removeColumn('author', 'deletedAt');
  },
};

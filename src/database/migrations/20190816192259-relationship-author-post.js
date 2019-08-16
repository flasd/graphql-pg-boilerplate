
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('post', 'author_id', {
    type: Sequelize.UUID,
    allowNull: false,

    references: {
      model: 'author',
      key: 'id',
    },
  }), /*
    Add altering commands here.
    Return a promise to correctly handle asynchronicity.

    Example:
    return queryInterface.createTable('users', { id: Sequelize.INTEGER });
  */


  down: (queryInterface) => queryInterface.removeColumn('post', 'author_id')
  /*
    Add reverting commands here.
    Return a promise to correctly handle asynchronicity.

    Example:
    return queryInterface.dropTable('users');
  */
  ,
};

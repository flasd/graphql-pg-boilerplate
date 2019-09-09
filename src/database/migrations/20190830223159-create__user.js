
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
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

        emailVerified: {
          allowNull: false,
          type: Sequelize.BOOLEAN,
        },

        role: {
          allowNull: false,
          type: Sequelize.ENUM('admin', 'user'),
        },

        fcmToken: {
          allowNull: true,
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
      });

    await queryInterface
      .bulkInsert('user', [
        {
          id: 'c9adb152-2e3d-4fea-b133-d12f22755546',
          name: 'Admin',
          email: 'admin@email.com',
          // raw password is "3A7Y6JUdfGAhGAvY"
          password: '$2a$10$5DUx4vpZqg3VaRAoSYek2uzpiBSFPG3zuuv9a5oJ8eomKon8v6mx6',
          emailVerified: true,
          role: 'admin',
          createdAt: '2019-09-03T19:55:35.654Z',
        },
      ]);
  },

  down: async (queryInterface) => {
    await queryInterface
      .bulkDelete('user', {
        id: 'c9adb152-2e3d-4fea-b133-d12f22755546',
      }, {});

    await queryInterface.dropTable('user');
  },
};

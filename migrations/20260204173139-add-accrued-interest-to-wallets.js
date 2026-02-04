'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("wallets", "accruedInterest", {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: false,
      defaultValue: "0.00",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("wallets", "accruedInterest");

  }
};

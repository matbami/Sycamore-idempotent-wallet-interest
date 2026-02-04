'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex("transaction_logs", ["idempotencyKey"], {
      unique: true,
      name: "unique-transaction_logs_idempotency_key",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      "transaction_logs",
      "unique-transaction_logs_idempotency_key"
    );
  },
};

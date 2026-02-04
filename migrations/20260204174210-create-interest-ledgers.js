'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("interest_ledger", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },

      walletId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "wallets",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      accruedOn: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      interestAmount: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
      },

      rateUsed: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: "27.50",
      },

      status: {
        type: Sequelize.ENUM("SUCCESS", "FAILED"),
        allowNull: false,
        defaultValue: "SUCCESS",
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint("interest_ledger", {
      fields: ["walletId", "accruedOn"],
      type: "unique",
      name: "unique_wallet_interest_per_day",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("interest_ledger");
  },
};

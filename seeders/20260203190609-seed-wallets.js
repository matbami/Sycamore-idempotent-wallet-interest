"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "wallets",
      [
        {
          id: "7c9b3c9a-0c9e-4d67-8f1d-5a4e1b0a6c21",
          userId: "d3f1c3b6-5f4d-4d1c-8c5c-9f2b8e2d6a10",
          currency: "NGN",
          balance: 500000, // kobo
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3b8a1f5e-7d3c-4f21-9c1d-2e6a7b9f4c12",
          userId: "a9d2f4c7-1b6e-4c8d-9a3f-6e2b1c7d5f90",
          currency: "NGN",
          balance: 200000, // kobo
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("wallets", null, {});
  },
};

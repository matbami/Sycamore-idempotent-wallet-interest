import { sequelize } from "../../src/config/database";

export const resetDb = async () => {
  await sequelize.query(`TRUNCATE TABLE transaction_logs RESTART IDENTITY CASCADE;`);
  await sequelize.query(`TRUNCATE TABLE wallets RESTART IDENTITY CASCADE;`);
};


afterAll(async () => {
  await sequelize.close(); // close DB connection
});
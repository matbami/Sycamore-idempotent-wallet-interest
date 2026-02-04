import { sequelize } from "../../src/config/database";

export const resetDb = async () => {
  // force: true DROPS the tables and recreates them
  // This ensures new columns like 'accruedInterest' are actually created
  await sequelize.sync({ force: true });
};


afterAll(async () => {
  await sequelize.close(); // close DB connection
});
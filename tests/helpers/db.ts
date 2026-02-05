import { sequelize } from "../../src/config/database";

export const resetDb = async () => {
  await sequelize.sync({ force: true });
};


afterAll(async () => {
  await sequelize.close(); // close DB connection
});
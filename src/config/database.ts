import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const env = process.env.NODE_ENV || "development";

const { database, username, password, host, port } = require(
  path.resolve(__dirname, "../../config/config.js"),
)[env];

export const sequelize = new Sequelize(database, username, password, {
  host,
  port: Number(port),
  dialect: "postgres",
  logging: false,

  define: {
    underscored: true,
  },
});
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("DatabaseB connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};

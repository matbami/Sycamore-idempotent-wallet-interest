import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config();


const env = process.env.NODE_ENV || "development";

const config = require(path.resolve(__dirname, "../../config/config.js"))[env];



export const sequelize = new Sequelize(
config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: Number(config.port),
    dialect: "postgres",
    logging: false,
  }
);
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected", config.database);
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
};

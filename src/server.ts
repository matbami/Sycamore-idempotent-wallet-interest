import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/database";
import { connectRedis } from "./config/redis";

// import { connectRedis } from "./config/redis";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
//   await connectRedis();

await connectRedis();


  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start();

import express from "express";
import transferRoute from "./routes/transfer";
// import { redisClient } from "./config/redis";
// import { User } from "./models/User";

const app = express();
app.use(express.json());



app.use(express.json());
app.use("/api", transferRoute);

// app.get("/health", async (_req, res) => {
//   const redisPing = await redisClient.ping();
//   res.json({ status: "ok", redis: redisPing });
// });

// app.get("/users", async (_req, res) => {
//   const cacheKey = "users:all";

//   const cached = await redisClient.get(cacheKey);
//   if (cached) return res.json({ source: "redis", data: JSON.parse(cached) });

//   const users = await User.findAll();
//   await redisClient.set(cacheKey, JSON.stringify(users), { EX: 60 });

//   res.json({ source: "db", data: users });
// });

export default app;

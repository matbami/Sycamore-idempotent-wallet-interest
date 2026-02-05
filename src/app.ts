import express from "express";
import transferRoute from "./routes/transfer";

const app = express();
app.use(express.json());
app.use("/api/v1", transferRoute);

export default app;

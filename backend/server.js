import express from "express";
import authRoutes from "./routes/auth.routes.js";
import dotenv from "dotenv";
import { connectToDb } from "./db/connectToDb.js";

const PORT = process.env.PORT || 5000;
const app = express();
dotenv.config();

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectToDb();
});

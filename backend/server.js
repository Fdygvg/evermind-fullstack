import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

dotenv.config();
// app config
const port = process.env.PORT || 5000;
const app = express();

//c0nect t0 database
connectDB();

app.set("trust proxy", true);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/", authRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/stats", statsRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "EVERMIND API is running!",
    version: "1.0",
    modules: "ES Modules Active!",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 EVERMIND backend running on port ${PORT}`);
});

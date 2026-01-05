import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import presetRoutes from "./routes/presetRoutes.js";
import smartReviewRoutes from './routes/smartReviewRoutes.js';

dotenv.config();
// app config
const app = express();

//c0nect t0 database
connectDB();

app.set("trust proxy", true);

// Middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: [
    'https://evermind-frontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

app.use("/api/", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/presets", presetRoutes);
app.use('/api/smart-review', smartReviewRoutes);

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

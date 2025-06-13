import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

// Load environment variables
dotenv.config({ path: ".env" });

const app = express();

// Connect to MongoDB
connectDB();

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

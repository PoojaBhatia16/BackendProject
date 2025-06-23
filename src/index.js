
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";
// Load environment variables

const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB().then(()=>{
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
}).catch((error)=>{
  console.log("connection not working failed")
});



import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./database/db.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

// Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
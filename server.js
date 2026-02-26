import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // 1. Import CORS
import apiRoutes from "./src/routes/apiRoutes.js"; // Ensure this path is correct

dotenv.config();

const app = express();

// Middleware
app.use(cors()); // 2. Enable CORS - This allows your frontend to talk to the backend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base API Route
app.use("/api", apiRoutes);

// Root Route
app.get("/", (req, res) => {
    res.send("🚀 HemoScan Backend Server is Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
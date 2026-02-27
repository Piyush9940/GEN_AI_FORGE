import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"; 
import { fileURLToPath } from "url";
import apiRoutes from "./src/routes/apiRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";

// Load environment variables (Twilio, ML API URL, etc.)
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 🛡️ MIDDLEWARE CONFIGURATION
 * CORS must be enabled for the Frontend to communicate with this Backend.
 */
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 📂 STATIC FILE SERVING
 * This allows the browser to access your archived PDF reports and the dashboard UI.
 */

// 1. Serve the entire 'reports' folder. 
// This makes: http://localhost:5000/reports/pdf_reports/filename.pdf accessible to the 'View' button.
app.use("/reports", express.static(path.join(process.cwd(), "reports")));

// 2. Serve the 'public' folder for your HTML/CSS/JS frontend files
app.use(express.static(path.join(process.cwd(), "public")));

/**
 * 🚀 ROUTE REGISTRATION
 */

// API for ML Predictions & Patient Registration (The Anemia Detector)
app.use("/api", apiRoutes);

// API for Clinical Intelligence Dashboard (JSON Scraper & SMS Alerts)
app.use("/api/dashboard", dashboardRoutes);

/**
 * 🌐 ROOT & SERVER INITIALIZATION
 */
app.get("/", (req, res) => {
    res.send("🚀 HemoScan Backend Server is Running - Technovative Intelligence Unit");
});

// Final Error Handling Middleware (Catches 404s)
app.use((req, res) => {
    res.status(404).json({ error: "Route not found in Technovative Pipeline" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n****************************************************`);
    console.log(`🚀 Technovative Server: http://localhost:${PORT}`);
    console.log(`📡 Clinical Archive: http://localhost:${PORT}/reports`);
    console.log(`💉 Dashboard Ready: http://localhost:${PORT}/dashboard.html`);
    console.log(`****************************************************\n`);
});
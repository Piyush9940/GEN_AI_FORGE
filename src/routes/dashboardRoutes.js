import express from "express";
import { 
    getDoctorDashboardFeed, 
    sendPatientAlert 
} from "../controller/dashboard.controller.js";

const router = express.Router();

/**
 * @route   GET /api/dashboard/feed
 * @desc    Scans /reports/json_archives and returns structured clinical data
 */
// ✅ CHANGED THIS FROM /live-feed TO /feed
router.get("/feed", getDoctorDashboardFeed);

/**
 * @route   POST /api/dashboard/send-alert
 * @desc    Triggers an SMS based on a specific reportID
 */
router.post("/send-alert", sendPatientAlert);

export default router;
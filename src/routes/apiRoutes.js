import express from "express";

// Controllers
import { predictAnemia } from "../controller/ml.controller.js";
import { savePatient, getPatients } from "../controller/patient.controller.js";

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    API Health Check (Important for demo & deployment)
 * @access  Public
 */
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "HemoScan API Gateway",
        status: "Running",
        timestamp: new Date().toISOString()
    });
});

/**
 * ===============================
 * 🧠 ML ROUTES (FastAPI Pipeline)
 * ===============================
 */

/**
 * @route   POST /api/predict
 * @desc    Send patient blood data → FastAPI ML → Get PDF Report
 * @access  Public
 */
router.post("/predict", predictAnemia);


/**
 * ===============================
 * 🏥 PATIENT DATA ROUTES
 * ===============================
 */

/**
 * @route   POST /api/patients
 * @desc    Save patient test record to database (JSON/Mongo)
 * @access  Public
 */
router.post("/patients", savePatient);

/**
 * @route   GET /api/patients
 * @desc    Get all patient history (Dashboard table)
 * @access  Public
 */
router.get("/patients", getPatients);

export default router;
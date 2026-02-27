import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const getDoctorDashboardFeed = async (req, res) => {
    try {
        const jsonDir = path.join(__dirname, "../../reports/json_archives");
        try { await fs.access(jsonDir); } catch { return res.status(200).json([]); }

        const files = (await fs.readdir(jsonDir)).filter(file => file.endsWith(".json"));

        const feedData = await Promise.all(files.map(async (file) => {
            try {
                const filePath = path.join(jsonDir, file);
                const content = await fs.readFile(filePath, "utf-8");
                const json = JSON.parse(content);

                // Ensure reportID is never undefined
                const rID = json.metadata?.reportID || file.replace('.json', '');

                return {
                    reportID: rID,
                    patientName: json.aiAnalysis?.clinical_report?.patient_info?.name || json.patientInput?.name || "Unknown",
                    hb: json.aiAnalysis?.clinical_report?.cbc_analysis?.find(i => i.parameter === "Hemoglobin")?.patient_value || "N/A",
                    status: json.aiAnalysis?.clinical_report?.model_prediction || "Pending",
                    risk: json.aiAnalysis?.clinical_report?.risk_level || "Normal",
                    timestamp: json.metadata?.generatedAt || new Date().toISOString()
                };
            } catch (err) { return null; }
        }));

        res.status(200).json(feedData.filter(i => i !== null).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) { res.status(500).json({ error: "Sync Failed" }); }
};

export const sendPatientAlert = async (req, res) => {
    try {
        const { reportID } = req.body;

        // 🛡️ CRITICAL FIX: Prevent undefined.json crash
        if (!reportID || reportID === "undefined") {
            return res.status(400).json({ error: "Invalid Report ID" });
        }

        const jsonPath = path.join(__dirname, "../../reports/json_archives", `${reportID}.json`);
        const content = await fs.readFile(jsonPath, "utf-8");
        const patientData = JSON.parse(content);

        const phone = patientData.patientInput?.mob_no || patientData.aiAnalysis?.clinical_report?.patient_info?.phone;
        const name = patientData.patientInput?.name || "Patient";
        const hb = patientData.patientInput?.hb || "N/A";

        res.status(200).json({ success: true, message: `Alerting ${name}...` });

        const messageBody = `🚨 HEMOSCAN ALERT: Hello ${name}, your report shows a critical Hb level of ${hb} g/dL. Please visit AMC Medical Center immediately.`;

        try {
            await client.messages.create({
                body: messageBody,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: `+91${phone}`
            });
            console.log(`✅ SMS SUCCESS: Sent to ${name} (+91${phone})`);
        } catch (twilioErr) {
            console.log(`\n--- 🔔 [DEMO MODE] ALERT LOGGED ---`);
            console.log(`TARGET: ${name} | PHONE: +91${phone} | HB: ${hb}`);
            console.log(`MESSAGE: "${messageBody}"`);
            console.log(`-----------------------------------\n`);
        }
    } catch (error) {
        console.error("❌ Alert Error:", error.message);
        if (!res.headersSent) res.status(500).json({ error: "Archive Retrieval Failed" });
    }
};
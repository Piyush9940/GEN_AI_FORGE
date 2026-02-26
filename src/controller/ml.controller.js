import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES Modules to handle file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * FINAL ML CONTROLLER
 * 1. Validates and maps data to FastAPI schema.
 * 2. Fetches PDF from ML/LLM Engine.
 * 3. Saves a permanent copy in /reports folder.
 * 4. Streams the PDF to the user's browser.
 */
export const predictAnemia = async (req, res) => {
    try {
        const data = req.body;

        // 1. Basic Validation
        if (!data.name || !data.hb || !data.age) {
            return res.status(400).json({ error: "Required fields (name, hb, age) are missing." });
        }

        // 2. Exact Mapping for FastAPI Pydantic Model (Matches your Python class)
        const pythonPayload = {
            name: data.name,
            phone: data.phone || data.mob_no || "",
            Gender: data.gender 
                ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1).toLowerCase()
                : "Unknown",
            Age: parseFloat(data.age),
            Hb: parseFloat(data.hb),
            RBC: parseFloat(data.rbc),
            PCV: parseFloat(data.pcv),
            MCV: parseFloat(data.mcv),
            MCH: parseFloat(data.mch),
            MCHC: parseFloat(data.mchc)
        };

        const ML_API_URL = process.env.ML_API_URL || "http://192.168.2.23:8000/predict";
        console.log(`📡 Fetching AI Report from: ${ML_API_URL}`);

        // 3. Request PDF from FastAPI
        const response = await fetch(ML_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pythonPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ FastAPI Error:", errorText);
            return res.status(502).json({ error: "The AI Engine failed. Check Python console." });
        }

        // 4. Receive PDF Binary Data
        const arrayBuffer = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);

        // 5. 📂 PERMANENT STORAGE: Save to /reports folder
        const safeName = data.name.replace(/\s+/g, "_");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `HemoScan_${safeName}_${timestamp}.pdf`;
        
        // Path to reports folder (Project Root/reports)
        const reportsDir = path.join(__dirname, "../../reports");

        try {
            // recursive: true creates the folder if it doesn't exist, else ignores
            await fs.mkdir(reportsDir, { recursive: true });
            const filePath = path.join(reportsDir, fileName);
            await fs.writeFile(filePath, pdfBuffer);
            console.log(`💾 Report archived locally: ${filePath}`);
        } catch (storageErr) {
            console.error("⚠️ Failed to archive PDF locally:", storageErr);
            // We continue so the user still gets their download even if save fails
        }

        // 6. Send to Frontend for immediate download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

        console.log(`✅ PDF streamed to user: ${fileName}`);
        return res.send(pdfBuffer);

    } catch (error) {
        console.error("❌ Node-to-ML Pipeline Error:", error.message);
        return res.status(500).json({ 
            error: "Internal Server Error. Check connectivity with ML laptop." 
        });
    }
};
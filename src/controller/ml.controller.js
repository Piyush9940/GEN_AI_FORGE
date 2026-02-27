import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const predictAnemia = async (req, res) => {
    try {
        const data = req.body;
        // Update this IP to your current Python laptop IP
        const ML_API_URL = process.env.ML_API_URL || "http://10.121.107.208:8000/predict";

        // 1. Fetch JSON prediction from FastAPI
        const response = await fetch(ML_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("AI Engine failed to return JSON.");
        const aiResult = await response.json();

        // 2. Setup Filenames and Folder Paths
        const safeName = (data.name || "Patient").replace(/\s+/g, "_");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const baseFileName = `HemoScan_${safeName}_${timestamp}`;
        
        const jsonDir = path.join(__dirname, "../../reports/json_archives");
        const pdfDir = path.join(__dirname, "../../reports/pdf_reports");
        
        await fs.mkdir(jsonDir, { recursive: true });
        await fs.mkdir(pdfDir, { recursive: true });

        // --- 💾 TASK 1: SAVE JSON DATA (Technovative Archive Folder) ---
        const jsonRecord = {
            metadata: {
                reportID: baseFileName,
                generatedAt: new Date().toISOString(),
                institution: "Technovative"
            },
            patientInput: data,
            aiAnalysis: aiResult
        };

        const jsonPath = path.join(jsonDir, `${baseFileName}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(jsonRecord, null, 2));
        console.log(`💾 JSON archived in: ${jsonPath}`);


        // --- 🎨 TASK 2: GENERATE PDF ---
        const pdfPath = path.join(pdfDir, `${baseFileName}.pdf`);
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);
            await fs.writeFile(pdfPath, pdfBuffer);
            console.log(`📄 PDF archived in: ${pdfPath}`);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${baseFileName}.pdf"`);
            res.send(pdfBuffer);
        });

        // Mapping report data from our jsonRecord variable
        const report = jsonRecord.aiAnalysis.clinical_report;

        // --- 1. Header & Branding ---
        doc.fontSize(10).fillColor('#666').text("TECHNOVATIVE | MEDICAL INTELLIGENCE UNIT", { align: 'right' });
        doc.moveDown(0.5);
        doc.fontSize(26).fillColor('#1a5fb4').text("HEMOSCAN CLINICAL REPORT", { characterSpacing: 1 });
        doc.fontSize(10).fillColor('#666').text(`Report ID: ${jsonRecord.metadata.reportID}`);
        doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke('#eee');
        doc.moveDown(2);

        // --- 2. Patient Information Grid ---
        doc.fillColor('#1a5fb4').fontSize(12).text("PATIENT INFORMATION", { continued: false });
        doc.moveDown(0.5);

        doc.fontSize(10).fillColor('#000');
        const startY = doc.y;
        doc.text(`Name: ${report.patient_info.name}`, 50, startY);
        doc.text(`Age/Gender: ${report.patient_info.age} / ${report.patient_info.gender}`, 50, startY + 15);
        doc.text(`Contact: ${report.patient_info.phone}`, 300, startY);
        doc.text(`Date: ${new Date(jsonRecord.metadata.generatedAt).toLocaleString()}`, 300, startY + 15);
        doc.moveDown(3);

        // --- 3. Diagnostic Summary ---
        const isAnemic = report.model_prediction === "Anemic";
        const statusColor = isAnemic ? '#d32f2f' : '#2e7d32';

        doc.rect(50, doc.y, 500, 45).fill('#f8f9fa');
        doc.fillColor(statusColor).fontSize(14).text("DIAGNOSTIC STATUS", 65, doc.y + 10);
        doc.fontSize(18).text(report.model_prediction.toUpperCase(), 65, doc.y);
        doc.fontSize(10).fillColor('#666').text(`Confidence: ${report.confidence_percent}%`, 400, doc.y - 15);
        doc.moveDown(3);

        // --- 4. Laboratory Findings Table ---
        doc.fillColor('#1a5fb4').fontSize(12).text("DETAILED LABORATORY FINDINGS", 50);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.rect(50, tableTop, 500, 20).fill('#1a5fb4');
        doc.fillColor('#fff').fontSize(10);
        doc.text("PARAMETER", 60, tableTop + 6);
        doc.text("VALUE", 200, tableTop + 6);
        doc.text("REFERENCE RANGE", 300, tableTop + 6);
        doc.text("STATUS", 450, tableTop + 6);

        let rowY = tableTop + 20;
        report.cbc_analysis.forEach((item, index) => {
            if (index % 2 === 0) doc.rect(50, rowY, 500, 20).fill('#f2f2f2');
            
            doc.fillColor('#000').fontSize(10);
            doc.text(item.parameter, 60, rowY + 6);
            doc.text(item.patient_value.toString(), 200, rowY + 6);
            doc.text(item.reference_range, 300, rowY + 6);
            
            const itemColor = item.status !== "Normal" ? '#d32f2f' : '#2e7d32';
            doc.fillColor(itemColor).text(item.status, 450, rowY + 6);
            rowY += 20;
        });

        doc.moveDown(3);

        // --- 5. Clinical Interpretation ---
        doc.fillColor('#1a5fb4').fontSize(12).text("CLINICAL INTERPRETATION");
        doc.fontSize(10).fillColor('#333').text(report.clinical_interpretation, { align: 'justify', width: 500 });
        doc.moveDown();

        // --- 6. Recommendations ---
        if (report.suggested_diagnostic_tests && report.suggested_diagnostic_tests.length > 0) {
            doc.fillColor('#d32f2f').fontSize(11).text("REQUIRED FOLLOW-UP TESTS:");
            doc.fillColor('#000').fontSize(9);
            report.suggested_diagnostic_tests.forEach(test => {
                doc.text(`• ${test}`, { indent: 10 });
            });
        }

        doc.fontSize(8).fillColor('#999').text("This report is generated by HemoScan AI. Please correlate with clinical findings.", 50, 750, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error("❌ Technovative Pipeline Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error", message: error.message });
        }
    }
};
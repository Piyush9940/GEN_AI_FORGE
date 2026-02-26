import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES Modules (__dirname support)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to local JSON database (patients.json in project root)
const dbPath = path.join(__dirname, "../../patients.json");

// Ensure the JSON file exists
const initializeDB = async () => {
    try {
        await fs.access(dbPath);
    } catch (error) {
        await fs.writeFile(dbPath, JSON.stringify([], null, 2));
        console.log("📁 patients.json created");
    }
};

// Initialize once when file is loaded
await initializeDB();

// Helper to safely convert numbers
const toNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

const Patient = {
    // Create & store new patient
    create: async (data) => {
        try {
            const {
                name,
                phone,
                gender,
                age,
                hb,
                rbc,
                pcv,
                mcv,
                mch,
                mchc
            } = data;

            // Read existing data
            const fileData = await fs.readFile(dbPath, "utf8");
            const patients = JSON.parse(fileData);

            // New patient object
            const newPatient = {
                id: Date.now().toString(),
                name: name || "",
                phone: phone || "",
                gender: gender || "",
                age: toNumber(age),

                // Blood Report Fields
                hb: toNumber(hb),
                rbc: toNumber(rbc),
                pcv: toNumber(pcv),
                mcv: toNumber(mcv),
                mch: toNumber(mch),
                mchc: toNumber(mchc),

                createdAt: new Date().toISOString()
            };

            // Save to JSON file
            patients.push(newPatient);
            await fs.writeFile(dbPath, JSON.stringify(patients, null, 2));

            return newPatient;
        } catch (error) {
            console.error("❌ Error saving patient:", error.message);
            throw error;
        }
    },

    // Get all patients
    find: async () => {
        try {
            const fileData = await fs.readFile(dbPath, "utf8");
            return JSON.parse(fileData);
        } catch (error) {
            return [];
        }
    }
};

export default Patient;
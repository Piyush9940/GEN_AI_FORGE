import Patient from "../models/patient.model.js";

/**
 * Saves the patient's input data to the local JSON database.
 * Called when report/PDF is generated or form is submitted.
 */
export const savePatient = async (req, res) => {
    try {
        const patientData = req.body;

        // Basic required fields check (optional but recommended)
        const requiredFields = [
            "name",
            "phone",
            "gender",
            "age",
            "hb",
            "rbc",
            "pcv",
            "mcv",
            "mch",
            "mchc"
        ];

        for (const field of requiredFields) {
            if (!patientData[field]) {
                return res.status(400).json({
                    success: false,
                    message: `${field} is required`
                });
            }
        }

        // Save to patients.json using your custom model
        const newPatient = await Patient.create(patientData);

        console.log(`💾 Record logged in patients.json for: ${newPatient.name}`);

        return res.status(201).json({
            success: true,
            message: "Patient data stored successfully",
            data: newPatient
        });
    } catch (error) {
        console.error("❌ Controller Error saving patient:", error.message);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error saving record."
        });
    }
};

/**
 * Retrieves all patient test history from the local JSON file.
 * Useful for dashboard / recent tests table.
 */
export const getPatients = async (req, res) => {
    try {
        const patients = await Patient.find();

        return res.status(200).json({
            success: true,
            count: patients.length,
            data: patients
        });
    } catch (error) {
        console.error("❌ Controller Error fetching history:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to retrieve patient history."
        });
    }
};
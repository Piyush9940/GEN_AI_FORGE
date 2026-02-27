(function() {
    'use strict';
    
    const downloadBtn = document.getElementById('downloadBtn');
    const analyseBtn = document.getElementById('analyseBtn');
    const patientForm = document.getElementById('patientForm');

    const API_BASE_URL = "http://localhost:5000/api";

    // 📦 Report Memory for Hackathon Demo
    let lastReportBlob = null;
    let lastReportName = "";

    /**
     * 📋 DATA MAPPING
     * Formats data exactly for the Technovative JSON schema
     */
    function getFormData() {
        const radios = document.getElementsByName('gender');
        let gender = 'm';
        for (let r of radios) { if (r.checked) { gender = r.value; break; } }

        return {
            name: document.getElementById('fullName')?.value.trim() || 'Piyush Kumar',
            age: parseInt(document.getElementById('age')?.value) || 0,
            gender: gender,
            mob_no: document.getElementById('phone')?.value.trim() || '0000000000',
            hb: parseFloat(document.getElementById('hp')?.value) || 0.0,
            pcv: parseFloat(document.getElementById('pcv')?.value) || 0.0,
            mch: parseFloat(document.getElementById('mch')?.value) || 0.0,
            rbc: parseFloat(document.getElementById('rbc')?.value) || 0.0,
            mcv: parseFloat(document.getElementById('mcv')?.value) || 0.0,
            mchc: parseFloat(document.getElementById('mchc')?.value) || 0.0
        };
    }

    /**
     * 🔬 TRIGGER AI ANALYSIS
     */
    async function triggerAnalysis() {
        const data = getFormData();
        
        // UI Feedback for Judges
        analyseBtn.innerHTML = "<span><i class='fas fa-microscope fa-spin'></i> AI Analyzing...</span>";
        analyseBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Clinical Pipeline Offline');

            // 💾 Capture generated PDF
            lastReportBlob = await response.blob();
            lastReportName = `HemoScan_${data.name.replace(/\s+/g, '_')}.pdf`;

            alert(`✅ Success! Analysis stored in Archives for ${data.name}. \n\nYou can now download the PDF or notify the patient via the Dashboard.`);
            
            // 🧹 Reset for next patient while keeping blob in memory
            patientForm.reset();

        } catch (error) {
            console.error('Pipeline Error:', error);
            alert('❌ Connection Failed! Ensure the Node.js server is running on Port 5000.');
        } finally {
            analyseBtn.innerHTML = "Analyse Data";
            analyseBtn.disabled = false;
        }
    }

    /**
     * ⬇️ DOWNLOAD REPORT
     */
    function handleDownload() {
        if (!lastReportBlob) {
            alert('⚠️ No active report. Please run "Analyse Data" first.');
            return;
        }

        const url = window.URL.createObjectURL(lastReportBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = lastReportName;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // --- 🎯 Event Listeners ---
    analyseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerAnalysis();
    });

    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleDownload();
    });

    patientForm.addEventListener('submit', (e) => e.preventDefault());

})();
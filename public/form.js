(function() {
    'use strict';
    
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');
    const analyseBtn = document.getElementById('analyseBtn');

    // CONFIG: Gateway URL (Node.js Server)
    const API_BASE_URL = "http://localhost:5000/api";

    if (!downloadBtn || !printBtn || !analyseBtn) {
        console.error('Buttons not found! Check your HTML IDs.');
        return;
    }

    /**
     * 1. Data Collection Helper
     */
    function getFormData() {
        const radios = document.getElementsByName('gender');
        let gender = 'm';
        for (let r of radios) { if (r.checked) { gender = r.value; break; } }

        return {
            name: document.getElementById('fullName')?.value.trim() || 'Patient',
            phone: document.getElementById('phone')?.value.trim() || '0000000000',
            age: document.getElementById('age')?.value || 0,
            gender: gender,
            hb: document.getElementById('hp')?.value || 0, 
            rbc: document.getElementById('rbc')?.value || 0,
            pcv: document.getElementById('pcv')?.value || 0,
            mcv: document.getElementById('mcv')?.value || 0,
            mch: document.getElementById('mch')?.value || 0,
            mchc: document.getElementById('mchc')?.value || 0
        };
    }

    /**
     * 2. ANALYSE: Triggers the AI pipeline and saves record
     */
    async function triggerAnalysis() {
        const data = getFormData();
        analyseBtn.innerHTML = "<span>⏳ Processing...</span>";
        analyseBtn.disabled = true;

        try {
            // A. POST to Node.js /api/predict (Triggers FastAPI + Gemini)
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('AI Engine Offline');

            // B. Log record to local JSON history
            await fetch(`${API_BASE_URL}/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            alert(`✅ AI Analysis for ${data.name} successful!`);
        } catch (error) {
            console.error('Analysis error:', error);
            alert('❌ Failed to connect to AI Engine. Ensure Node.js and FastAPI are running.');
        } finally {
            analyseBtn.innerHTML = "Analyse Data";
            analyseBtn.disabled = false;
        }
    }

    /**
     * 3. UNIVERSAL DOWNLOAD: Handles PDF or JSON dynamically
     */
    async function handleDownload() {
        const data = getFormData();
        downloadBtn.innerHTML = "<span>⏳ Fetching...</span>";
        downloadBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Download failed');

            // Detect MIME type and Filename from Headers
            const contentType = response.headers.get('content-type');
            const disposition = response.headers.get('content-disposition');
            let filename = `HemoScan_${data.name.replace(/\s+/g, '_')}`;

            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '');
            } else {
                filename += contentType.includes('pdf') ? '.pdf' : '.json';
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Download error:', error);
            alert('❌ Download failed. Run Analysis first.');
        } finally {
            downloadBtn.innerHTML = "Download Report";
            downloadBtn.disabled = false;
        }
    }

    // --- Listeners ---
    analyseBtn.addEventListener('click', (e) => { e.preventDefault(); triggerAnalysis(); });
    downloadBtn.addEventListener('click', (e) => { e.preventDefault(); handleDownload(); });
    printBtn.addEventListener('click', (e) => { e.preventDefault(); window.print(); });

    // UI Feedback
    [downloadBtn, printBtn, analyseBtn].forEach(btn => {
        btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.96)');
        btn.addEventListener('mouseup', () => btn.style.transform = '');
        btn.addEventListener('mouseleave', () => btn.style.transform = '');
    });

})();
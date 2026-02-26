 (function() {
      'use strict';
      
      const downloadBtn = document.getElementById('downloadBtn');
      const printBtn = document.getElementById('printBtn');
      const analyseBtn = document.getElementById('analyseBtn');

      if (!downloadBtn || !printBtn || !analyseBtn) {
        console.error('Buttons not found!');
        return;
      }

      // helper: get current form values
      function getFormData() {
        const nameField = document.getElementById('fullName');
        const Name = nameField ? nameField.value.trim() : '';

        const ageField = document.getElementById('age');
        const Age = ageField && ageField.value !== '' ? parseFloat(ageField.value) : null;

        // gender (may be none checked → empty string)
        let gender = '';
        const radios = document.getElementsByName('gender');
        for (let r of radios) {
          if (r.checked) {
            gender = r.value;
            break;
          }
        }

        const hpField = document.getElementById('hp');
        const Hp = hpField && hpField.value !== '' ? parseFloat(hpField.value) : null;

        const rbcField = document.getElementById('rbc');
        const Rbc = rbcField && rbcField.value !== '' ? parseFloat(rbcField.value) : null;

        const pcvField = document.getElementById('pcv');
        const Pcv = pcvField && pcvField.value !== '' ? parseFloat(pcvField.value) : null;

        const mcvField = document.getElementById('mcv');
        const Mcv = mcvField && mcvField.value !== '' ? parseFloat(mcvField.value) : null;

        const mchField = document.getElementById('mch');
        const Mch = mchField && mchField.value !== '' ? parseFloat(mchField.value) : null;

        const mchcField = document.getElementById('mchc');
        const Mchc = mchcField && mchcField.value !== '' ? parseFloat(mchcField.value) : null;

        return {
          Name: Name || 'Not provided',
          Age: Age,
          gender: gender || 'not specified',
          Hp: Hp,
          Rbc: Rbc,
          Pcv: Pcv,
          Mcv: Mcv,
          Mch: Mch,
          Mchc: Mchc
        };
      }

      // DOWNLOAD JSON
      function downloadJSON(data, filename = 'patient_data.json') {
        try {
          const jsonStr = JSON.stringify(data, (key, value) => value === null ? null : value, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
        } catch (error) {
          console.error('Download failed:', error);
          alert('Download failed. Please try again.');
        }
      }

      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const formData = getFormData();

        const namePart = formData.Name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '') || 'Patient';
        const date = new Date().toISOString().slice(0,10);
        downloadJSON(formData, `CBC_${namePart}_${date}.json`);

        // subtle animation
        downloadBtn.style.transform = 'scale(0.96)';
        setTimeout(() => downloadBtn.style.transform = '', 150);
      });

      // PRINT function
      function openPrintWindow() {
        // Check if pop-ups are blocked
        const testWindow = window.open('', '_blank');
        if (!testWindow) {
          alert('Please enable pop-ups for this site to use the print feature.');
          return;
        }
        testWindow.close();

        const data = getFormData();

        const displayValue = (val) => {
          if (val === null || val === undefined || val === '') return '—';
          return val;
        };

        const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
        if (!printWindow) {
          alert('Unable to open print window. Please check your pop-up blocker.');
          return;
        }

        const styles = `
          <style>
            * { font-family: 'Inter', 'Segoe UI', Roboto, sans-serif; margin:0; padding:0; box-sizing:border-box; }
            body { background: #f2f7fc; padding: 2rem; display: flex; justify-content: center; }
            .print-card { max-width: 780px; width:100%; background: white; border-radius: 28px; padding: 2.5rem; box-shadow: 0 20px 30px rgba(0,30,60,0.1); }
            h1 { font-size: 2.2rem; color: #123f60; margin-bottom: 0.2rem; border-bottom: 3px solid #cbddec; padding-bottom: 0.5rem; }
            .lab-id { color: #416e94; margin-bottom: 2rem; font-size: 0.95rem; }
            .grid-summary { display: grid; grid-template-columns: repeat(2,1fr); gap: 1.5rem 2rem; }
            .item { border-bottom: 1px dashed #bdd2e8; padding-bottom: 0.5rem; }
            .item-label { font-size: 0.8rem; text-transform: uppercase; color: #51748e; letter-spacing: 0.3px; }
            .item-value { font-size: 1.7rem; font-weight: 600; color: #103755; }
            .gender-badge { background: #d9e9ff; padding: 0.3rem 1.5rem; border-radius: 40px; display: inline-block; margin-top: 0.3rem; font-weight: 500; }
            .footer-note { margin-top: 2.5rem; color: #6d8fae; font-size: 0.8rem; text-align: center; border-top: 2px solid #e2effb; padding-top: 1.5rem; }
            @media print { body { background: white; padding: 0.5in; } .print-card { box-shadow: none; padding: 0; } }
          </style>
        `;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>Patient summary – ${data.Name || 'Unnamed'}</title>${styles}</head>
          <body>
            <div class="print-card">
              <h1>🩺 HematoCase · summary</h1>
              <div class="lab-id">complete blood count (based on your entries)</div>

              <div style="margin-bottom: 2rem;">
                <span class="gender-badge">${data.gender ? data.gender.toUpperCase() : 'NOT SPECIFIED'}</span>
              </div>

              <div class="grid-summary">
                <div class="item"><div class="item-label">Full name</div><div class="item-value">${displayValue(data.Name)}</div></div>
                <div class="item"><div class="item-label">Age (years)</div><div class="item-value">${displayValue(data.Age)}</div></div>
                <div class="item"><div class="item-label">Hp (g/dL)</div><div class="item-value">${displayValue(data.Hp)}</div></div>
                <div class="item"><div class="item-label">Rbc (M/µL)</div><div class="item-value">${displayValue(data.Rbc)}</div></div>
                <div class="item"><div class="item-label">Pcv (%)</div><div class="item-value">${displayValue(data.Pcv)}</div></div>
                <div class="item"><div class="item-label">Mcv (fL)</div><div class="item-value">${displayValue(data.Mcv)}</div></div>
                <div class="item"><div class="item-label">Mch (pg)</div><div class="item-value">${displayValue(data.Mch)}</div></div>
                <div class="item"><div class="item-label">Mchc (g/dL)</div><div class="item-value">${displayValue(data.Mchc)}</div></div>
              </div>

              <div class="footer-note">
                📄 generated · ${new Date().toLocaleString()}<br>
                <span style="opacity:0.6;">print or save as PDF using your browser</span>
              </div>
            </div>
            <script>
              window.onload = function() { 
                window.focus(); 
                setTimeout(function() { window.print(); }, 500);
              };
            <\/script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }

      printBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openPrintWindow();
        printBtn.style.transform = 'scale(0.96)';
        setTimeout(() => printBtn.style.transform = '', 150);
      });

      // ANALYSE function - validates and shows analysis
      function analyseData() {
        const data = getFormData();
        
        // Validation checks
        const missingFields = [];
        if (!data.Name || data.Name === 'Not provided') missingFields.push('Name');
        if (data.Age === null) missingFields.push('Age');
        if (!data.gender || data.gender === 'not specified') missingFields.push('Gender');
        if (data.Hp === null) missingFields.push('Hp');
        if (data.Rbc === null) missingFields.push('Rbc');
        if (data.Pcv === null) missingFields.push('Pcv');
        if (data.Mcv === null) missingFields.push('Mcv');
        if (data.Mch === null) missingFields.push('Mch');
        if (data.Mchc === null) missingFields.push('Mchc');

        if (missingFields.length > 0) {
          alert(`⚠️ Please fill in the following fields:\n- ${missingFields.join('\n- ')}`);
          return false;
        }

        // Professional reference ranges (general adult)
        const ranges = {
          Hp: { low: 12.0, high: 16.0, unit: 'g/dL', name: 'Hemoglobin' },
          Rbc: { low: 4.2, high: 5.8, unit: 'M/µL', name: 'Red Blood Cells' },
          Pcv: { low: 37, high: 47, unit: '%', name: 'Hematocrit' },
          Mcv: { low: 80, high: 100, unit: 'fL', name: 'Mean Cell Volume' },
          Mch: { low: 27, high: 34, unit: 'pg', name: 'Mean Cell Hemoglobin' },
          Mchc: { low: 32, high: 36, unit: 'g/dL', name: 'MCHC' }
        };

        // Build analysis message
        let analysisMsg = `🔬 ANALYSIS REPORT for ${data.Name}\n`;
        analysisMsg += `Age: ${data.Age} years | Gender: ${data.gender}\n`;
        analysisMsg += `─${'─'.repeat(40)}\n\n`;

        const flags = [];
        
        // Check each parameter
        const checkParam = (param, value, range) => {
          if (value === null) return;
          const status = value < range.low ? '⬇️ LOW' : (value > range.high ? '⬆️ HIGH' : '✅ Normal');
          if (status !== '✅ Normal') {
            flags.push(`${param}: ${value} ${range.unit} (${status})`);
          }
          analysisMsg += `${range.name} (${param}): ${value} ${range.unit}  |  `;
          analysisMsg += `Reference: ${range.low}-${range.high}  |  ${status}\n`;
        };

        checkParam('Hp', data.Hp, ranges.Hp);
        checkParam('Rbc', data.Rbc, ranges.Rbc);
        checkParam('Pcv', data.Pcv, ranges.Pcv);
        checkParam('Mcv', data.Mcv, ranges.Mcv);
        checkParam('Mch', data.Mch, ranges.Mch);
        checkParam('Mchc', data.Mchc, ranges.Mchc);

        analysisMsg += `\n${'─'.repeat(50)}\n`;
        
        if (flags.length === 0) {
          analysisMsg += `\n✅ SUMMARY: All parameters are within normal ranges.\n`;
        } else {
          analysisMsg += `\n⚠️ ABNORMAL FINDINGS:\n`;
          flags.forEach(flag => analysisMsg += `  • ${flag}\n`);
        }

        analysisMsg += `\n📊 This is a preliminary analysis. Always consult a healthcare provider.`;

        // Show in a nice alert/prompt (using console for long text, but alert works)
        // For better UX, we'll create a modal-like popup
        const analysisWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=yes');
        if (analysisWindow) {
          analysisWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Analysis - ${data.Name}</title>
              <style>
                body { font-family: 'Inter', monospace; padding: 2rem; background: #f5f9ff; }
                pre { background: white; padding: 2rem; border-radius: 24px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
                h2 { color: #123f60; }
              </style>
            </head>
            <body>
              <h2>🔬 CBC Analysis</h2>
              <pre>${analysisMsg}</pre>
              <p style="text-align:center; margin-top:20px;"><button onclick="window.print()" style="padding:10px 30px; border-radius:40px; background:#1a405e; color:white; border:none; cursor:pointer;">🖨️ Print Analysis</button></p>
            </body>
            </html>
          `);
          analysisWindow.document.close();
        } else {
          // Fallback to console and alert
          console.log(analysisMsg);
          alert('Analysis complete. Check console for details (F12).');
        }

        return true;
      }

      analyseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        analyseData();
        analyseBtn.style.transform = 'scale(0.96)';
        setTimeout(() => analyseBtn.style.transform = '', 150);
      });

      // remove scale on mouse leave
      [downloadBtn, printBtn, analyseBtn].forEach(btn => {
        btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.96)');
        btn.addEventListener('mouseup', () => btn.style.transform = '');
        btn.addEventListener('mouseleave', () => btn.style.transform = '');
      });

    })();
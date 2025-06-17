import express from 'express';
import puppeteer from 'puppeteer';
import { pool } from '../database/init.js';
import { auditLog } from '../middleware/auth.js';

const router = express.Router();

// Generate PDF report for patient
router.post('/patient/:patientId', auditLog('EXPORT_PDF', 'PATIENT'), async (req, res) => {
  let browser;
  
  try {
    const { patientId } = req.params;
    const { dateFrom, dateTo, includeSignatures = true } = req.body;

    // Get patient data
    const patientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1 AND active = true',
      [patientId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patient = patientResult.rows[0];

    // Get treatments data
    let treatmentsQuery = `
      SELECT t.*, u.name as dentist_name
      FROM treatments t
      LEFT JOIN users u ON t.dentist_id = u.id
      WHERE t.patient_id = $1
    `;

    const queryParams = [patientId];
    let paramIndex = 2;

    if (dateFrom) {
      treatmentsQuery += ` AND t.date >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      treatmentsQuery += ` AND t.date <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    treatmentsQuery += ' ORDER BY t.date DESC';

    const treatmentsResult = await pool.query(treatmentsQuery, queryParams);
    const treatments = treatmentsResult.rows;

    // Generate HTML content
    const htmlContent = generatePDFHTML(patient, treatments, includeSignatures, req.user);

    // Generate PDF using Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      printBackground: true
    });

    await browser.close();

    // Set response headers for PDF download
    const filename = `prontuario_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    if (browser) {
      await browser.close();
    }
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

// Generate HTML content for PDF
function generatePDFHTML(patient, treatments, includeSignatures, generatedBy) {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR');

  const odontogramHTML = generateOdontogramHTML(treatments);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prontuário - ${patient.name}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        
        .header {
          background: linear-gradient(135deg, #0066CC, #004499);
          color: white;
          padding: 20px;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .clinic-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .patient-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .patient-info h2 {
          color: #0066CC;
          border-bottom: 2px solid #0066CC;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .info-item {
          margin-bottom: 10px;
        }
        
        .info-label {
          font-weight: bold;
          color: #555;
        }
        
        .odontogram {
          margin: 30px 0;
          text-align: center;
        }
        
        .odontogram h3 {
          color: #0066CC;
          margin-bottom: 20px;
        }
        
        .teeth-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 5px;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .tooth {
          width: 40px;
          height: 40px;
          border: 2px solid #ddd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
        
        .tooth.treated {
          background-color: #0066CC;
          color: white;
          border-color: #0066CC;
        }
        
        .treatments {
          margin-top: 30px;
        }
        
        .treatments h3 {
          color: #0066CC;
          border-bottom: 2px solid #0066CC;
          padding-bottom: 10px;
        }
        
        .treatment {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .treatment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .treatment-date {
          font-weight: bold;
          color: #0066CC;
        }
        
        .treatment-dentist {
          color: #666;
          font-size: 14px;
        }
        
        .treatment-details {
          margin-bottom: 15px;
        }
        
        .teeth-involved {
          background: #e3f2fd;
          padding: 5px 10px;
          border-radius: 4px;
          display: inline-block;
          margin-right: 10px;
          font-size: 12px;
        }
        
        .procedure {
          font-weight: bold;
          color: #0066CC;
          margin: 10px 0;
        }
        
        .observations {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin: 10px 0;
          border-left: 4px solid #0066CC;
        }
        
        .signature {
          margin-top: 20px;
          text-align: center;
        }
        
        .signature img {
          max-width: 200px;
          max-height: 80px;
          border: 1px solid #ddd;
          padding: 10px;
          background: white;
        }
        
        .footer {
          margin-top: 50px;
          padding: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        @media print {
          .treatment {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="clinic-name">Clínica Odontológica</div>
        <div class="subtitle">Prontuário Eletrônico</div>
      </div>

      <div class="patient-info">
        <h2>Dados do Paciente</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Nome:</div>
            <div>${patient.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">CPF:</div>
            <div>${patient.cpf || 'Não informado'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Data de Nascimento:</div>
            <div>${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Telefone:</div>
            <div>${patient.phone || 'Não informado'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email:</div>
            <div>${patient.email || 'Não informado'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Data de Cadastro:</div>
            <div>${new Date(patient.created_at).toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
      </div>

      ${odontogramHTML}

      <div class="treatments">
        <h3>Histórico de Tratamentos (${treatments.length} registros)</h3>
        
        ${treatments.map(treatment => `
          <div class="treatment">
            <div class="treatment-header">
              <div class="treatment-date">
                ${new Date(treatment.date).toLocaleDateString('pt-BR')} às ${new Date(treatment.date).toLocaleTimeString('pt-BR')}
              </div>
              <div class="treatment-dentist">
                Dr(a). ${treatment.dentist_name}
              </div>
            </div>
            
            <div class="treatment-details">
              ${treatment.teeth && treatment.teeth.length > 0 ? `
                <div>
                  <strong>Dentes envolvidos:</strong>
                  ${treatment.teeth.map(tooth => `<span class="teeth-involved">${tooth}</span>`).join('')}
                </div>
              ` : ''}
              
              <div class="procedure">
                Procedimento: ${treatment.procedure}
              </div>
              
              <div>
                <strong>Status:</strong> ${treatment.status === 'completed' ? 'Concluído' : 'Em andamento'}
              </div>
              
              ${treatment.observations ? `
                <div class="observations">
                  <strong>Observações:</strong><br>
                  ${treatment.observations}
                </div>
              ` : ''}
            </div>
            
            ${includeSignatures && treatment.signature ? `
              <div class="signature">
                <div><strong>Assinatura Digital:</strong></div>
                <img src="${treatment.signature}" alt="Assinatura">
                <div><small>Hash: ${treatment.signature_hash}</small></div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <div>Relatório gerado em ${currentDate} às ${currentTime}</div>
        <div>Por: ${generatedBy.name} (${generatedBy.email})</div>
        <div>Sistema de Prontuário Eletrônico Odontológico</div>
      </div>
    </body>
    </html>
  `;
}

// Generate odontogram HTML
function generateOdontogramHTML(treatments) {
  const treatedTeeth = new Set();
  
  treatments.forEach(treatment => {
    if (treatment.teeth) {
      treatment.teeth.forEach(tooth => treatedTeeth.add(tooth));
    }
  });

  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  return `
    <div class="odontogram">
      <h3>Odontograma</h3>
      <div style="margin-bottom: 20px;">
        <div class="teeth-grid">
          ${upperTeeth.map(tooth => `
            <div class="tooth ${treatedTeeth.has(tooth) ? 'treated' : ''}">
              ${tooth}
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <div class="teeth-grid">
          ${lowerTeeth.map(tooth => `
            <div class="tooth ${treatedTeeth.has(tooth) ? 'treated' : ''}">
              ${tooth}
            </div>
          `).join('')}
        </div>
      </div>
      <div style="margin-top: 15px; font-size: 12px;">
        <span style="color: #0066CC;">●</span> Dentes com tratamento registrado
      </div>
    </div>
  `;
}

export default router;
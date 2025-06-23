import express from 'express';
import { pool } from '../database/init.js';
import { auditLog } from '../middleware/auth.js';

const router = express.Router();

// Generate PDF report for patient (versão simplificada)
router.post('/patient/:patientId', auditLog('EXPORT_PDF', 'PATIENT'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { dateFrom, dateTo } = req.body;

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

    // Return JSON data instead of PDF for now
    const reportData = {
      patient: {
        id: patient.id,
        name: patient.name,
        cpf: patient.cpf,
        birth_date: patient.birth_date,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        created_at: patient.created_at
      },
      treatments: treatments.map(t => ({
        id: t.id,
        date: t.date,
        teeth: t.teeth,
        procedure: t.procedure,
        observations: t.observations,
        status: t.status,
        dentist_name: t.dentist_name
      })),
      generated_at: new Date().toISOString(),
      generated_by: req.user.name
    };

    // For now, return JSON. PDF generation will be added later
    res.json({
      message: "PDF generation temporarily disabled. Here's the data:",
      data: reportData,
      note: "PDF generation will be restored in next update"
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

export default router;

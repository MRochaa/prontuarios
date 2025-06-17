import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { pool } from '../database/init.js';
import { auditLog } from '../middleware/auth.js';
import { sendToN8n, N8nEvents, notifyTreatmentCreated } from '../integrations/n8n.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for treatment photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/treatments'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'treatment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, and PDF files are allowed'));
    }
  }
});

// Get treatments for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20, tooth, procedure, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, u.name as dentist_name
      FROM treatments t
      LEFT JOIN users u ON t.dentist_id = u.id
      WHERE t.patient_id = $1
    `;

    const queryParams = [patientId];
    let paramIndex = 2;

    if (tooth) {
      query += ` AND $${paramIndex} = ANY(t.teeth)`;
      queryParams.push(parseInt(tooth));
      paramIndex++;
    }

    if (procedure) {
      query += ` AND t.procedure ILIKE $${paramIndex}`;
      queryParams.push(`%${procedure}%`);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND t.date >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND t.date <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    query += ` ORDER BY t.date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (error) {
    console.error('Get treatments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single treatment
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name as dentist_name, p.name as patient_name
      FROM treatments t
      LEFT JOIN users u ON t.dentist_id = u.id
      LEFT JOIN patients p ON t.patient_id = p.id
      WHERE t.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get treatment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new treatment
router.post('/', upload.array('photos', 5), auditLog('CREATE', 'TREATMENT'), async (req, res) => {
  try {
    const { patient_id, teeth, procedure, observations, status = 'in_progress', signature } = req.body;

    if (!patient_id || !procedure) {
      return res.status(400).json({ message: 'Patient ID and procedure are required' });
    }

    // Process uploaded photos
    const photos = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/treatments/${file.filename}`,
      originalName: file.originalname,
      size: file.size
    })) : [];

    // Parse teeth array
    const teethArray = teeth ? JSON.parse(teeth) : [];

    // Generate signature hash if signature provided
    let signatureHash = null;
    if (signature) {
      signatureHash = crypto.createHash('sha256').update(signature + Date.now()).digest('hex');
    }

    const result = await pool.query(`
      INSERT INTO treatments (patient_id, dentist_id, teeth, procedure, observations, status, signature, signature_hash, photos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [patient_id, req.user.id, teethArray, procedure, observations, status, signature, signatureHash, JSON.stringify(photos)]);

    // Send webhook notification
    try {
      await sendWebhook('treatment_created', {
        treatment: result.rows[0],
        patient_id,
        dentist: req.user.name
      });
    } catch (webhookError) {
      console.warn('Webhook notification failed:', webhookError);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create treatment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update treatment
router.put('/:id', upload.array('photos', 5), auditLog('UPDATE', 'TREATMENT'), async (req, res) => {
  try {
    const { teeth, procedure, observations, status, signature } = req.body;
    const treatmentId = req.params.id;

    // Check if treatment exists
    const existingTreatment = await pool.query(
      'SELECT * FROM treatments WHERE id = $1',
      [treatmentId]
    );

    if (existingTreatment.rows.length === 0) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    // Process new photos
    const newPhotos = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/treatments/${file.filename}`,
      originalName: file.originalname,
      size: file.size
    })) : [];

    // Merge with existing photos
    const existingPhotos = existingTreatment.rows[0].photos || [];
    const allPhotos = [...existingPhotos, ...newPhotos];

    const teethArray = teeth ? JSON.parse(teeth) : existingTreatment.rows[0].teeth;

    // Generate new signature hash if signature updated
    let signatureHash = existingTreatment.rows[0].signature_hash;
    if (signature && signature !== existingTreatment.rows[0].signature) {
      signatureHash = crypto.createHash('sha256').update(signature + Date.now()).digest('hex');
    }

    const result = await pool.query(`
      UPDATE treatments 
      SET teeth = $1, procedure = COALESCE($2, procedure), observations = COALESCE($3, observations), 
          status = COALESCE($4, status), signature = COALESCE($5, signature), 
          signature_hash = COALESCE($6, signature_hash), photos = COALESCE($7, photos), 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [teethArray, procedure, observations, status, signature, signatureHash, JSON.stringify(allPhotos), treatmentId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update treatment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete treatment
router.delete('/:id', auditLog('DELETE', 'TREATMENT'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM treatments WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    res.json({ message: 'Treatment deleted successfully' });
  } catch (error) {
    console.error('Delete treatment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available procedures for autocomplete
router.get('/procedures/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, category FROM procedures WHERE active = true ORDER BY name'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get procedures error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Webhook helper function
async function sendWebhook(eventType, data) {
  try {
    const webhookResult = await pool.query(
      'SELECT url, headers FROM webhooks_config WHERE event_type = $1 AND active = true',
      [eventType]
    );

    for (const webhook of webhookResult.rows) {
      const headers = {
        'Content-Type': 'application/json',
        ...webhook.headers
      };

      await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          data
        })
      });
    }
  } catch (error) {
    throw new Error(`Webhook error: ${error.message}`);
  }
}

export default router;
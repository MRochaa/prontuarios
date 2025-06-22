import express from 'express';
import multer from 'multer';
import { pool } from '../database/init.js';
import { auditLog } from '../middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/patients'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'patient-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
    }
  }
});

// Get all patients with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.name as created_by_name
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.active = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.cpf ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM patients WHERE active = true';
    const countParams = [];

    if (search) {
      countQuery += ' AND (name ILIKE $1 OR cpf ILIKE $1)';
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      patients: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as created_by_name
      FROM patients p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1 AND p.active = true
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new patient
router.post('/', upload.single('photo'), auditLog('CREATE', 'PATIENT'), async (req, res) => {
  try {
    const { name, cpf, birth_date, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if CPF already exists
    if (cpf) {
      const existingPatient = await pool.query(
        'SELECT id FROM patients WHERE cpf = $1 AND active = true',
        [cpf]
      );
      if (existingPatient.rows.length > 0) {
        return res.status(400).json({ message: 'Patient with this CPF already exists' });
      }
    }

    const photoUrl = req.file ? `/uploads/patients/${req.file.filename}` : null;
    
    // Handle address - if it's a string, convert to JSON object
    let addressJson = null;
    if (address) {
      if (typeof address === 'string') {
        try {
          // Try to parse as JSON first
          addressJson = JSON.parse(address);
        } catch {
          // If not JSON, treat as simple string and create object
          addressJson = { street: address };
        }
      } else {
        addressJson = address;
      }
    }

    const result = await pool.query(`
      INSERT INTO patients (name, cpf, birth_date, phone, email, address, photo_url, created_by, consent_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `, [name, cpf, birth_date, phone, email, addressJson, photoUrl, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update patient
router.put('/:id', upload.single('photo'), auditLog('UPDATE', 'PATIENT'), async (req, res) => {
  try {
    const { name, cpf, birth_date, phone, email, address } = req.body;
    const patientId = req.params.id;

    // Check if patient exists
    const existingPatient = await pool.query(
      'SELECT * FROM patients WHERE id = $1 AND active = true',
      [patientId]
    );

    if (existingPatient.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if CPF is being changed and already exists
    if (cpf && cpf !== existingPatient.rows[0].cpf) {
      const cpfExists = await pool.query(
        'SELECT id FROM patients WHERE cpf = $1 AND active = true AND id != $2',
        [cpf, patientId]
      );
      if (cpfExists.rows.length > 0) {
        return res.status(400).json({ message: 'Patient with this CPF already exists' });
      }
    }

    const photoUrl = req.file ? `/uploads/patients/${req.file.filename}` : existingPatient.rows[0].photo_url;
    
    // Handle address update
    let addressJson = existingPatient.rows[0].address;
    if (address) {
      if (typeof address === 'string') {
        try {
          addressJson = JSON.parse(address);
        } catch {
          addressJson = { street: address };
        }
      } else {
        addressJson = address;
      }
    }

    const result = await pool.query(`
      UPDATE patients 
      SET name = $1, cpf = $2, birth_date = $3, phone = $4, email = $5, 
          address = $6, photo_url = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, cpf, birth_date, phone, email, addressJson, photoUrl, patientId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Soft delete patient (LGPD compliance)
router.delete('/:id', auditLog('DELETE', 'PATIENT'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE patients SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export patient data (LGPD compliance)
router.get('/:id/export', auditLog('EXPORT', 'PATIENT'), async (req, res) => {
  try {
    const patientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1 AND active = true',
      [req.params.id]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const treatmentsResult = await pool.query(`
      SELECT t.*, u.name as dentist_name
      FROM treatments t
      LEFT JOIN users u ON t.dentist_id = u.id
      WHERE t.patient_id = $1
      ORDER BY t.date DESC
    `, [req.params.id]);

    const exportData = {
      patient: patientResult.rows[0],
      treatments: treatmentsResult.rows,
      exportDate: new Date().toISOString(),
      exportedBy: req.user.name
    };

    res.json(exportData);
  } catch (error) {
    console.error('Export patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
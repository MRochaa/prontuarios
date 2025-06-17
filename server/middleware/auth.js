import jwt from 'jsonwebtoken';
import { pool } from '../database/init.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dental-records-secret-key';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    try {
      // Verify user still exists and is active
      const result = await pool.query(
        'SELECT id, email, name, role, active FROM users WHERE id = $1 AND active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ message: 'User not found or inactive' });
      }

      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ message: 'Authentication error' });
    }
  });
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// Audit logging middleware
export function auditLog(action, entity) {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful operations (status < 400)
      if (res.statusCode < 400) {
        logAudit(req, action, entity, req.params.id || null);
      }
      originalSend.call(this, data);
    };
    
    next();
  };
}

async function logAudit(req, action, entity, entityId) {
  try {
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.user?.id || null,
      action,
      entity,
      entityId,
      JSON.stringify({ body: req.body, params: req.params, query: req.query }),
      req.ip,
      req.headers['user-agent']
    ]);
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
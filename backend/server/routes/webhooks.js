import express from 'express';
import { pool } from '../database/init.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// N8n webhook endpoint (public)
router.post('/n8n', async (req, res) => {
  try {
    const { event, data } = req.body;

    // Log the webhook reception
    await pool.query(`
      INSERT INTO audit_logs (action, entity, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, ['WEBHOOK_RECEIVED', 'N8N', JSON.stringify({ event, data }), req.ip, req.headers['user-agent']]);

    // Process the webhook based on event type
    switch (event) {
      case 'patient_reminder':
        // Handle patient reminder logic
        console.log('Patient reminder webhook received:', data);
        break;
      
      case 'backup_notification':
        // Handle backup notification
        console.log('Backup notification webhook received:', data);
        break;
      
      case 'system_alert':
        // Handle system alerts
        console.log('System alert webhook received:', data);
        break;
      
      default:
        console.log('Unknown webhook event:', event);
    }

    res.json({ message: 'Webhook processed successfully', event });
  } catch (error) {
    console.error('N8n webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Get webhook configurations (admin only)
router.get('/config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM webhooks_config ORDER BY event_type'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get webhook config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create or update webhook configuration (admin only)
router.post('/config', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { event_type, url, active = true, headers = {} } = req.body;

    if (!event_type || !url) {
      return res.status(400).json({ message: 'Event type and URL are required' });
    }

    // Check if configuration already exists
    const existingConfig = await pool.query(
      'SELECT id FROM webhooks_config WHERE event_type = $1',
      [event_type]
    );

    let result;
    if (existingConfig.rows.length > 0) {
      // Update existing configuration
      result = await pool.query(`
        UPDATE webhooks_config 
        SET url = $1, active = $2, headers = $3
        WHERE event_type = $4
        RETURNING *
      `, [url, active, JSON.stringify(headers), event_type]);
    } else {
      // Create new configuration
      result = await pool.query(`
        INSERT INTO webhooks_config (event_type, url, active, headers)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [event_type, url, active, JSON.stringify(headers)]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Save webhook config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete webhook configuration (admin only)
router.delete('/config/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM webhooks_config WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Webhook configuration not found' });
    }

    res.json({ message: 'Webhook configuration deleted successfully' });
  } catch (error) {
    console.error('Delete webhook config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test webhook (admin only)
router.post('/test/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const configResult = await pool.query(
      'SELECT * FROM webhooks_config WHERE id = $1',
      [req.params.id]
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({ message: 'Webhook configuration not found' });
    }

    const config = configResult.rows[0];
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    const testData = {
      event: config.event_type,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook from the dental records system'
      }
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      res.json({ message: 'Webhook test successful', status: response.status });
    } else {
      res.status(400).json({ 
        message: 'Webhook test failed', 
        status: response.status,
        statusText: response.statusText
      });
    }
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ message: 'Webhook test failed', error: error.message });
  }
});

export default router;
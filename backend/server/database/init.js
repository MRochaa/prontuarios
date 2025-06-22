import pkg from 'pg';
const { Pool } = pkg;

// Database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/dental_records',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database with all required tables
export async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'dentist',
        name VARCHAR(255) NOT NULL,
        cro VARCHAR(20),
        active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Patients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        cpf VARCHAR(14) UNIQUE,
        birth_date DATE,
        phone VARCHAR(20),
        email VARCHAR(255),
        address JSONB,
        photo_url VARCHAR(500),
        consent_date TIMESTAMP,
        active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Treatments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS treatments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id UUID NOT NULL REFERENCES patients(id),
        dentist_id UUID NOT NULL REFERENCES users(id),
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        teeth INTEGER[],
        procedure VARCHAR(255) NOT NULL,
        observations TEXT,
        status VARCHAR(50) DEFAULT 'in_progress',
        signature TEXT,
        signature_hash VARCHAR(255),
        photos JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Procedures table (for autocomplete)
    await client.query(`
      CREATE TABLE IF NOT EXISTS procedures (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        default_price DECIMAL(10,2),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Webhooks configuration table
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhooks_config (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_type VARCHAR(100) NOT NULL,
        url VARCHAR(500) NOT NULL,
        active BOOLEAN DEFAULT true,
        headers JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs table (LGPD compliance)
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(100) NOT NULL,
        entity_id UUID,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_treatments_date ON treatments(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');

    // Insert default procedures
    await client.query(`
      INSERT INTO procedures (name, category) VALUES
      ('Consulta', 'Preventivo'),
      ('Limpeza', 'Preventivo'),
      ('Restauração', 'Restaurador'),
      ('Extração', 'Cirúrgico'),
      ('Canal', 'Endodontia'),
      ('Coroa', 'Protético'),
      ('Implante', 'Cirúrgico'),
      ('Clareamento', 'Estético')
      ON CONFLICT DO NOTHING
    `);

    console.log('Database tables created successfully');
  } finally {
    client.release();
  }
}
import pkg from 'pg';
const { Pool } = pkg;

// Database connection - Configuração unificada
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexão com banco estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error.message);
    throw error;
  }
}

// Initialize database with all required tables
export async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Inicializando estrutura do banco...');
    
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
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
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
        description TEXT,
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
    await client.query('CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_treatments_dentist ON treatments(dentist_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_treatments_date ON treatments(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');

    // Insert default procedures
    await client.query(`
      INSERT INTO procedures (name, category, description) VALUES
      ('Consulta', 'Preventivo', 'Consulta de rotina e avaliação'),
      ('Limpeza', 'Preventivo', 'Profilaxia e remoção de tártaro'),
      ('Restauração', 'Restaurador', 'Restauração com resina ou amálgama'),
      ('Extração', 'Cirúrgico', 'Extração dentária simples ou complexa'),
      ('Canal', 'Endodontia', 'Tratamento endodôntico'),
      ('Coroa', 'Protético', 'Coroa protética'),
      ('Implante', 'Cirúrgico', 'Implante dentário'),
      ('Clareamento', 'Estético', 'Clareamento dental'),
      ('Ortodontia', 'Ortodôntico', 'Aparelho ortodôntico'),
      ('Prótese', 'Protético', 'Prótese parcial ou total')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Estrutura do banco criada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar estrutura do banco:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Create default admin user if doesn't exist
export async function createDefaultAdmin() {
  const client = await pool.connect();
  
  try {
    const adminExists = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (adminExists.rows.length === 0) {
      // Import bcrypt here to avoid loading issues
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.default.hash('test_password', 12);
      
      await client.query(`
        INSERT INTO users (email, password_hash, name, role) 
        VALUES ($1, $2, $3, $4)
      `, ['admin@example.com', passwordHash, 'Admin User', 'admin']);
      
      console.log('✅ Usuário admin criado');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Senha: test_password');
    } else {
      console.log('ℹ️  Usuário admin já existe');
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    throw error;
  } finally {
    client.release();
  }
}

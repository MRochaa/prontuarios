import 'dotenv/config';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import { spawn } from 'child_process';
const { Pool } = pkg;

console.log('🚀 Sistema Odontológico - Iniciando...\n');

// Configuração do pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000
});

async function waitForDatabase(retries = 30) {
  console.log('⏳ Aguardando banco de dados...');
  
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Banco de dados está pronto!');
      return true;
    } catch (error) {
      console.log(`⏳ Tentativa ${i + 1}/${retries} - Aguardando banco...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Banco de dados não está disponível após múltiplas tentativas');
}

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('\n📊 Inicializando banco de dados...');
    
    // Criar extensão UUID
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Criar tabelas
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
    
    // Criar índices
    await client.query('CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_treatments_date ON treatments(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');
    
    // Verificar se admin existe
    const adminExists = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (adminExists.rows.length === 0) {
      // Criar senha hash para o admin
      const passwordHash = await bcrypt.hash('test_password', 12);
      
      await client.query(`
        INSERT INTO users (email, password_hash, name, role) 
        VALUES ($1, $2, $3, $4)
      `, ['admin@example.com', passwordHash, 'Admin User', 'admin']);
      
      console.log('✅ Usuário admin criado');
    }
    
    // Inserir procedimentos padrão
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
    
    console.log('✅ Banco de dados inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    // Não vamos falhar se o banco já estiver configurado
    if (error.code === '42P07') { // tabela já existe
      console.log('ℹ️  Banco já está configurado');
    } else {
      throw error;
    }
  } finally {
    client.release();
  }
}

async function startApplication() {
  try {
    // 1. Aguardar banco de dados
    await waitForDatabase();
    
    // 2. Inicializar estrutura do banco
    await initDatabase();
    
    // 3. Fechar pool antes de iniciar aplicação
    await pool.end();
    
    // 4. Iniciar aplicação principal
    console.log('\n🚀 Iniciando servidor...\n');
    const server = spawn('node', ['server/index.js'], {
      stdio: 'inherit',
      env: process.env
    });
    
    server.on('error', (error) => {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    });
    
    server.on('exit', (code) => {
      console.log(`Servidor finalizado com código ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Iniciar
startApplication();

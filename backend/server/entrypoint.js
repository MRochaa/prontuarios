import 'dotenv/config';
import { spawn } from 'child_process';
import { testConnection, initDatabase, createDefaultAdmin } from './database/init.js';

console.log('🚀 Sistema Odontológico - Iniciando...\n');

async function waitForDatabase(retries = 30, interval = 2000) {
  console.log('⏳ Aguardando banco de dados...');
  
  for (let i = 0; i < retries; i++) {
    try {
      await testConnection();
      console.log('✅ Banco de dados está pronto!');
      return true;
    } catch (error) {
      console.log(`⏳ Tentativa ${i + 1}/${retries} - Aguardando banco... (${error.message})`);
      
      if (i === retries - 1) {
        throw new Error(`Banco de dados não está disponível após ${retries} tentativas`);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

async function validateEnvironment() {
  console.log('🔍 Validando variáveis de ambiente...');
  
  const required = [
    'DB_HOST',
    'DB_PORT', 
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missing.forEach(env => console.error(`   - ${env}`));
    throw new Error(`Configure as variáveis: ${missing.join(', ')}`);
  }
  
  // Validar qualidade das chaves de segurança
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres');
  }
  
  if (process.env.ENCRYPTION_KEY.length < 16) {
    throw new Error('ENCRYPTION_KEY deve ter pelo menos 16 caracteres');
  }
  
  console.log('✅ Variáveis de ambiente validadas');
  console.log('✅ Chaves de segurança validadas');
}

async function startApplication() {
  try {
    // 1. Validar variáveis de ambiente
    await validateEnvironment();
    
    // 2. Aguardar banco de dados
    await waitForDatabase();
    
    // 3. Inicializar estrutura do banco
    await initDatabase();
    
    // 4. Criar usuário admin padrão
    await createDefaultAdmin();
    
    // 5. Mostrar resumo do sistema
    showSystemSummary();
    
    // 6. Iniciar aplicação principal
    console.log('\n🚀 Iniciando servidor web...\n');
    
    const server = spawn('node', ['server/index.js'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        // Garantir que as variáveis estejam disponíveis
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || '3001',
      }
    });
    
    // Handlers para o processo do servidor
    server.on('error', (error) => {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    });
    
    server.on('exit', (code, signal) => {
      if (signal) {
        console.log(`\n📡 Servidor interrompido pelo sinal ${signal}`);
      } else {
        console.log(`\n🔚 Servidor finalizado com código ${code}`);
      }
      process.exit(code || 0);
    });
    
    // Handler para interrupção graceful
    const handleShutdown = (signal) => {
      console.log(`\n📡 Recebido sinal ${signal}, finalizando servidor...`);
      server.kill(signal);
    };
    
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGUSR2', () => handleShutdown('SIGUSR2')); // Para nodemon
    
  } catch (error) {
    console.error('❌ Erro fatal durante inicialização:', error.message);
    console.error('\n🔧 Verifique:');
    console.error('   - Variáveis de ambiente configuradas');
    console.error('   - Banco PostgreSQL acessível');
    console.error('   - Permissões de rede');
    process.exit(1);
  }
}

function showSystemSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('🏥 SISTEMA DE PRONTUÁRIO ODONTOLÓGICO');
  console.log('='.repeat(60));
  console.log('🎉 Sistema inicializado com sucesso!');
  console.log('📊 Database: PostgreSQL conectado');
  console.log('🔐 Segurança: JWT e criptografia configurados');
  console.log('👤 Admin: Usuário criado');
  console.log('');
  console.log('📋 CREDENCIAIS DE ACESSO:');
  console.log('   📧 Email: admin@example.com');
  console.log('   🔑 Senha: DentalAdmin2024!SecurePass');
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('   1. Altere a senha após primeiro login');
  console.log('   2. Configure backup do banco de dados');
  console.log('   3. Monitore logs de segurança');
  console.log('');
  console.log('🌐 Acesse o sistema em seu domínio');
  console.log('='.repeat(60));
}

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  console.error('   Promise:', promise);
  process.exit(1);
});

// Iniciar aplicação
startApplication();

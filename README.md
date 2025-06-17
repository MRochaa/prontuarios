# 🦷 Sistema de Prontuário Odontológico

Sistema completo de gestão de prontuários eletrônicos para clínicas odontológicas, desenvolvido com React, Node.js e PostgreSQL.

## 🚀 Deploy Rápido no Coolify

### Pré-requisitos
- Coolify instalado
- PostgreSQL configurado
- Domínio configurado

### Configuração do Banco
Execute no seu PostgreSQL:
```sql
CREATE DATABASE dental_records;
\c dental_records;
-- Execute o script em database/init.sql
```

### Deploy no Coolify
1. Conecte este repositório no Coolify
2. Configure as variáveis de ambiente (veja .env.example)
3. Deploy automático!

## 🔧 Configuração

### Variáveis de Ambiente Obrigatórias
```env
# Banco de Dados
DB_HOST=seu-postgres-container
DB_PORT=5432
DB_NAME=dental_records
DB_USER=seu-usuario
DB_PASSWORD=sua-senha

# Segurança
JWT_SECRET=sua-chave-jwt-32-caracteres
ENCRYPTION_KEY=sua-chave-criptografia-32-chars

# N8n (opcional)
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/dental
```

## 📱 Funcionalidades

- ✅ Gestão completa de pacientes
- ✅ Prontuário eletrônico
- ✅ Tratamentos e procedimentos
- ✅ Upload de fotos e documentos
- ✅ Assinatura digital
- ✅ Relatórios e estatísticas
- ✅ Interface responsiva
- ✅ Integração com N8n
- ✅ Segurança LGPD

## 🔐 Acesso Padrão

- **Email:** admin@example.com
- **Senha:** test_password

⚠️ **Altere após primeiro login!**

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa em `/docs/`.


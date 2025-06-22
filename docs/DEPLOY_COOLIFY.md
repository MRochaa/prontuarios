# 🚀 Deploy no Coolify - Guia Completo

## 📋 Passo a Passo Detalhado

### **1. Preparar Repositório GitHub**

1. **Criar repositório no GitHub:**
   - Nome: `dental-system` (ou nome de sua escolha)
   - Visibilidade: Private (recomendado)

2. **Upload dos arquivos:**
   - Faça upload de todos os arquivos deste repositório
   - Commit: "Sistema odontológico completo"

### **2. Configurar Coolify**

#### 2.1 Criar Projeto
1. Acesse seu Coolify
2. Clique em "New Project"
3. Nome: `dental-system`
4. Clique em "Create"

#### 2.2 Adicionar Aplicação
1. Clique em "New Resource"
2. Escolha "Application"
3. **Configurações:**
   - Source Type: `Git Repository`
   - Repository URL: `https://github.com/seu-usuario/dental-system`
   - Branch: `main`
   - Base Directory: *(deixar vazio)*
   - Build Pack: `Docker Compose`

#### 2.3 Configurar Variáveis de Ambiente

**⚠️ IMPORTANTE:** Configure TODAS estas variáveis no Coolify:

```env
# === BANCO DE DADOS ===
DB_HOST=postgresql-v800oocgso8gs84004wskwcw
DB_PORT=5432
DB_NAME=dental_records
DB_USER=3v4WECUVm6ZZm6to
DB_PASSWORD=V5MiGRgqKGd58cpW8WXM9LfW49qwl3wY

# === SEGURANÇA (marcar como Secret) ===
JWT_SECRET=dental_jwt_secret_key_2024_muito_segura_32_caracteres_minimo
ENCRYPTION_KEY=dental_encryption_key_exatos_32_chars

# === FRONTEND ===
VITE_API_URL=/api

# === CONFIGURAÇÕES GERAIS ===
NODE_ENV=production
TZ=America/Sao_Paulo
LOG_LEVEL=info

# === N8N (OPCIONAL) ===
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/dental
N8N_SECRET=dental-n8n-secret-key
```

**🔒 Marcar como "Secret":**
- `DB_PASSWORD`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

#### 2.4 Configurar Domínio
1. Vá na aba "Domains"
2. Clique em "Add Domain"
3. **Configurações:**
   - Domain: `dental.seu-dominio.com`
   - SSL: ✅ Ativado
   - Port: `80`

### **3. Configurar DNS no Hostinger**

1. Acesse painel do Hostinger
2. Vá em "DNS Zone"
3. **Adicionar registro A:**
   - Type: `A`
   - Name: `dental`
   - Points to: `IP_DA_SUA_VPS`
   - TTL: `3600`

### **4. Deploy**

1. **No Coolify, clique em "Deploy"**
2. **Aguarde o build** (pode levar 5-10 minutos)
3. **Acompanhe os logs:**
   - Backend: Aguarda banco → Cria tabelas → Inicia servidor
   - Frontend: Build React → Configura Nginx → Inicia

### **5. Verificar Deploy**

#### 5.1 Verificar Saúde dos Serviços
- ✅ Backend: `https://dental.seu-dominio.com/api/health`
- ✅ Frontend: `https://dental.seu-dominio.com`

#### 5.2 Testar Login
- **URL:** `https://dental.seu-dominio.com`
- **Email:** `admin@example.com`
- **Senha:** `test_password`

### **6. Troubleshooting**

#### Problema: Backend "Unhealthy"
```bash
# Verificar logs do backend no Coolify
# Problemas comuns:
# - Erro de conexão com banco
# - Variáveis de ambiente incorretas
# - Timeout no health check
```

#### Problema: Frontend não carrega
```bash
# Verificar logs do frontend no Coolify
# Problemas comuns:
# - Erro no build do React
# - Configuração do Nginx
# - VITE_API_URL incorreta
```

#### Problema: DNS não propaga
```bash
# Verificar propagação DNS
# https://dnschecker.org
# Aguardar até 24h para propagação completa
```

### **7. Pós-Deploy**

#### 7.1 Alterar Senha Admin
1. Faça login com credenciais padrão
2. Vá em configurações de usuário
3. Altere a senha

#### 7.2 Configurar N8n (Opcional)
1. Configure webhook URL no N8n
2. Teste integração com eventos do sistema

#### 7.3 Backup
1. Configure backup automático no Coolify
2. Backup do banco PostgreSQL
3. Backup dos uploads (volume `dental_uploads`)

## 🎉 **Sistema Pronto!**

Após seguir todos os passos:
- **Frontend:** `https://dental.seu-dominio.com`
- **API:** `https://dental.seu-dominio.com/api`
- **Health Check:** `https://dental.seu-dominio.com/api/health`

**Credenciais iniciais:**
- Email: `admin@example.com`
- Senha: `test_password`


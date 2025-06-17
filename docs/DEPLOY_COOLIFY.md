# 🚀 Deploy no Coolify - Guia Completo

## 📋 Pré-requisitos

- ✅ Coolify instalado e funcionando
- ✅ PostgreSQL configurado (já feito!)
- ✅ Domínio configurado no Hostinger
- ✅ Repositório GitHub criado

## 🔧 Passo 1: Configurar Variáveis no Coolify

1. **Acesse seu Coolify** (https://seu-ip:8000)
2. **Vá em "Environment Variables"** ou "Secrets"
3. **Adicione as seguintes variáveis:**

```env
# Banco de Dados (OBRIGATÓRIO)
DB_HOST=postgresql-v800oocgso8gs84004wskwcw
DB_PORT=5432
DB_NAME=dental_records
DB_USER=3v4WECUVm6ZZm6to
DB_PASSWORD=V5MiGRgqKGd58cpW8WXM9LfW49qwl3wY

# Segurança (OBRIGATÓRIO - Configure como Secret)
JWT_SECRET=dental_jwt_secret_key_2024_muito_segura_32_caracteres_minimo
ENCRYPTION_KEY=dental_encryption_key_exatos_32_chars

# N8n (OPCIONAL)
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/dental
N8N_SECRET=dental-n8n-secret-key

# Configurações Gerais
NODE_ENV=production
TZ=America/Sao_Paulo
LOG_LEVEL=info
```

## 🚀 Passo 2: Criar Projeto no Coolify

1. **Novo Projeto:**
   - Nome: `dental-system`
   - Tipo: `Application`

2. **Configurar Source:**
   - Source Type: `Git Repository`
   - Repository URL: `https://github.com/seu-usuario/dental-system`
   - Branch: `main`

3. **Configurar Build:**
   - Build Pack: `Docker Compose`
   - Docker Compose File: `docker-compose.yml`

## 🌐 Passo 3: Configurar Domínio

1. **No Coolify:**
   - Domain: `dental.seu-dominio.com`
   - SSL: Ativado (Let's Encrypt)

2. **No Hostinger (DNS):**
   ```
   A    dental.seu-dominio.com    -> IP_DA_VPS
   ```

## ✅ Passo 4: Deploy

1. **Clique em "Deploy"**
2. **Aguarde o build** (pode levar alguns minutos)
3. **Verifique os logs** se houver erro

## 🧪 Passo 5: Testar

1. **Acesse:** `https://dental.seu-dominio.com`
2. **Login:**
   - Email: `admin@example.com`
   - Senha: `test_password`

## 🔧 Troubleshooting

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs
docker logs dental-backend
```

### Erro de Build
- Verificar se todas as variáveis estão configuradas
- Verificar logs do build no Coolify

### Erro de SSL
- Aguardar alguns minutos para Let's Encrypt
- Verificar se DNS está propagado

## 📞 Suporte

Se houver problemas:
1. Verificar logs no Coolify
2. Verificar se banco está acessível
3. Verificar variáveis de ambiente


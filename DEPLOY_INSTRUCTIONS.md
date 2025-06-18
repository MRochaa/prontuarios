# 🚀 Instruções de Deploy - Sistema Odontológico

## 📝 Arquivos para Atualizar no Git

### 1. Substitua estes arquivos pelos fornecidos:
- `Dockerfile`
- `package.json`
- `docker-compose.yml`
- `server/index.js`

### 2. Crie este novo arquivo:
- `server/entrypoint.js`

### 3. Faça o commit e push:
```bash
git add .
git commit -m "Fix deployment: auto-init database and update dependencies"
git push origin main
```

## ⚙️ Configuração no Coolify

### Variáveis de Ambiente (OBRIGATÓRIAS):
```env
# Banco de Dados
DB_HOST=postgresql-v800oocgso8gs84004wskwcw
DB_PORT=5432
DB_NAME=dental_records
DB_USER=3v4WECUVm6ZZm6to
DB_PASSWORD=V5MiGRgqKGd58cpW8WXM9LfW49qwl3wY

# Segurança
JWT_SECRET=dental_jwt_secret_key_2024_muito_segura_32_caracteres_minimo
ENCRYPTION_KEY=dental_encryption_key_exatos_32c

# Aplicação
NODE_ENV=production
PORT=3001
```

## 🎯 O que mudou:

1. **Inicialização Automática**: O banco será configurado automaticamente no primeiro deploy
2. **Sem package-lock.json**: Usa `npm install` ao invés de `npm ci`
3. **Entrypoint Inteligente**: Aguarda o banco estar pronto antes de iniciar
4. **Dependências Atualizadas**: Corrigidas versões deprecated

## ✅ Checklist pré-deploy:

- [ ] Todos os arquivos foram atualizados
- [ ] Commit e push realizados
- [ ] Variáveis configuradas no Coolify
- [ ] Build pack definido como "Docker Compose"

## 🔍 Após o Deploy:

1. Verifique os logs no Coolify
2. Procure por: "✅ Sistema pronto para uso!"
3. Acesse: https://seu-dominio.com/api/health

## 🚨 Em caso de erro:

- Verifique se as credenciais do banco estão corretas
- Confirme se o PostgreSQL está acessível
- Veja os logs completos no Coolify

## 🎉 Sucesso!

Quando funcionar, você verá:
- "✅ Banco de dados está pronto!"
- "✅ Banco de dados inicializado com sucesso!"
- "🏥 Servidor rodando na porta 3001"

Login padrão:
- Email: admin@example.com
- Senha: test_password

# 🦷 Sistema de Prontuário Odontológico Completo

Sistema completo de gestão de prontuários eletrônicos para clínicas odontológicas, com frontend React e backend Node.js.

## 🚀 Deploy Rápido no Coolify

### ✅ Pré-requisitos
- ✅ Coolify instalado
- ✅ PostgreSQL configurado (já feito!)
- ✅ Domínio configurado

### 🔧 Configuração no Coolify

1. **Criar Novo Projeto:**
   - Nome: `dental-system`
   - Tipo: `Application`

2. **Configurar Source:**
   - Repository: `https://github.com/seu-usuario/dental-system`
   - Branch: `main`
   - Build Pack: `Docker Compose`

3. **Configurar Variáveis de Ambiente:**
```env
# Banco de Dados
DB_HOST=postgresql-v800oocgso8gs84004wskwcw
DB_PORT=5432
DB_NAME=dental_records
DB_USER=3v4WECUVm6ZZm6to
DB_PASSWORD=V5MiGRgqKGd58cpW8WXM9LfW49qwl3wY

# Segurança (marcar como Secret)
JWT_SECRET=dental_jwt_secret_key_2024_muito_segura_32_caracteres_minimo
ENCRYPTION_KEY=dental_encryption_key_exatos_32_chars

# Frontend
VITE_API_URL=/api

# Configurações Gerais
NODE_ENV=production
TZ=America/Sao_Paulo
```

4. **Configurar Domínio:**
   - Domain: `dental.seu-dominio.com`
   - SSL: Ativado

## 📱 Funcionalidades

### 🔐 Autenticação
- Login seguro com JWT
- Controle de sessão
- Proteção de rotas

### 👥 Gestão de Pacientes
- Cadastro completo de pacientes
- Upload de fotos
- Histórico médico
- Busca avançada

### 🦷 Prontuário Eletrônico
- Odontograma interativo
- Registro de tratamentos
- Assinatura digital
- Timeline de evoluções

### 📊 Relatórios
- Dashboard com estatísticas
- Relatórios de tratamentos
- Exportação PDF
- Gráficos e métricas

### 🔗 Integrações
- N8n para automações
- Webhooks para eventos
- API REST completa

## 🔐 Acesso Padrão

- **Email:** admin@example.com
- **Senha:** test_password

⚠️ **Altere após primeiro login!**

## 🏗️ Arquitetura

```
dental-system/
├── backend/           # API Node.js + Express
│   ├── server/        # Código do servidor
│   └── package.json   # Dependências backend
├── frontend/          # React + TypeScript
│   ├── src/           # Código React
│   └── package.json   # Dependências frontend
├── docker-compose.yml # Orquestração
├── nginx.conf         # Proxy reverso
└── docs/              # Documentação
```

## 🛠️ Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/dental-system.git
cd dental-system

# Configure variáveis
cp .env.example .env

# Execute com Docker
docker-compose up -d
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs no Coolify
2. Consultar documentação em `/docs/`
3. Verificar variáveis de ambiente


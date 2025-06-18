# Dockerfile para o sistema odontológico
FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dental -u 1001 -G nodejs

# Criar diretório da aplicação
WORKDIR /app

# Copiar apenas package.json primeiro (para cache do Docker)
COPY package.json ./

# Instalar dependências (sem package-lock.json)
RUN npm install --omit=dev && npm cache clean --force

# Copiar todo o código da aplicação
COPY . .

# Criar diretórios necessários para uploads com permissões corretas
RUN mkdir -p /app/server/uploads/patients /app/server/uploads/treatments && \
    chmod -R 755 /app/server/uploads && \
    chown -R dental:nodejs /app/server/uploads && \
    chown -R dental:nodejs /app

# Mudar para usuário não-root
USER dental

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Comando para iniciar (usando entrypoint que inicializa o banco)
CMD ["node", "server/entrypoint.js"]

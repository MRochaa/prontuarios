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

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install --production && npm cache clean --force

# Copiar código da aplicação
COPY server/ ./server/

# Criar diretórios necessários para uploads com permissões corretas
RUN mkdir -p server/uploads/patients server/uploads/treatments && \
    chmod -R 755 server/uploads && \
    chown -R dental:nodejs server/uploads && \
    chown -R dental:nodejs /app

# Mudar para usuário não-root
USER dental

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Comando para iniciar
CMD ["node", "server/index.js"]

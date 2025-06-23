# 🏥 Sistema de Prontuário Odontológico - Dr. Marcos Rocha

## 🚀 DEPLOY COMPLETO EM 7 PASSOS

### **PASSO 1: CONFIGURAR DNS** 
⏱️ **Tempo:** 5 minutos | 🎯 **Objetivo:** Apontar domínio para servidor

1. **Acesse o painel do seu provedor de domínio** (onde registrou drmarcosrocha.com)
2. **Vá em Gerenciamento de DNS** ou "DNS Zone"
3. **Adicione um registro A:**
   - **Nome/Host:** `prontuarios`
   - **Tipo:** `A`
   - **Valor/IP:** `SEU_IP_DO_COOLIFY` *(você precisa pegar isso no Coolify)*
   - **TTL:** `300` (5 minutos)
4. **Salve as alterações**
5. **Aguarde 5-30 minutos** para propagação

**✅ Como saber se funcionou:** Digite `nslookup prontuarios.drmarcosrocha.com` no terminal

---

### **PASSO 2: ATUALIZAR ARQUIVOS NO GITHUB**
⏱️ **Tempo:** 10 minutos | 🎯 **Objetivo:** Upload dos arquivos corrigidos

**Substitua estes arquivos no seu repositório GitHub:**

1. **`.env.example`** → Renomear para `.env` (arquivo fornecido)
2. **`docker-compose.yml`** → Substituir pelo corrigido
3. **`nginx.conf`** → Substituir pelo corrigido (já com domínio configurado)
4. **`backend/package.json`** → Substituir pelo atualizado
5. **`backend/server/entrypoint.js`** → Substituir pelo corrigido
6. **`backend/server/database/init.js`** → Substituir pelo corrigido
7. **`frontend/package.json`** → Substituir pelo atualizado
8. **`frontend/src/App.tsx`** → Substituir pelo corrigido
9. **`frontend/src/services/api.ts`** → Substituir pelo corrigido
10. **`Dockerfile.backend`** → Substituir pelo corrigido
11. **`Dockerfile.frontend`** → Substituir pelo corrigido

**💡 Dica:** Crie um commit com mensagem "Deploy ready - Todos os arquivos corrigidos"

---

### **PASSO 3: CONFIGURAR PROJETO NO COOLIFY**
⏱️ **Tempo:** 5 minutos | 🎯 **Objetivo:** Conectar repositório

1. **Acesse seu Coolify Dashboard**
2. **Clique em "New Application"**
3. **Selecione "GitHub"** e conecte seu repositório
4. **Configure:**
   - **Application Name:** `prontuarios-dr-marcos`
   - **Build Type:** `Docker Compose`
   - **Docker Compose File:** `docker-compose.yml`
5. **Clique em "Create Application"**

---

### **PASSO 4: CONFIGURAR DOMÍNIO E HTTPS**
⏱️ **Tempo:** 3 minutos | 🎯 **Objetivo:** Ativar HTTPS automático

1. **Na aplicação criada, vá em "Domains"**
2. **Clique em "Add Domain"**
3. **Digite:** `prontuarios.drmarcosrocha.com`
4. **Ative estas opções:**
   - ✅ **"Generate SSL Certificate automatically"**
   - ✅ **"Redirect to HTTPS"**
   - ✅ **"Use WWW redirect"** (opcional)
5. **Clique em "Save"**

**🔒 O Coolify irá automaticamente:**
- Gerar certificado SSL gratuito (Let's Encrypt)
- Configurar redirecionamento HTTP → HTTPS
- Renovar o certificado automaticamente

---

### **PASSO 5: CONFIGURAR VARIÁVEIS DE AMBIENTE**
⏱️ **Tempo:** 3 minutos | 🎯 **Objetivo:** Configurar credenciais e chaves

1. **Vá em "Environment Variables"**
2. **Cole TODAS as variáveis abaixo:**

```
DB_HOST=postgresql-v800oocgso8gs84004wskwcw
DB_PORT=5432
DB_NAME=dental_records
DB_USER=3v4WECUVm6ZZm6to
DB_PASSWORD=V5MiGRgqKGd58cpW8WXM9LfW49qwl3wY
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c0fa7cf17b1b4b5e1c8e5e8c5f2a1b3d4
ENCRYPTION_KEY=K9mL3vP7qR2nF8xJ4hG6yT1wE5rU0iO9
NODE_ENV=production
PORT=80
TZ=America/Sao_Paulo
LOG_LEVEL=info
VITE_API_URL=/api
```

3. **IMPORTANTE:** Clique no ícone 👁️ nas linhas `JWT_SECRET` e `ENCRYPTION_KEY` para marcá-las como **"Secret"**
4. **Clique em "Save"**

---

### **PASSO 6: FAZER DEPLOY**
⏱️ **Tempo:** 10-15 minutos | 🎯 **Objetivo:** Subir a aplicação

1. **Clique em "Deploy"** (botão verde)
2. **Aguarde o build completar** (10-15 minutos)
3. **Acompanhe os logs** - deve aparecer:
   - ✅ "Building dental-backend"
   - ✅ "Building dental-frontend" 
   - ✅ "Sistema inicializado com sucesso!"
   - ✅ "nginx: worker process started"

**🟢 Deploy concluído quando:** Status fica "Running" e logs param de aparecer

---

### **PASSO 7: TESTAR E CONFIGURAR**
⏱️ **Tempo:** 5 minutos | 🎯 **Objetivo:** Verificar funcionamento

#### **7.1 Testes Básicos:**
1. **Acesse:** https://prontuarios.drmarcosrocha.com
2. **Verifique:** Página de login carrega (se não carregar, aguarde mais 5 min)
3. **Teste:** https://prontuarios.drmarcosrocha.com/api/health
4. **Deve retornar:** `{"status":"ok","timestamp":"..."}`

#### **7.2 Fazer Login:**
1. **Email:** `admin@example.com`
2. **Senha:** `DentalAdmin2024!SecurePass`
3. **Clique:** Entrar
4. **Resultado:** Dashboard deve aparecer

#### **7.3 Configuração Inicial (OBRIGATÓRIA):**
1. **Vá em:** Configurações → Perfil (ícone de usuário)
2. **Altere a senha** para uma de sua escolha
3. **Teste logout/login** com nova senha
4. **Crie outros usuários** se necessário

---

## 🔐 **CONFIGURAÇÃO HTTPS - DETALHES**

### **Como o HTTPS funciona no Coolify:**

1. **Let's Encrypt automático:** Coolify gera certificado SSL gratuito
2. **Renovação automática:** Certificado é renovado automaticamente
3. **Redirecionamento:** HTTP → HTTPS automático
4. **Headers de segurança:** Configurados no nginx.conf

### **Verificar se HTTPS está funcionando:**
- ✅ URL fica verde com cadeado no navegador
- ✅ https://prontuarios.drmarcosrocha.com funciona
- ✅ http://prontuarios.drmarcosrocha.com redireciona para HTTPS

### **Se HTTPS não funcionar:**
1. **Verifique DNS:** `nslookup prontuarios.drmarcosrocha.com`
2. **Aguarde mais tempo:** Certificado pode demorar até 30 min
3. **Verifique logs:** Procure erros sobre "certificate" nos logs
4. **Tente recriar:** Delete o domínio e adicione novamente

---

## 🎯 **CHECKLIST FINAL**

- [ ] ✅ DNS configurado e propagado
- [ ] ✅ Arquivos atualizados no GitHub  
- [ ] ✅ Aplicação criada no Coolify
- [ ] ✅ Domínio `prontuarios.drmarcosrocha.com` configurado
- [ ] ✅ HTTPS ativado e funcionando
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Deploy realizado com sucesso
- [ ] ✅ Site carrega: https://prontuarios.drmarcosrocha.com
- [ ] ✅ Health check OK: https://prontuarios.drmarcosrocha.com/api/health
- [ ] ✅ Login funciona com credenciais fornecidas
- [ ] ✅ Senha do admin alterada
- [ ] ✅ Dashboard funcionando

---

## 🎉 **PARABÉNS!**

Seu sistema de prontuário odontológico está funcionando em:

**🌐 https://prontuarios.drmarcosrocha.com**

### **Credenciais iniciais:**
- **Email:** admin@example.com
- **Senha:** DentalAdmin2024!SecurePass *(altere após login!)*

### **Recursos disponíveis:**
- ✅ Gestão completa de pacientes
- ✅ Prontuários eletrônicos
- ✅ Upload de fotos e documentos
- ✅ Geração de PDF
- ✅ Sistema de segurança completo
- ✅ Interface responsiva
- ✅ Compliance LGPD

---

## 🆘 **SUPORTE RÁPIDO**

### **Se algo não funcionar:**

**502 Bad Gateway:**
- Aguarde mais 5-10 minutos
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique logs do backend no Coolify

**Certificado SSL não gerado:**
- Verifique se DNS está propagado: `nslookup prontuarios.drmarcosrocha.com`
- Aguarde até 30 minutos
- Tente recriar o domínio no Coolify

**Login não funciona:**
- Verifique se JWT_SECRET está configurado
- Teste health check: https://prontuarios.drmarcosrocha.com/api/health

---

**🏆 SISTEMA PRONTO PARA USO PROFISSIONAL! 🏆**

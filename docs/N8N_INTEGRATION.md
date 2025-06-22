# 🔗 Integração com N8n

## Configuração

### 1. Configurar Webhook no N8n
1. Crie um novo workflow no N8n
2. Adicione um nó "Webhook"
3. Configure a URL: `https://seu-n8n.com/webhook/dental`
4. Método: `POST`
5. Autenticação: Header `X-N8N-Secret: dental-n8n-secret-key`

### 2. Configurar no Sistema
Adicione as variáveis no Coolify:
```env
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/dental
N8N_SECRET=dental-n8n-secret-key
```

## Eventos Enviados

### 📝 Novo Paciente
```json
{
  "event": "patient.created",
  "timestamp": "2024-06-18T10:30:00Z",
  "data": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "(11) 99999-9999",
    "cpf": "123.456.789-00"
  }
}
```

### 🦷 Novo Tratamento
```json
{
  "event": "treatment.created",
  "timestamp": "2024-06-18T10:30:00Z",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_name": "João Silva",
    "procedure": "Limpeza",
    "date": "2024-06-18T10:30:00Z",
    "dentist": "Dr. Maria"
  }
}
```

### ✅ Tratamento Concluído
```json
{
  "event": "treatment.completed",
  "timestamp": "2024-06-18T10:30:00Z",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_name": "João Silva",
    "procedure": "Restauração",
    "completion_date": "2024-06-18T10:30:00Z"
  }
}
```

## Workflows Sugeridos

### 1. Lembrete de Consulta
- **Trigger:** `treatment.created`
- **Ação:** Enviar WhatsApp/Email 1 dia antes
- **Dados:** Nome, data, horário, procedimento

### 2. Follow-up Pós-Tratamento
- **Trigger:** `treatment.completed`
- **Ação:** Enviar pesquisa de satisfação após 3 dias
- **Dados:** Nome, procedimento, link da pesquisa

### 3. Relatório Diário
- **Trigger:** Cron (todo dia às 18h)
- **Ação:** Buscar tratamentos do dia via API
- **Envio:** Relatório por email/Slack

### 4. Backup Automático
- **Trigger:** Cron (toda semana)
- **Ação:** Exportar dados via API
- **Armazenamento:** Google Drive/Dropbox

## Exemplo de Workflow N8n

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "dental",
        "httpMethod": "POST",
        "authentication": "headerAuth"
      }
    },
    {
      "name": "Switch",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "rules": {
          "rules": [
            {
              "operation": "equal",
              "value1": "={{$json.event}}",
              "value2": "treatment.created"
            }
          ]
        }
      }
    },
    {
      "name": "WhatsApp",
      "type": "n8n-nodes-base.whatsapp",
      "parameters": {
        "message": "Olá {{$json.data.patient_name}}, sua consulta está agendada para {{$json.data.date}}!"
      }
    }
  ]
}
```

## Segurança

### Headers Obrigatórios
```http
X-N8N-Secret: dental-n8n-secret-key
Content-Type: application/json
```

### Validação
O sistema valida:
- ✅ Secret correto
- ✅ Payload válido
- ✅ Timestamp recente (< 5 min)

## Troubleshooting

### Webhook não recebe dados
1. Verificar URL no N8n
2. Verificar secret configurado
3. Verificar logs do sistema

### Dados incorretos
1. Verificar estrutura do payload
2. Verificar encoding (UTF-8)
3. Verificar tamanho máximo (1MB)


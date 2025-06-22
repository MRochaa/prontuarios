# 🔧 API Documentation

## Base URL
```
https://dental.seu-dominio.com/api
```

## Authentication
Todas as rotas (exceto login) requerem token JWT no header:
```
Authorization: Bearer <token>
```

## Endpoints

### 🔐 Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "test_password"
}
```

### 👥 Patients
```http
# Listar pacientes
GET /api/patients

# Criar paciente
POST /api/patients
Content-Type: multipart/form-data

# Buscar paciente
GET /api/patients/:id

# Atualizar paciente
PUT /api/patients/:id

# Deletar paciente
DELETE /api/patients/:id
```

### 🦷 Treatments
```http
# Listar tratamentos
GET /api/treatments

# Criar tratamento
POST /api/treatments
Content-Type: application/json

# Buscar tratamento
GET /api/treatments/:id

# Atualizar tratamento
PUT /api/treatments/:id

# Deletar tratamento
DELETE /api/treatments/:id
```

### 📊 Dashboard
```http
# Estatísticas gerais
GET /api/dashboard/stats

# Tratamentos recentes
GET /api/dashboard/recent-treatments

# Pacientes ativos
GET /api/dashboard/active-patients
```

### 📄 PDF Export
```http
# Exportar prontuário
GET /api/pdf/patient/:id

# Exportar tratamento
GET /api/pdf/treatment/:id
```

### 🔍 Health Check
```http
GET /api/health
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error


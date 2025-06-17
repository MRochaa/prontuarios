// Configuração de integração com N8n
// Este arquivo contém as funções para integrar com seu N8n existente

import crypto from 'crypto';

// Configuração do webhook N8n
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_SECRET = process.env.N8N_SECRET || 'dental-n8n-secret';

// Função para enviar dados para N8n
export async function sendToN8n(eventType, data) {
  if (!N8N_WEBHOOK_URL) {
    console.warn('N8N_WEBHOOK_URL não configurado, pulando webhook');
    return;
  }

  try {
    // Criar assinatura para segurança
    const timestamp = Date.now();
    const payload = JSON.stringify({ eventType, data, timestamp });
    const signature = crypto
      .createHmac('sha256', N8N_SECRET)
      .update(payload)
      .digest('hex');

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Timestamp': timestamp.toString(),
        'X-Event-Type': eventType
      },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`N8n webhook failed: ${response.status}`);
    }

    console.log(`N8n webhook enviado: ${eventType}`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao enviar para N8n:', error);
    throw error;
  }
}

// Eventos específicos para o sistema odontológico
export const N8nEvents = {
  // Eventos de pacientes
  PATIENT_CREATED: 'patient.created',
  PATIENT_UPDATED: 'patient.updated',
  PATIENT_DELETED: 'patient.deleted',
  
  // Eventos de tratamentos
  TREATMENT_CREATED: 'treatment.created',
  TREATMENT_UPDATED: 'treatment.updated',
  TREATMENT_COMPLETED: 'treatment.completed',
  TREATMENT_DELETED: 'treatment.deleted',
  
  // Eventos de sistema
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  BACKUP_CREATED: 'system.backup.created',
  
  // Eventos de notificações
  APPOINTMENT_REMINDER: 'appointment.reminder',
  TREATMENT_DUE: 'treatment.due',
  PATIENT_BIRTHDAY: 'patient.birthday'
};

// Função para notificar criação de paciente
export async function notifyPatientCreated(patient, user) {
  return sendToN8n(N8nEvents.PATIENT_CREATED, {
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      created_at: patient.created_at
    },
    created_by: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
}

// Função para notificar criação de tratamento
export async function notifyTreatmentCreated(treatment, patient, dentist) {
  return sendToN8n(N8nEvents.TREATMENT_CREATED, {
    treatment: {
      id: treatment.id,
      procedure: treatment.procedure,
      status: treatment.status,
      date: treatment.date,
      teeth: treatment.teeth
    },
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone
    },
    dentist: {
      id: dentist.id,
      name: dentist.name,
      email: dentist.email
    }
  });
}

// Função para notificar conclusão de tratamento
export async function notifyTreatmentCompleted(treatment, patient, dentist) {
  return sendToN8n(N8nEvents.TREATMENT_COMPLETED, {
    treatment: {
      id: treatment.id,
      procedure: treatment.procedure,
      completed_at: new Date().toISOString(),
      observations: treatment.observations
    },
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone
    },
    dentist: {
      id: dentist.id,
      name: dentist.name
    }
  });
}

// Função para notificar login de usuário
export async function notifyUserLogin(user, ipAddress, userAgent) {
  return sendToN8n(N8nEvents.USER_LOGIN, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    session: {
      ip_address: ipAddress,
      user_agent: userAgent,
      login_time: new Date().toISOString()
    }
  });
}

// Middleware para integração automática com N8n
export function n8nMiddleware(eventType) {
  return async (req, res, next) => {
    // Armazenar dados originais para comparação
    req.originalData = { ...req.body };
    
    // Continuar com a requisição
    next();
    
    // Após a resposta, enviar para N8n se bem-sucedida
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await sendToN8n(eventType, {
            request: req.originalData,
            response: res.locals.responseData,
            user: req.user,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Erro no middleware N8n:', error);
        }
      }
    });
  };
}


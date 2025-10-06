# API de Integração - Sistema de Agendamento

Esta documentação descreve a API REST para integração com terceiros do sistema de agendamento.

## Autenticação

Todas as requisições devem incluir uma API Key válida no header `Authorization`:

```
Authorization: Bearer YOUR_API_KEY
```

### Obtendo uma API Key

1. Acesse o painel administrativo
2. Vá para "Configurações" > "API Keys"
3. Clique em "Nova API Key"
4. Configure as permissões necessárias
5. Copie a chave gerada

## Base URL

```
https://seu-dominio.com/api/v1
```

## Formato de Resposta

Todas as respostas seguem o formato JSON padrão:

### Sucesso
```json
{
  "success": true,
  "data": {
    // dados da resposta
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "message": "Descrição do erro",
    "code": "ERROR_CODE",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - API Key inválida ou expirada
- `403` - Permissão insuficiente
- `404` - Recurso não encontrado
- `409` - Conflito (ex: horário já ocupado)
- `500` - Erro interno do servidor

## Rate Limiting

- Limite padrão: 1000 requisições por hora
- Headers de resposta incluem informações sobre o limite:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp do reset

---

## Endpoints

### 1. Agendamentos

#### Listar Agendamentos
```http
GET /api/v1/appointments
```

**Parâmetros de Query:**
- `page` (int): Página (padrão: 1)
- `limit` (int): Itens por página (máximo: 100, padrão: 10)
- `status` (string): Filtrar por status (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`)
- `serviceId` (string): Filtrar por ID do serviço
- `clientEmail` (string): Filtrar por email do cliente
- `startDate` (datetime): Data inicial (ISO 8601)
- `endDate` (datetime): Data final (ISO 8601)

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "clp123456789",
        "date": "2024-01-20T14:00:00Z",
        "status": "CONFIRMED",
        "clientName": "João Silva",
        "clientEmail": "joao@email.com",
        "clientPhone": "+5511999999999",
        "notes": "Primeira consulta",
        "totalPrice": 150.00,
        "service": {
          "id": "srv123456789",
          "name": "Consulta Médica",
          "duration": 60,
          "price": 150.00,
          "store": {
            "id": "str123456789",
            "name": "Clínica Central",
            "slug": "clinica-central"
          }
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### Criar Agendamento
```http
POST /api/v1/appointments
```

**Body:**
```json
{
  "serviceId": "srv123456789",
  "clientEmail": "cliente@email.com",
  "clientName": "Nome do Cliente",
  "clientPhone": "+5511999999999",
  "date": "2024-01-20T14:00:00Z",
  "notes": "Observações opcionais",
  "sendNotifications": true
}
```

**Validações:**
- Data deve ser no futuro
- Deve respeitar antecedência mínima da loja
- Deve respeitar limite máximo de agendamento
- Horário deve estar disponível

#### Obter Agendamento
```http
GET /api/v1/appointments/{appointmentId}
```

#### Atualizar Agendamento
```http
PUT /api/v1/appointments/{appointmentId}
```

**Body (todos os campos opcionais):**
```json
{
  "status": "CONFIRMED",
  "date": "2024-01-20T15:00:00Z",
  "notes": "Novas observações",
  "clientName": "Nome Atualizado",
  "clientPhone": "+5511888888888"
}
```

#### Cancelar Agendamento
```http
DELETE /api/v1/appointments/{appointmentId}
```

---

### 2. Clientes

#### Listar Clientes
```http
GET /api/v1/clients
```

**Parâmetros de Query:**
- `page` (int): Página (padrão: 1)
- `limit` (int): Itens por página (máximo: 100, padrão: 10)
- `search` (string): Buscar por nome, email ou telefone
- `email` (string): Filtrar por email específico

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "usr123456789",
        "name": "João Silva",
        "email": "joao@email.com",
        "phone": "+5511999999999",
        "birthDate": "1990-05-15T00:00:00Z",
        "address": "Rua das Flores, 123",
        "notes": "Cliente VIP",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "_count": {
          "appointments": 5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### Criar Cliente
```http
POST /api/v1/clients
```

**Body:**
```json
{
  "name": "Nome do Cliente",
  "email": "cliente@email.com",
  "phone": "+5511999999999",
  "birthDate": "1990-05-15T00:00:00Z",
  "address": "Endereço completo",
  "notes": "Observações sobre o cliente"
}
```

#### Obter Cliente
```http
GET /api/v1/clients/{clientId}
```

**Resposta inclui os últimos 10 agendamentos do cliente.**

#### Atualizar Cliente
```http
PUT /api/v1/clients/{clientId}
```

**Body (todos os campos opcionais):**
```json
{
  "name": "Nome Atualizado",
  "phone": "+5511888888888",
  "birthDate": "1990-05-15T00:00:00Z",
  "address": "Novo endereço",
  "notes": "Novas observações"
}
```

#### Deletar Cliente
```http
DELETE /api/v1/clients/{clientId}
```

**Nota:** Só é possível deletar clientes sem agendamentos.

---

### 3. Serviços

#### Listar Serviços
```http
GET /api/v1/services
```

**Parâmetros de Query:**
- `page` (int): Página (padrão: 1)
- `limit` (int): Itens por página (máximo: 100, padrão: 10)
- `search` (string): Buscar por nome ou descrição
- `categoryId` (string): Filtrar por categoria
- `active` (boolean): Filtrar por status ativo
- `storeId` (string): Filtrar por loja (se não especificado na API Key)

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "srv123456789",
        "name": "Consulta Médica",
        "description": "Consulta médica geral",
        "duration": 60,
        "price": 150.00,
        "active": true,
        "maxAdvanceBookingDays": 30,
        "minAdvanceHours": 24,
        "category": {
          "id": "cat123456789",
          "name": "Consultas",
          "color": "#3B82F6"
        },
        "store": {
          "id": "str123456789",
          "name": "Clínica Central",
          "slug": "clinica-central"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "_count": {
          "appointments": 25
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

#### Criar Serviço
```http
POST /api/v1/services
```

**Body:**
```json
{
  "name": "Nome do Serviço",
  "description": "Descrição detalhada",
  "duration": 60,
  "price": 150.00,
  "categoryId": "cat123456789",
  "active": true,
  "maxAdvanceBookingDays": 30,
  "minAdvanceHours": 24
}
```

**Nota:** API Key deve estar associada a uma loja específica.

#### Obter Serviço
```http
GET /api/v1/services/{serviceId}
```

**Resposta inclui os próximos 10 agendamentos do serviço.**

#### Atualizar Serviço
```http
PUT /api/v1/services/{serviceId}
```

#### Deletar Serviço
```http
DELETE /api/v1/services/{serviceId}
```

**Nota:** Só é possível deletar serviços sem agendamentos.

---

## Permissões da API Key

As API Keys podem ter diferentes níveis de permissão:

### Recursos
- `appointments` - Agendamentos
- `clients` - Clientes  
- `services` - Serviços

### Ações
- `read` - Visualizar
- `create` - Criar
- `update` - Atualizar
- `delete` - Deletar

### Escopo
- **Empresa**: Acesso a todas as lojas da empresa
- **Loja**: Acesso apenas à loja específica

### Exemplo de Configuração
```json
{
  "appointments": ["read", "create", "update"],
  "clients": ["read", "create", "update"],
  "services": ["read"]
}
```

---

## Webhooks (Futuro)

Em versões futuras, será possível configurar webhooks para receber notificações sobre:
- Novos agendamentos
- Cancelamentos
- Confirmações
- Alterações de status

---

## SDKs e Bibliotecas

### JavaScript/Node.js
```bash
npm install @agendamento/api-client
```

```javascript
import { AgendamentoAPI } from '@agendamento/api-client'

const api = new AgendamentoAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://seu-dominio.com/api/v1'
})

// Listar agendamentos
const appointments = await api.appointments.list({
  page: 1,
  limit: 10,
  status: 'CONFIRMED'
})

// Criar agendamento
const newAppointment = await api.appointments.create({
  serviceId: 'srv123456789',
  clientEmail: 'cliente@email.com',
  clientName: 'Nome do Cliente',
  clientPhone: '+5511999999999',
  date: '2024-01-20T14:00:00Z'
})
```

### Python
```bash
pip install agendamento-api-client
```

```python
from agendamento_api import AgendamentoAPI

api = AgendamentoAPI(
    api_key='your-api-key',
    base_url='https://seu-dominio.com/api/v1'
)

# Listar agendamentos
appointments = api.appointments.list(
    page=1,
    limit=10,
    status='CONFIRMED'
)

# Criar agendamento
new_appointment = api.appointments.create({
    'serviceId': 'srv123456789',
    'clientEmail': 'cliente@email.com',
    'clientName': 'Nome do Cliente',
    'clientPhone': '+5511999999999',
    'date': '2024-01-20T14:00:00Z'
})
```

---

## Exemplos de Uso

### Integração com Sistema de CRM
```javascript
// Sincronizar clientes do CRM
const crmClients = await crm.getClients()

for (const crmClient of crmClients) {
  try {
    await api.clients.create({
      name: crmClient.name,
      email: crmClient.email,
      phone: crmClient.phone,
      notes: `Importado do CRM - ID: ${crmClient.id}`
    })
  } catch (error) {
    if (error.code === 'CLIENT_ALREADY_EXISTS') {
      // Cliente já existe, atualizar dados
      await api.clients.update(existingClientId, {
        name: crmClient.name,
        phone: crmClient.phone
      })
    }
  }
}
```

### Widget de Agendamento Online
```javascript
// Listar serviços disponíveis
const services = await api.services.list({ active: true })

// Criar agendamento a partir do formulário
const formData = getFormData()
const appointment = await api.appointments.create({
  serviceId: formData.serviceId,
  clientEmail: formData.email,
  clientName: formData.name,
  clientPhone: formData.phone,
  date: formData.selectedDateTime,
  notes: formData.notes
})

// Redirecionar para confirmação
window.location.href = `/confirmacao/${appointment.id}`
```

### Relatórios e Analytics
```javascript
// Obter agendamentos do mês
const startDate = new Date()
startDate.setDate(1)
const endDate = new Date()
endDate.setMonth(endDate.getMonth() + 1)
endDate.setDate(0)

const appointments = await api.appointments.list({
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
  limit: 100
})

// Calcular métricas
const totalRevenue = appointments.data.reduce(
  (sum, apt) => sum + apt.totalPrice, 0
)
const completedAppointments = appointments.data.filter(
  apt => apt.status === 'COMPLETED'
).length
```

---

## Suporte

Para dúvidas sobre a API:
- Email: api-support@agendamento.com
- Documentação: https://docs.agendamento.com
- Status da API: https://status.agendamento.com

## Changelog

### v1.0.0 (2024-01-15)
- Lançamento inicial da API
- Endpoints para agendamentos, clientes e serviços
- Sistema de autenticação por API Key
- Rate limiting e logs de uso
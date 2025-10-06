# 🚀 Configuração W-API - Substituição do Venom Bot

## ✅ O que foi implementado

1. **Novo serviço W-API** (`src/lib/whatsapp-wapi.ts`)
2. **API de teste** (`src/app/api/whatsapp-wapi-test/route.ts`)
3. **Página de teste** (`src/app/test-wapi/page.tsx`)
4. **Variáveis de ambiente** (`.env`)

## 🔧 Configuração Necessária

### 1. Obter credenciais da W-API

Você precisa das seguintes informações da sua instância demo:

- **URL Base da API** (ex: `https://your-instance.w-api.com`)
- **Instance ID** (ID da sua instância)
- **Token de Autenticação**

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env` e substitua os valores:

```env
# W-API Configuration
WAPI_BASE_URL="https://your-instance.w-api.com"
WAPI_INSTANCE_ID="sua_instancia_id_aqui"
WAPI_TOKEN="seu_token_aqui"
```

### 3. Endpoints da W-API utilizados

O serviço utiliza os seguintes endpoints:

- `GET /{instanceId}/status` - Verificar status da conexão
- `GET /{instanceId}/qr_code` - Obter QR code
- `POST /{instanceId}/start` - Iniciar processo de autenticação
- `POST /{instanceId}/send-message` - Enviar mensagem
- `POST /{instanceId}/logout` - Desconectar

## 🧪 Como testar

### 1. Configurar credenciais reais
Substitua as variáveis no `.env` com suas credenciais da W-API.

### 2. Reiniciar o servidor
```bash
npm run dev
```

### 3. Acessar página de teste
Abra: `http://localhost:3000/test-wapi`

### 4. Testar funcionalidades
- ✅ Verificar status da conexão
- ✅ Gerar QR code
- ✅ Conectar WhatsApp
- ✅ Enviar mensagens de teste
- ✅ Visualizar mensagens pré-definidas

## 🔄 Migração do Venom Bot

### Arquivos que precisam ser atualizados:

1. **API principal** (`src/app/api/whatsapp/route.ts`)
   - Substituir `whatsappService` por `wapiWhatsappService`

2. **Páginas que usam WhatsApp**
   - Atualizar imports e chamadas de API

3. **Serviços de agendamento**
   - Verificar integração com envio de mensagens

## 📊 Comparação: Venom Bot vs W-API

| Aspecto | Venom Bot | W-API |
|---------|-----------|-------|
| **Estabilidade** | ⚠️ Instável | ✅ Muito estável |
| **Custo** | 🆓 Gratuito | 💰 Pago |
| **Manutenção** | 🔧 Alta | 🔧 Baixa |
| **Recursos** | 📱 Básicos | 🚀 Avançados |
| **Suporte** | 👥 Comunidade | 🏢 Oficial |
| **Multi-instância** | ❌ Limitado | ✅ Nativo |

## 🚨 Próximos passos

1. **Configure suas credenciais** da W-API no `.env`
2. **Teste a conexão** na página `/test-wapi`
3. **Confirme se funciona** antes de migrar a API principal
4. **Atualize a API principal** quando estiver funcionando

## 💡 Dicas importantes

- A W-API é mais confiável que o Venom Bot
- Suporte nativo a múltiplas instâncias
- Webhooks para eventos em tempo real
- Melhor performance e estabilidade
- Documentação oficial completa

## 🆘 Suporte

Se encontrar problemas:
1. Verifique as credenciais no `.env`
2. Confirme se a instância W-API está ativa
3. Teste os endpoints manualmente
4. Verifique os logs no console do navegador
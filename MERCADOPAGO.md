# 💳 Integração Mercado Pago PIX

Guia completo de integração com pagamentos PIX via Mercado Pago.

## 📋 Índice

- [Configuração](#-configuração)
- [Fluxo de Pagamento](#-fluxo-de-pagamento)
- [Endpoints](#-endpoints)
- [Webhook](#-webhook)
- [Testes](#-testes)

## 🔧 Configuração

### 1. Obter Credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Crie uma aplicação ou use uma existente
3. Copie as credenciais:
   - **Access Token** (TEST para testes, PROD para produção)
   - **Public Key** (opcional)

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```env
# Mercado Pago
MP_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890-1234567890
MP_PUBLIC_KEY=TEST-abcd1234-5678-90ab-cdef-1234567890ab
MP_WEBHOOK_SECRET=seu-webhook-secret-opcional
MP_SANDBOX=true
APP_URL=http://localhost:3000
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Aplicar Migração do Banco

```bash
npm run db:generate
npm run db:migrate
```

### 5. Iniciar Serviços

```bash
docker-compose up -d
```

Serviços disponíveis:
- **App**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Adminer**: http://localhost:8080

## 🔄 Fluxo de Pagamento

### 1. Cliente Escolhe Cotas

```http
GET /api/rifas/1/cotas
```

### 2. Cliente Cria Checkout PIX

```http
POST /api/pagamentos/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "rifaId": 1,
  "numerosCota": [1, 2, 3],
  "metodoPagamento": "pix"
}
```

**Resposta:**
```json
{
  "message": "Checkout criado com sucesso",
  "data": {
    "pagamentoId": 1,
    "mpPaymentId": "123456789",
    "status": "pending",
    "qrCode": "iVBORw0KGgoAAAANS...", // Base64
    "pixPayload": "00020126580014br.gov.bcb.pix...",
    "valor": 150.00,
    "expiraEm": "2025-11-20T15:30:00.000Z",
    "cotas": [1, 2, 3]
  }
}
```

### 3. Sistema Realiza:

✅ Valida disponibilidade das cotas  
✅ Reserva temporariamente no Redis (15 min)  
✅ Atualiza cotas no banco para "reservada"  
✅ Cria pagamento no Mercado Pago  
✅ Salva dados do PIX no banco  

### 4. Frontend Exibe:

- **QR Code** (imagem base64)
- **Código PIX** (copiar e colar)
- **Valor e expiração**

### 5. Cliente Paga

Cliente escaneia QR Code ou cola o código PIX no app do banco.

### 6. Mercado Pago Notifica

Webhook é chamado automaticamente:

```http
POST /api/pagamentos/webhook
```

### 7. Sistema Processa

✅ Valida webhook  
✅ Busca pagamento no Mercado Pago  
✅ Atualiza status no banco  
✅ Confirma cotas (status = "paga")  
✅ Remove reserva do Redis  

### 8. Cliente Recebe Confirmação

```http
GET /api/pagamentos/1
```

**Resposta:**
```json
{
  "data": {
    "id": 1,
    "status": "pago",
    "statusMP": "approved",
    "valor": "150.00",
    "cotas": [1, 2, 3]
  }
}
```

## 🌐 Endpoints

### POST /api/pagamentos/checkout

Cria checkout PIX.

**Requer autenticação:** Sim

**Body:**
```json
{
  "rifaId": 1,
  "numerosCota": [1, 2, 3],
  "metodoPagamento": "pix"
}
```

**Resposta 201:**
```json
{
  "message": "Checkout criado com sucesso",
  "data": {
    "pagamentoId": 1,
    "mpPaymentId": "123456789",
    "qrCode": "base64...",
    "pixPayload": "00020126...",
    "valor": 150.00,
    "expiraEm": "2025-11-20T15:30:00Z"
  }
}
```

**Erros:**
- `400` - Cotas indisponíveis
- `401` - Não autenticado
- `400` - Reserva ativa existente

### GET /api/pagamentos/:id

Busca status do pagamento.

**Requer autenticação:** Sim

**Resposta 200:**
```json
{
  "data": {
    "id": 1,
    "status": "pago",
    "statusMP": "approved",
    "valor": "150.00"
  }
}
```

### POST /api/pagamentos/webhook

Recebe notificações do Mercado Pago.

**Requer autenticação:** Não (público)

**Body:**
```json
{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}
```

**Resposta 200:**
```json
{
  "received": true
}
```

## 🔔 Webhook

### Configurar URL no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
2. Configure a URL: `https://seu-dominio.com/api/pagamentos/webhook`
3. Eventos: `payment`

### Testar Localmente com ngrok

```bash
# Instalar ngrok
brew install ngrok  # macOS
# ou baixe em: https://ngrok.com/download

# Expor porta 3000
ngrok http 3000

# Use a URL gerada no painel do MP
# Ex: https://abc123.ngrok.io/api/pagamentos/webhook
```

### Status do Mercado Pago

| Status MP | Status Sistema | Ação |
|-----------|----------------|------|
| `pending` | pendente | Aguarda pagamento |
| `approved` | pago | Confirma cotas |
| `authorized` | pago | Confirma cotas |
| `in_process` | pendente | Aguarda |
| `rejected` | cancelado | Libera cotas |
| `cancelled` | cancelado | Libera cotas |
| `expired` | expirado | Libera cotas |

## 🧪 Testes

### 1. Ambiente Sandbox

Use credenciais de **TEST** do Mercado Pago.

### 2. Usuários de Teste

Crie usuários de teste em: https://www.mercadopago.com.br/developers/panel/test-users

### 3. Simular Pagamento

No Mercado Pago Sandbox, você pode:
- Aprovar pagamentos automaticamente
- Rejeitar pagamentos
- Testar timeout

### 4. Testar Webhook Localmente

Use o **Mercado Pago Simulator** ou **Postman** para enviar webhooks manualmente:

```http
POST http://localhost:3000/api/pagamentos/webhook
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "SEU_PAYMENT_ID"
  }
}
```

### 5. Verificar Logs

```bash
# Logs da aplicação
docker logs -f residencial-app

# Logs do Redis
docker logs -f residencial-redis
```

## 🔒 Segurança

### Validação de Webhook

O sistema valida:
- ✅ Estrutura do payload (Zod)
- ✅ ID do pagamento existe no banco
- ✅ Status do pagamento no Mercado Pago

### Opcional: Assinatura HMAC

Adicione verificação de assinatura no webhook:

```typescript
import crypto from 'crypto';

function validarAssinatura(payload: string, signature: string) {
  const hash = crypto
    .createHmac('sha256', env.MP_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
```

## 🐛 Troubleshooting

### Erro: "Redis connection refused"

```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Reiniciar Redis
docker-compose restart redis
```

### Erro: "MP_ACCESS_TOKEN is required"

Configure o `.env` com suas credenciais do Mercado Pago.

### Webhook não recebe notificações

1. Verifique a URL configurada no painel do MP
2. Use ngrok para testes locais
3. Verifique logs: `docker logs -f residencial-app`

### Cotas não são confirmadas após pagamento

1. Verifique se o webhook está configurado
2. Veja os logs do webhook
3. Consulte manualmente: `GET /api/pagamentos/:id`

## 📚 Documentação

- [Mercado Pago Docs](https://www.mercadopago.com.br/developers/pt/docs)
- [API Reference](https://www.mercadopago.com.br/developers/pt/reference)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

## 🎯 Próximos Passos

- [ ] Implementar cartão de crédito
- [ ] Adicionar boleto bancário
- [ ] Criar painel admin para gerenciar pagamentos
- [ ] Implementar reembolsos
- [ ] Adicionar retry automático para webhooks falhados
- [ ] Criar cronjob para liberar cotas expiradas

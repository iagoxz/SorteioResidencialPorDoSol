# 🚀 Guia Rápido - Testar API no Insomnia

## 📥 1. Importar Collection

1. Abra o **Insomnia**
2. Clique em **Application** > **Preferences** > **Data** > **Import Data**
3. Selecione o arquivo `Insomnia_Collection.json`
4. A workspace **"Residencial Pôr do Sol - API"** será criada

## 🔧 2. Configurar Environment

Após importar, configure as variáveis de ambiente:

1. Clique no dropdown **"No Environment"** (canto superior esquerdo)
2. Selecione **"Base Environment"**
3. Clique no ícone de **olho** 👁️ ao lado
4. Edite as variáveis:

```json
{
  "base_url": "http://localhost:3000",
  "token_admin": "COLE_O_TOKEN_DO_ADMIN_AQUI",
  "token_cliente": "COLE_O_TOKEN_DO_CLIENTE_AQUI"
}
```

> **Nota:** Você vai copiar os tokens depois de fazer login!

## 🎯 3. Fluxo de Teste Completo

### Passo 1: Health Check
```
GET /health
```
✅ Verifica se a API está rodando

---

### Passo 2: Registrar Admin
```
POST /api/auth/register
```
📝 Body já preenchido com dados do admin

**Resposta esperada:**
```json
{
  "message": "Usuário registrado com sucesso",
  "data": {
    "id": "uuid-do-admin",
    "nome": "Admin Sistema",
    "email": "admin@residencial.com",
    "role": "admin"
  }
}
```

---

### Passo 3: Login Admin
```
POST /api/auth/login
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**✅ IMPORTANTE:** Copie o `token` e cole na variável `token_admin` do Environment!

---

### Passo 4: Criar Rifa (como admin)
```
POST /api/rifas
Authorization: Bearer {{ _.token_admin }}
```

O token será preenchido automaticamente da variável de ambiente.

**Resposta:**
```json
{
  "message": "Rifa criada com sucesso",
  "data": {
    "id": 1,
    "titulo": "Rifa Casa Residencial Pôr do Sol",
    "preco_cota": "50.00",
    "total_cotas": 100,
    "status": "ativa"
  }
}
```

---

### Passo 5: Listar Rifas
```
GET /api/rifas
```

Veja todas as rifas criadas.

---

### Passo 6: Ver Cotas da Rifa
```
GET /api/rifas/1/cotas
```

Lista todas as 100 cotas (disponível, reservada, paga).

---

### Passo 7: Registrar Cliente
```
POST /api/auth/register
```

Registra um cliente comum (não admin).

---

### Passo 8: Login Cliente
```
POST /api/auth/login
```

**✅ COPIE O TOKEN** e cole na variável `token_cliente`!

---

### Passo 9: Criar Checkout PIX 🎯
```
POST /api/pagamentos/checkout
Authorization: Bearer {{ _.token_cliente }}
```

**Body:**
```json
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
    "qrCode": "iVBORw0KGgoAAAANS...",
    "pixPayload": "00020126580014br.gov.bcb.pix...",
    "valor": 150,
    "expiraEm": "2025-11-20T15:30:00.000Z",
    "cotas": [1, 2, 3]
  }
}
```

**✅ IMPORTANTE:** 
- `qrCode` = Imagem em base64 (você pode usar um visualizador online)
- `pixPayload` = Código PIX "copiar e colar"
- `mpPaymentId` = Guarde para simular webhook

---

### Passo 10: Simular Pagamento Aprovado
```
POST /api/pagamentos/webhook
```

**Edite o body** e coloque o `mpPaymentId` real:
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "COLE_O_MP_PAYMENT_ID_AQUI"
  },
  "date_created": "2025-11-20T14:00:00Z",
  "id": 12345,
  "live_mode": false,
  "type": "payment",
  "user_id": "123456"
}
```

**⚠️ ATENÇÃO:** Isso só funciona em **modo sandbox** com credenciais de TEST do Mercado Pago configuradas!

---

### Passo 11: Verificar Pagamento
```
GET /api/pagamentos/1
Authorization: Bearer {{ _.token_cliente }}
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

---

### Passo 12: Verificar Cotas Pagas
```
GET /api/rifas/1/cotas
```

As cotas 1, 2 e 3 agora devem ter `status: "paga"` e o `usuarioId` do cliente.

---

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `base_url` | URL da API | `http://localhost:3000` |
| `token_admin` | Token JWT do admin | Resposta do login admin |
| `token_cliente` | Token JWT do cliente | Resposta do login cliente |

### Como usar variáveis nas requisições:

```
Authorization: Bearer {{ _.token_admin }}
```

O Insomnia substitui `{{ _.token_admin }}` pelo valor da variável automaticamente!

---

## 🐛 Troubleshooting

### Erro 401 "Usuário não autenticado"
✅ Verifique se copiou o token corretamente  
✅ Certifique-se de usar `token_cliente` para pagamentos e `token_admin` para criar rifas

### Erro "Algumas cotas não estão disponíveis"
✅ As cotas já foram reservadas/pagas  
✅ Escolha outros números: `[4, 5, 6]`

### Erro "MP_ACCESS_TOKEN is required"
✅ Configure o `.env` com suas credenciais do Mercado Pago  
✅ Reinicie o container: `docker-compose restart app`

### Webhook não funciona
✅ Certifique-se de ter credenciais de TEST do Mercado Pago  
✅ O `mpPaymentId` no webhook deve ser o mesmo retornado no checkout  
✅ Em produção, o webhook é chamado automaticamente pelo MP

---

## 📚 Dicas Úteis

### 1. Ver Logs da Aplicação
```bash
docker logs -f residencial-app
```

### 2. Acessar Redis
```bash
docker exec -it residencial-redis redis-cli
KEYS *
GET reserva:usuario-id:1
```

### 3. Ver Banco de Dados
Acesse o Adminer: http://localhost:8080
- **Sistema:** PostgreSQL
- **Servidor:** postgres
- **Usuário:** postgres
- **Senha:** postgres
- **Base:** residencial

### 4. Formatar JSON no Insomnia
O Insomnia formata automaticamente, mas você pode usar:
- **Ctrl/Cmd + B** = Beautify JSON
- **Ctrl/Cmd + D** = Duplicar requisição

### 5. Salvar Resposta
Clique com botão direito na resposta > **Copy Response Body**

---

## 🎯 Ordem Recomendada

```
1. Health Check
2. Registrar Admin → Login Admin (copiar token)
3. Criar Rifa
4. Listar Rifas / Ver Cotas
5. Registrar Cliente → Login Cliente (copiar token)
6. Criar Checkout PIX
7. Simular Webhook (pagamento aprovado)
8. Verificar Pagamento
9. Verificar Cotas (status "paga")
```

---

## 📖 Mais Informações

- **Documentação API:** `README.md`
- **Integração Mercado Pago:** `MERCADOPAGO.md`
- **Requests HTTP:** `requests.http` (para VS Code REST Client)

---

## 🎉 Pronto!

Agora você pode testar toda a API no Insomnia, desde o cadastro até o pagamento PIX completo!

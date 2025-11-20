# 🎯 Sistema de Rifas - Residencial Pôr do Sol

Arquitetura simples, limpa e profissional com Node.js + TypeScript.

## 🛠️ Stack

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Zod** - Validação de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **Pino** - Logger
- **Docker** + **Docker Compose** - Containerização

## 📁 Estrutura de Pastas

```
src/
├── config/
│   └── env.ts                 # Validação de variáveis de ambiente
├── db/
│   ├── schema/
│   │   ├── users.ts          # Schema de usuários
│   │   └── rifas.ts          # Schema de rifas e compras
│   └── drizzle.ts            # Configuração do Drizzle
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.validator.ts
│   ├── users/
│   │   ├── user.model.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.routes.ts
│   │   └── user.validator.ts
│   └── rifas/
│       ├── rifa.model.ts
│       ├── rifa.controller.ts
│       ├── rifa.service.ts
│       ├── rifa.routes.ts
│       └── rifa.validator.ts
├── middlewares/
│   ├── auth.ts               # Middleware de autenticação JWT
│   └── error-handler.ts      # Handler global de erros
├── utils/
│   └── logger.ts             # Configuração do Pino
├── app.ts                     # Configuração do Express
└── server.ts                  # Inicialização do servidor
```

## 🚀 Como Rodar

### 1. Copie o arquivo de variáveis de ambiente

```bash
cp .env.example .env
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Suba o banco de dados com Docker

```bash
docker-compose up -d postgres
```

### 4. Gere e execute as migrations

```bash
npm run db:generate
npm run db:migrate
```

### 5. Rode em modo desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em: `http://localhost:3000`

## 🐳 Rodar tudo com Docker

```bash
docker-compose up -d
```

Serviços disponíveis:
- **API**: http://localhost:3000
- **Adminer** (gerenciador de DB): http://localhost:8080
- **PostgreSQL**: localhost:5432

## 📡 Endpoints

### Autenticação

#### Registrar usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Usuários (requer autenticação)

#### Listar usuários
```http
GET /api/users
Authorization: Bearer {token}
```

#### Buscar usuário por ID
```http
GET /api/users/{id}
Authorization: Bearer {token}
```

### Rifas

#### Criar rifa (requer autenticação)
```http
POST /api/rifas
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Rifa iPhone 15 Pro",
  "description": "Sorteio de iPhone 15 Pro 256GB",
  "price": "10.00",
  "totalQuotas": 100,
  "drawDate": "2025-12-31T20:00:00Z"
}
```

#### Listar rifas
```http
GET /api/rifas
```

#### Buscar rifa por ID
```http
GET /api/rifas/{id}
```

#### Comprar cota (requer autenticação)
```http
POST /api/rifas/purchase
Authorization: Bearer {token}
Content-Type: application/json

{
  "rifaId": "uuid-da-rifa",
  "quotaNumber": 42
}
```

## 🔐 Autenticação

Após fazer login, use o token JWT retornado no header de todas as requisições protegidas:

```
Authorization: Bearer {seu-token-aqui}
```

## ✅ Checklist de Clean Code

### ✓ Nomes claros
- Variáveis e funções com nomes descritivos
- Sem abreviações confusas
- Contexto claro no nome

### ✓ Funções pequenas
- Cada função faz UMA coisa
- Máximo de ~20 linhas por função
- Early returns para reduzir aninhamento

### ✓ Services enxutos
- Lógica de negócio isolada
- Sem dependência de HTTP
- Testável

### ✓ Controllers sem lógica
- Apenas orquestração
- Validação via Zod
- Tratamento de erros consistente

### ✓ Validações Zod
- Schemas separados em `*.validator.ts`
- Tipos inferidos automaticamente
- Mensagens de erro claras

### ✓ Sem magic numbers
- Constantes nomeadas
- Configurações em env
- Valores explicativos

### ✓ Separação de responsabilidades
- Model = Schema Drizzle
- Service = Lógica de negócio
- Controller = HTTP
- Routes = Roteamento

## 🎯 Princípios Seguidos

### ✓ Single Responsibility
Cada classe/função tem uma única responsabilidade

### ✓ DRY (Don't Repeat Yourself)
Código reutilizável e sem duplicação

### ✓ KISS (Keep It Simple, Stupid)
Simplicidade acima de complexidade desnecessária

### ✓ YAGNI (You Aren't Gonna Need It)
Implementado apenas o necessário

## 📦 Scripts Disponíveis

```bash
npm run dev          # Modo desenvolvimento com watch
npm run build        # Compila TypeScript
npm start            # Roda versão compilada
npm run db:generate  # Gera migrations do Drizzle
npm run db:migrate   # Executa migrations
npm run db:studio    # Abre Drizzle Studio
```

## 🗃️ Database

Para visualizar o banco de dados:

**Opção 1 - Adminer:**
```
http://localhost:8080
Sistema: PostgreSQL
Servidor: postgres
Usuário: postgres
Senha: postgres
Base de dados: residencial
```

**Opção 2 - Drizzle Studio:**
```bash
npm run db:studio
```

## 🏗️ Arquitetura

```
┌─────────────┐
│   Routes    │  → Define rotas HTTP
└──────┬──────┘
       │
┌──────▼──────┐
│ Controller  │  → Recebe request, valida e responde
└──────┬──────┘
       │
┌──────▼──────┐
│  Service    │  → Lógica de negócio
└──────┬──────┘
       │
┌──────▼──────┐
│ Drizzle ORM │  → Acesso ao banco
└──────┬──────┘
       │
┌──────▼──────┐
│ PostgreSQL  │  → Dados persistidos
└─────────────┘
```

## 🔧 Tecnologias e Por Quê

| Tecnologia | Por Quê |
|-----------|---------|
| **TypeScript** | Type safety, autocompletar, menos bugs |
| **Express** | Simples, maduro, amplamente usado |
| **Drizzle ORM** | Type-safe, performático, migrations simples |
| **Zod** | Validação + inferência de tipos automática |
| **JWT** | Stateless, escalável, padrão da indústria |
| **Pino** | Logger rápido e estruturado |
| **Docker** | Ambiente consistente, fácil deploy |

## 📝 Boas Práticas Implementadas

1. **Variáveis de ambiente validadas** - Erro na inicialização se faltar config
2. **Logs estruturados** - Facilita debugging e monitoramento
3. **Erros tratados globalmente** - Middleware centralizado
4. **Senhas hasheadas** - bcrypt com salt rounds
5. **JWT com expiração** - Tokens não vivem para sempre
6. **Validação em cada endpoint** - Dados sempre validados
7. **Separação de concerns** - Cada arquivo tem seu propósito
8. **Docker multi-stage** - Imagem de produção otimizada
9. **Health check endpoint** - Monitoramento de disponibilidade
10. **TypeScript strict mode** - Máxima segurança de tipos

## 🚫 O Que NÃO Foi Feito (propositalmente)

❌ DDD completo  
❌ CQRS  
❌ Hexagonal Architecture  
❌ Application/Domain layers complexas  
❌ Decorators  
❌ Inversão de dependência complexa  
❌ Classes abstratas desnecessárias  

**Por quê?** Simplicidade > Complexidade desnecessária

---

**Desenvolvido com foco em clareza, manutenibilidade e simplicidade.**

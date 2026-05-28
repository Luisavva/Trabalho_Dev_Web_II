# Trabalho_Dev_Web_II

# Task API 📋

Uma API REST completa para gerenciamento de projetos e tarefas, desenvolvida com **Node.js**, **TypeScript**, **Express** e **Prisma ORM**.

## 🎯 Visão Geral do Projeto

**Task API** é um sistema backend para que usuários gerenciem seus projetos e tarefas de forma organizada. Cada usuário pode criar múltiplos projetos, e cada projeto pode conter múltiplas tarefas. O sistema inclui autenticação robusta com JWT e controle de acesso baseado em papéis (RBAC).

### Domínio Escolhido
**Plataforma de Tarefas (To-do)** — um sistema simples e escalável para produtividade pessoal.

## 🚀 Stack Tecnológico

- **Runtime**: Node.js 20+
- **Linguagem**: TypeScript (ESM)
- **Framework HTTP**: Express.js
- **ORM**: Prisma (SQLite com better-sqlite3)
- **Autenticação**: JWT (jsonwebtoken) + bcrypt
- **Validação**: Zod
- **Testes**: Vitest + Supertest
- **Cobertura**: v8 (meta: 70%+)

## 📋 Requisitos Funcionais

### Autenticação e Gestão de Usuários
- ✅ `POST /auth/register` — Criar conta (senha hasheada)
- ✅ `POST /auth/login` — Login com retorno de JWT
- ✅ `GET /auth/me` — Dados do usuário autenticado

### CRUD de Projetos
- ✅ `POST /projects` — Criar projeto
- ✅ `GET /projects` — Listar projetos do usuário (com paginação)
- ✅ `GET /projects/:id` — Buscar projeto por ID (com tarefas associadas)
- ✅ `PATCH /projects/:id` — Atualizar projeto
- ✅ `DELETE /projects/:id` — Deletar projeto (soft delete)
- ✅ `DELETE /projects` — Deletar todos (apenas ADMIN)

### CRUD de Tarefas
- ✅ `POST /tasks` — Criar tarefa em um projeto
- ✅ `GET /tasks/:projectId` — Listar tarefas do projeto (com filtro de status)
- ✅ `GET /tasks/task/:id` — Buscar tarefa por ID (com projeto associado)
- ✅ `PATCH /tasks/:id` — Atualizar tarefa
- ✅ `DELETE /tasks/:id` — Deletar tarefa (soft delete)

### Autorização
- ✅ Controle por papel: `USER` (padrão) e `ADMIN`
- ✅ Controle de propriedade: usuários só veem/editam seus próprios recursos
- ✅ Rotas administrativas: `/projects DELETE` (ADMIN only)

## 🛠️ Instalação

### Pré-requisitos
- Node.js 20+
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd task-api
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite `.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_super_secreta_aqui_minimo_32_caracteres"
PORT=3000
NODE_ENV="development"
```

4. **Execute as migrations do Prisma**
```bash
npm run prisma:migrate
```

Isso criará o arquivo `prisma/dev.db` com as tabelas.

5. **Inicie o servidor em desenvolvimento**
```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

## 🧪 Testes

### Rodar todos os testes
```bash
npm test
```

### Gerar relatório de cobertura
```bash
npm run test:coverage
```

Isso cria uma pasta `coverage/` com relatório HTML.

### Testes inclusos
- **Unitários** (5+): Hashing, JWT, validações Zod
- **Integração** (10+): Auth, CRUD, autorização, propriedade

Cobertura esperada: **70%+ linhas e funções**

## 📝 Exemplos de Requisições

### 1. Registrar Novo Usuário
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "name": "João Silva",
    "password": "senha123456"
  }'
```

**Resposta (201):**
```json
{
  "id": "clu7k8x9k",
  "email": "joao@example.com",
  "name": "João Silva",
  "role": "USER",
  "token": "eyJhbGc..."
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123456"
  }'
```

**Resposta (200):**
```json
{
  "id": "clu7k8x9k",
  "email": "joao@example.com",
  "name": "João Silva",
  "role": "USER",
  "token": "eyJhbGc..."
}
```

### 3. Buscar Usuário Autenticado
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGc..."
```

**Resposta (200):**
```json
{
  "id": "clu7k8x9k",
  "email": "joao@example.com",
  "name": "João Silva",
  "role": "USER"
}
```

### 4. Criar Projeto
```bash
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "title": "Estudar TypeScript",
    "description": "Completar o módulo de tipos avançados"
  }'
```

**Resposta (201):**
```json
{
  "id": "proj_123",
  "title": "Estudar TypeScript",
  "description": "Completar o módulo de tipos avançados",
  "userId": "clu7k8x9k",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "deletedAt": null
}
```

### 5. Listar Projetos do Usuário
```bash
curl -X GET "http://localhost:3000/projects?page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Resposta (200):**
```json
{
  "data": [
    {
      "id": "proj_123",
      "title": "Estudar TypeScript",
      "description": "...",
      "userId": "clu7k8x9k",
      "tasks": [
        { "id": "task_1", "completed": false },
        { "id": "task_2", "completed": true }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

### 6. Criar Tarefa
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "projectId": "proj_123",
    "title": "Ler capítulo sobre Generics",
    "description": "Entender como usar Generics em funções",
    "completed": false
  }'
```

**Resposta (201):**
```json
{
  "id": "task_1",
  "title": "Ler capítulo sobre Generics",
  "description": "Entender como usar Generics em funções",
  "completed": false,
  "projectId": "proj_123",
  "userId": "clu7k8x9k",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z",
  "deletedAt": null
}
```

### 7. Listar Tarefas de um Projeto
```bash
curl -X GET "http://localhost:3000/tasks/proj_123?completed=false" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Resposta (200):**
```json
{
  "data": [
    {
      "id": "task_1",
      "title": "Ler capítulo sobre Generics",
      "completed": false,
      "projectId": "proj_123",
      "userId": "clu7k8x9k",
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

### 8. Atualizar Tarefa (marcar como concluída)
```bash
curl -X PATCH http://localhost:3000/tasks/task_1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "completed": true
  }'
```

**Resposta (200):**
```json
{
  "id": "task_1",
  "title": "Ler capítulo sobre Generics",
  "description": "Entender como usar Generics em funções",
  "completed": true,
  "projectId": "proj_123",
  "userId": "clu7k8x9k",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:05:00Z",
  "deletedAt": null
}
```

### 9. Deletar Tarefa
```bash
curl -X DELETE http://localhost:3000/tasks/task_1 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Resposta (204):** Sem corpo

### 10. Acesso Negado (sem token)
```bash
curl -X GET http://localhost:3000/projects
```

**Resposta (401):**
```json
{
  "error": "Token ausente ou inválido"
}
```

### 11. Acesso Negado (operação restrita a ADMIN)
```bash
curl -X DELETE http://localhost:3000/projects \
  -H "Authorization: Bearer eyJhbGc..." (token de USER)
```

**Resposta (403):**
```json
{
  "error": "Permissão negada"
}
```

### 12. Propriedade (USER tenta editar projeto de outro)
Após fazer login como User A, tentar editar projeto de User B:

```bash
curl -X PATCH http://localhost:3000/projects/proj_outra_pessoa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_USER_A" \
  -d '{"title": "Hackeado"}'
```

**Resposta (403):**
```json
{
  "error": "Acesso negado"
}
```

## 📄 Coleção Postman/Insomnia

Uma coleção pronta para importar está em `docs/task-api.postman_collection.json`.

**Para importar:**
1. Abra Postman
2. Clique em "Import"
3. Selecione o arquivo
4. Crie uma variável de ambiente `token` com seu JWT

## 🎓 Aprendizados Principais

Este projeto cobre:

1. **API REST**: Rotas CRUD, status codes, headers
2. **Autenticação**: JWT, bcrypt, tokens de sessão
3. **Autorização**: RBAC (roles), controle de propriedade
4. **Banco de Dados**: Prisma ORM, relacionamentos, migrations
5. **Validação**: Zod schemas, sanitização de input
6. **Testes**: Testes unitários e de integração
7. **TypeScript**: Types, interfaces, genéricos
8. **Organização**: Estrutura profissional de projeto

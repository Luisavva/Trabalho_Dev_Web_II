# TaskFlow API — Plataforma de Tarefas (To-do)

API REST completa para uma **plataforma de tarefas**, construída com **Node.js 20 + TypeScript (ESM)**, **Express**, **Prisma ORM** (adapter `better-sqlite3`), **SQLite**, autenticação **JWT + bcrypt**, validação com **Zod** e testes com **Vitest + Supertest**.

> Projeto da avaliação C2. Domínio escolhido: **Plataforma de Tarefas (usuários, projetos, tarefas, etiquetas e colaboradores).**

---

## 1. Domínio e entidades

O sistema modela uma ferramenta de gestão de tarefas no estilo *Trello/Todoist*: usuários criam **projetos**, cada projeto tem **tarefas**, tarefas recebem **etiquetas**, e projetos podem ter **colaboradores**.

São **6 entidades** (4 principais + 2 tabelas de junção N:N explícitas):

| Entidade | Descrição | Relacionamentos |
|---|---|---|
| **User** | Conta do sistema. Papéis: `USER` ou `ADMIN`. | dono de Projects; colaborador (N:N); responsável por Tasks |
| **Project** | Projeto pertencente a um dono. Tem **soft delete** (`deletedAt`). | `owner` (User), `tasks`, `collaborators` |
| **Task** | Tarefa de um projeto. Tem `status`, `priority`, `dueDate`. | `project`, `assignee` (User), `tags` (N:N) |
| **Tag** | Etiqueta reutilizável. Leitura pública; escrita só ADMIN. | `tasks` (N:N) |
| **ProjectCollaborator** | Junção N:N entre Project e User. | `project`, `user` |
| **TaskTag** | Junção N:N entre Task e Tag. | `task`, `tag` |

Diagrama de relacionamentos (texto):

```
User 1───N Project 1───N Task N───N Tag
  │            │
  │ (N:N)      └── ProjectCollaborator (N:N) ──┘
  └── assignee de Task / colaborador de Project
```

> **Observação técnica:** o SQLite no Prisma não suporta `enum`. Por isso `role`, `status` e `priority` são `String` no schema e têm seus valores válidos garantidos pela **validação Zod** nas rotas de escrita.

---

## 2. Stack

- **Runtime:** Node.js 20+ (ES Modules, `"type": "module"`)
- **Linguagem:** TypeScript 5 (execução via `tsx`, sem etapa de build)
- **HTTP:** Express 4
- **ORM:** Prisma 6 com **adapter `@prisma/adapter-better-sqlite3`**
- **Banco:** SQLite (arquivo local, schema versionado em `prisma/migrations/`)
- **Auth:** JWT (`jsonwebtoken`) + **`bcryptjs`** para hash de senha
- **Validação:** Zod
- **Testes:** Vitest + Supertest (banco de testes isolado)

> **Por que `bcryptjs` e não `bcrypt`?** O `bcryptjs` implementa exatamente o mesmo algoritmo bcrypt, porém em JavaScript puro — sem dependência de compilação nativa. Isso evita erros de build em diferentes máquinas/SO e mantém a instalação simples. A interface (`hash`, `compare`) é equivalente.

---

## 3. Instalação e execução

Pré-requisitos: **Node.js 20+** e npm.

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de ambiente a partir do exemplo
cp .env.example .env

# 3. Gerar o Prisma Client
npm run generate

# 4. Aplicar as migrations (cria prisma/dev.db)
npm run migrate

# 5. (opcional) Popular com um ADMIN e etiquetas iniciais
npm run seed

# 6. Subir o servidor em modo desenvolvimento
npm run dev
```

O servidor sobe em `http://localhost:3333`. Teste com:

```bash
curl http://localhost:3333/health
# {"status":"ok"}
```

Usuário ADMIN criado pelo `seed`: **`admin@taskflow.dev`** / senha **`admin123`**.

### Scripts disponíveis

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor com hot-reload (`tsx watch`) |
| `npm start` | Servidor em produção |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm run generate` | Gera o Prisma Client |
| `npm run migrate` | Aplica/cria migrations (dev) |
| `npm run migrate:deploy` | Aplica migrations (produção/CI) |
| `npm run studio` | Abre o Prisma Studio |
| `npm run seed` | Popula o banco com dados iniciais |
| `npm test` | Roda toda a suíte de testes |
| `npm run test:coverage` | Roda os testes com relatório de cobertura |

> ### ⚠️ Sobre o caminho do banco (importante)
> O adapter `better-sqlite3` resolve o caminho **a partir da raiz do projeto**, enquanto o **Prisma CLI** resolve a partir da pasta `prisma/`. Para que ambos apontem para o **mesmo** arquivo `prisma/dev.db`:
> - O `.env` usa `DATABASE_URL="file:./prisma/dev.db"` (lido pelo adapter em runtime).
> - Os scripts de CLI passam `DATABASE_URL=file:./dev.db` via `cross-env`.
>
> Não altere isso sem entender os dois contextos, ou o app e o CLI passam a usar bancos diferentes.

---

## 4. Variáveis de ambiente

Veja `.env.example`. Variáveis:

| Variável | Exemplo | Descrição |
|---|---|---|
| `DATABASE_URL` | `file:./prisma/dev.db` | Caminho do SQLite (usado pelo adapter em runtime) |
| `JWT_SECRET` | `uma-string-aleatoria-grande` | Segredo para assinar os JWT |
| `JWT_EXPIRES_IN` | `1d` | Expiração do token |
| `PORT` | `3333` | Porta do servidor |

---

## 5. Endpoints

Todas as respostas são JSON. Status codes usados: `200, 201, 204, 401, 403, 404, 409, 422, 500`.

### Autenticação (`/auth`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | — | Cria conta (papel `USER`). Senha hasheada. `201` |
| POST | `/auth/login` | — | Retorna `{ user, token }`. `200` / `401` |
| GET | `/auth/me` | JWT | Dados do usuário autenticado |

### Usuários (`/users`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/users` | **ADMIN** | Lista todos os usuários |
| GET | `/users/:id` | JWT | Detalhe de um usuário |
| PATCH | `/users/:id` | dono **ou** ADMIN | Atualiza a própria conta (ownership) |
| PATCH | `/users/:id/role` | **ADMIN** | Promove/rebaixa papel |
| DELETE | `/users/:id` | **ADMIN** | Remove usuário. `204` |

### Projetos (`/projects`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/projects` | JWT | Cria projeto (autor vira dono). `201` |
| GET | `/projects` | JWT | Lista projetos do usuário. **Paginação/busca**: `?page=1&limit=20&search=` |
| GET | `/projects/:id` | acesso | Detalhe **com `include`** (owner, tasks, tags, colaboradores) |
| PATCH | `/projects/:id` | **dono**/ADMIN | Atualiza (ownership) |
| DELETE | `/projects/:id` | **dono**/ADMIN | **Soft delete**. `204` |
| POST | `/projects/:id/collaborators` | dono/ADMIN | Adiciona colaborador |
| DELETE | `/projects/:id/collaborators/:userId` | dono/ADMIN | Remove colaborador. `204` |

### Tarefas (`/tasks`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/tasks` | acesso ao projeto | Cria tarefa (aceita `tagIds`). `201` |
| GET | `/tasks` | JWT | Lista. Filtros: `?projectId=&status=&page=&limit=` |
| GET | `/tasks/:id` | acesso | Detalhe **com relacionamentos** |
| PATCH | `/tasks/:id` | acesso | Atualiza (recria etiquetas se enviar `tagIds`) |
| DELETE | `/tasks/:id` | acesso | Remove. `204` |

### Etiquetas (`/tags`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/tags` | **público** | Lista etiquetas (rota de leitura pública) |
| GET | `/tags/:id` | **público** | Detalhe de etiqueta |
| POST | `/tags` | **ADMIN** | Cria etiqueta |
| PATCH | `/tags/:id` | **ADMIN** | Atualiza |
| DELETE | `/tags/:id` | **ADMIN** | Remove. `204` |

> **Códigos de erro semânticos:** validação Zod → **422**; falta/erro de token → **401**; papel/propriedade insuficiente → **403**; recurso inexistente → **404**; conflito (e-mail/etiqueta duplicada) → **409**.

---

## 6. Exemplos com `curl`

```bash
BASE=http://localhost:3333

# 1) Registrar
curl -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Maria","email":"maria@taskflow.dev","password":"senha123"}'

# 2) Login (guarde o token)
TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"maria@taskflow.dev","password":"senha123"}' | jq -r .token)

# 3) Quem sou eu
curl $BASE/auth/me -H "Authorization: Bearer $TOKEN"

# 4) Criar um projeto
PROJ=$(curl -s -X POST $BASE/projects -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"Meu Projeto"}' | jq -r .id)

# 5) Criar uma tarefa no projeto
curl -X POST $BASE/tasks -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Primeira tarefa\",\"priority\":\"HIGH\",\"projectId\":\"$PROJ\"}"

# 6) Detalhe do projeto com relacionamentos
curl $BASE/projects/$PROJ -H "Authorization: Bearer $TOKEN"

# 7) Listar etiquetas (rota pública — sem token)
curl $BASE/tags
```

> Há também uma coleção pronta em **`requests.http`** (extensão *REST Client* do VS Code) e **`docs/postman_collection.json`** (importável no Postman/Insomnia).

---

## 7. Testes

Banco de testes isolado (`prisma/test.db`), recriado automaticamente antes da suíte e limpo antes de cada teste.

```bash
npm test               # roda tudo
npm run test:coverage  # roda com relatório de cobertura
```

A suíte cobre os cenários exigidos:

**Unitários** (`tests/unit/`): hash ≠ senha pura; `verifyPassword` correto/incorreto; assinatura e verificação de JWT; validações Zod (válidas e inválidas) para register, login, task e tag.

**Integração** (`tests/integration/`): registro com sucesso/falha (duplicado → 409, senha curta → 422); login com sucesso/falha (401); rota protegida sem token → 401; CRUD completo de Project e Task; **autorização por papel** (USER em rota ADMIN → 403); **autorização por propriedade** (USER editando recurso de outro → 403); rota de leitura pública.

A meta de cobertura (**≥70% linhas e funções**) está configurada em `vitest.config.ts`. O relatório (saída de `npm run test:coverage`) deve ser anexado em **`docs/COVERAGE.md`** — veja as instruções lá.

---

## 8. Estrutura do projeto

```
meu-projeto-c2/
├── prisma/
│   ├── migrations/            # schema versionado (SQL)
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── lib/                   # prisma, auth (hash/jwt), access, http
│   ├── middlewares/           # authenticate, authorize, validate, errorHandler
│   ├── routes/                # auth, users, projects, tasks, tags
│   ├── schemas/               # validações Zod
│   ├── types/                 # augmentation do Express (req.user)
│   ├── app.ts                 # createApp() — usado pelos testes
│   └── server.ts              # bootstrap
├── tests/
│   ├── unit/                  # auth, schemas
│   ├── integration/           # auth, projects, tasks, authorization
│   ├── helpers.ts
│   └── setup.ts
├── docs/                      # COVERAGE.md + coleção Postman
├── requests.http              # coleção REST Client
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 9. Pontos extras implementados

- ✅ **Paginação e filtros** em `GET /projects` e `GET /tasks` (`page`, `limit`, `search`/`status`).
- ✅ **Soft delete** na entidade `Project` (campo `deletedAt`).
- ✅ **CI no GitHub Actions** (`.github/workflows/ci.yml`) rodando typecheck + testes com cobertura a cada push/PR.
- ⬜ Refresh tokens / Swagger — não implementados (espaço para melhoria futura).

---

## 10. Licença

MIT. Projeto acadêmico.

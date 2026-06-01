# Relatório de Cobertura de Testes

A meta exigida é **≥ 70% de linhas e funções**, configurada em `vitest.config.ts`
(`coverage.thresholds.lines = 70`, `coverage.thresholds.functions = 70`). Se a
cobertura ficar abaixo disso, o comando `npm run test:coverage` **falha** — ou seja,
a própria CI/local garante o piso.

## Como gerar o relatório

```bash
npm install
npm run generate
npm run test:coverage
```

Isso roda toda a suíte e imprime no terminal uma tabela como esta (formato `text`),
além de gerar um relatório navegável em `coverage/index.html` e um `coverage/lcov.info`.

## Como anexar a evidência (entregável)

1. Rode `npm run test:coverage`.
2. Tire um **print da tabela de cobertura** exibida no terminal (a seção
   `% Coverage report from v8` com as colunas *% Stmts / % Branch / % Funcs / % Lines*).
3. Salve a imagem nesta pasta como **`docs/coverage.png`** e referencie-a aqui:

   ```markdown
   ![Cobertura de testes](./coverage.png)
   ```

4. Alternativamente, abra `coverage/index.html` no navegador e tire o print da
   página de resumo.

> **Nota de honestidade acadêmica:** este arquivo é um modelo. O print **deve ser
> gerado por você** na sua máquina após instalar as dependências — ele reflete a
> execução real dos testes no seu ambiente. Não inclua um print fabricado.

## O que a suíte cobre

- **Unitários** (`tests/unit/auth.test.ts`, `tests/unit/schemas.test.ts`): helpers de
  senha (hash/verify) e token (sign/verify), e validações Zod válidas/inválidas.
- **Integração** (`tests/integration/*.test.ts`): fluxo de autenticação, CRUD de
  projetos e tarefas, autorização por papel (ADMIN) e por propriedade (ownership),
  e rota de leitura pública.

Os arquivos `src/server.ts` e os tipos (`src/types/**`, `*.d.ts`) são excluídos da
medição por não conterem lógica testável de forma unitária (apenas bootstrap/tipos).

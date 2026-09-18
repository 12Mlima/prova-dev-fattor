# prova-dev-fattor

Prova para candidatos dev seniors — [enunciado original](./_prova/README.md).

Solução: upload de um arquivo **CNAB 444**, extração da Chave de Acesso da NFe de cada
título e consulta de status na API da prova (login JWT + rota autenticada por path).

## Stack

- **Backend**: Node.js + Express + **TypeScript** (`server/`)
- **Frontend**: **React** + **TypeScript** (Vite) (`web/`)

## Documentação

- [docs/CNAB444.md](./docs/CNAB444.md) — o que é o CNAB 444, estrutura do arquivo e onde
  estão os dados extraídos.
- [docs/API.md](./docs/API.md) — resumo do Swagger/OpenAPI da API (login e consulta de
  status).

## Como rodar

Pré-requisitos: Node.js 20+.

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

- `npm install` instala as dependências dos dois workspaces (`server` e `web`).
- `server/.env` define a URL base da API, as credenciais de login e a porta do backend.
  As credenciais de demonstração estão documentadas como exemplo no próprio 
  [Swagger da prova](./docs/API.md) — preencha `FATTOR_API_EMAIL` e `FATTOR_API_PASSWORD` 
  no `server/.env` com elas.
- `npm run dev` sobe o backend em `http://localhost:3001` e o frontend (Vite) em
  `http://localhost:5173`, com proxy de `/api` do frontend para o backend.

Acesse `http://localhost:5173`, envie o arquivo `_prova/meu_cnab.rem` (ou outro CNAB 444
no mesmo layout) e veja a lista de identificadores + situação retornados pela API.

### Build de produção

```bash
npm run build
```

Gera `server/dist` (backend compilado) e `web/dist` (frontend estático).

### Testes

```bash
npm run test --workspace server
```

Testes unitários do parser de CNAB 444 ([cnabParser.test.ts](./server/src/cnabParser.test.ts),
usando o próprio arquivo de amostra `_prova/meu_cnab.rem`) e testes de integração do
cliente da API ([fattorClient.test.ts](./server/src/fattorClient.test.ts), com `axios` mockado
para cobrir login, cache de token, renovação em 401 e erros da API).

## Estrutura do projeto

```
_prova/          arquivo de exemplo (CNAB 444) e enunciado original da prova
docs/            documentação da CNAB 444 e da API
server/          backend Express/TypeScript (parser CNAB + integração com a API)
web/             frontend React/TypeScript (upload + tabela de resultados)
```

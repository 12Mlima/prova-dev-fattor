# API da prova — resumo do Swagger/OpenAPI

- **Swagger UI**: https://symphony.fattorcredito.com.br/public/prova-dev/swagger
- **Spec OpenAPI (JSON)**: https://symphony.fattorcredito.com.br/public/prova-dev/openapi
- **Base path**: `https://symphony.fattorcredito.com.br/public/prova-dev`

## 1. Login — `POST /login`

Autentica com e-mail e senha e retorna um token **JWT**.

- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  { "email": "demo@prova.dev", "password": "demo123" }
  ```
- **Resposta 200**:
  ```json
  { "token": "<jwt>", "expires_in": 3600, "type": "Bearer" }
  ```
- **Resposta 400**: `{ "error": "..." }` (dados inválidos)

## 2. Consulta de status — `GET /status/{chave}`

Rota autenticada. Retorna a situação do item identificado pela **chave** no path — no
caso desta prova, a **Chave de Acesso da NFe (44 dígitos)** extraída do arquivo CNAB 444
(ver [CNAB444.md](./CNAB444.md)).

- **Headers**: `Authorization: Bearer <token>`
- **Path param**: `chave` (string) — ex.: `35240300000000000199550010000000011234567890`
- **Resposta 200**:
  ```json
  {
    "status": "ativo",
    "usuario": "demo@prova.dev",
    "ambiente": "prova-dev",
    "versao": "1.0.0",
    "ultima_consulta": "2026-09-17T23:04:31.077Z",
    "chave_nfe": "35240300000000000199550010000000011234567890",
    "situacao": "autorizada"
  }
  ```
  `situacao` é um enum: `autorizada | cancelada | rejeitada | denegada | nao_encontrada`
  (`nao_encontrada` quando a chave não existe no dicionário da prova).
- **Resposta 401**: `{ "error": "..." }` (token ausente ou inválido)

## 3. Fluxo usado nesta implementação

1. `server/src/fattorClient.ts` faz `POST /login` com as credenciais de `server/.env` e
   guarda o token em memória (cache) até perto do vencimento (`expires_in`).
2. Para cada chave extraída do CNAB 444, chama `GET /status/{chave}` com
   `Authorization: Bearer <token>`.
3. Se a API responder `401` (token expirado), o cliente descarta o cache, faz login de
   novo e repete a chamada uma única vez.
4. As consultas são feitas com concorrência limitada (4 simultâneas) para não disparar
   todas as chamadas de uma vez.

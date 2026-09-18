# Frontend

Esta pasta contém o frontend da prova, desenvolvido em React com TypeScript e
utilizando Vite.

A aplicação é composta pela tela de upload do arquivo CNAB 444 e pela tabela
com o resultado da consulta de status, sem uso de bibliotecas adicionais de
gerenciamento de estado ou roteamento. O componente `App.tsx` concentra o
fluxo principal (envio do arquivo, exibição de carregamento, tratamento de
erros e exibição dos resultados), enquanto os componentes de upload e de
tabela ficam organizados em `src/components`.

## Executando separadamente

Para subir apenas o frontend, é necessário que o backend esteja em execução
na porta 3001, pois o upload depende dessa API:

```bash
npm install
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`. As requisições para
`/api/...` são redirecionadas automaticamente para o backend por meio do
proxy configurado em `vite.config.ts`.

Para executar o projeto completo (frontend e backend simultaneamente),
recomenda-se utilizar o comando `npm run dev` a partir da raiz do projeto.

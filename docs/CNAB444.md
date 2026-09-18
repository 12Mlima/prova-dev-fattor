# Arquivo CNAB 444 — o que é e como foi analisado

## 1. O que é CNAB

CNAB (**C**entro **N**acional de **A**utomação **B**ancária) é um conjunto de layouts de
arquivo-texto padronizados pela FEBRABAN para troca de informações entre empresas e bancos
(remessas de cobrança, pagamentos, retornos etc.). Os layouts mais conhecidos são:

- **CNAB 240**: linhas de 240 posições, formato mais recente e mais usado atualmente
  (multi-banco, suporta lotes e mais tipos de operação).
- **CNAB 400**: linhas de 400 posições, formato mais antigo, historicamente usado para
  **remessa/retorno de cobrança** (boletos). Cada banco tinha variações próprias dentro
  desse padrão.

## 2. O que é "CNAB 444"

**CNAB 444 não é um padrão oficial da FEBRABAN.** É uma variação/extensão de mercado do
CNAB 400 de cobrança em que, **ao final de cada registro de 400 posições, são
acrescentadas mais 44 posições** contendo a **Chave de Acesso da NFe** (Nota Fiscal
Eletrônica, sempre com 44 dígitos) associada ao título de cobrança. O resultado é uma
linha de **400 + 44 = 444 posições**.

Esse tipo de extensão é usado por empresas/bancos que precisam vincular cada boleto
(título de cobrança) à nota fiscal que o originou, sem quebrar a compatibilidade com o
parser de CNAB 400 tradicional (basta ignorar as 44 posições finais se não forem usadas).

Diferença em relação a outros CNAB:

| Formato  | Tamanho da linha | Uso típico                                 | Padrão oficial?           |
| -------- | ---------------- | ------------------------------------------ | ------------------------- |
| CNAB 240 | 240              | Multi-operação, multi-banco (atual)        | Sim (FEBRABAN)            |
| CNAB 400 | 400              | Remessa/retorno de cobrança (legado)       | Sim (FEBRABAN)            |
| CNAB 444 | 444 (400 + 44)   | CNAB 400 de cobrança + Chave de Acesso NFe | Não — extensão de mercado |

## 3. Estrutura do arquivo desta prova (`_prova/meu_cnab.rem`)

Análise feita diretamente sobre o arquivo de amostra (12 linhas, todas com **444
caracteres**):

| Linha(s) | Tipo de registro (posição 1) | Papel                                                        |
| -------- | ---------------------------- | ------------------------------------------------------------ |
| 1        | `0`                          | **Header** de arquivo (identificação de remessa/empresa)     |
| 2–11     | `1`                          | **Detalhe** — um título de cobrança por linha (10 registros) |
| 12       | `9`                          | **Trailer** de arquivo (contador de registros)               |

### 3.1 Registro Header (tipo `0`)

Primeira linha do arquivo, com metadados fixos de identificação da remessa (código do
arquivo, literal `REMESSA`, código/nome da empresa cedente, data de geração, número
sequencial do arquivo). Não contém dados usados na consulta de status.

### 3.2 Registro Detalhe (tipo `1`) — o mais importante

Cada uma das 10 linhas de detalhe representa um título de cobrança (duplicata mercantil)
vinculado a uma nota fiscal. Campos identificados por análise de posição:

| Campo                      | Posição (1-indexed) | Tamanho | Exemplo (linha 2)                               | Observação                                                                      |
| -------------------------- | ------------------- | ------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Tipo de registro           | 1                   | 1       | `1`                                             | Sempre `1` nas linhas de detalhe                                                |
| Nosso número / controle    | ~23–43 (variável)   | —       | `CONTROLE1`                                     | Identificador interno do título na amostra; extraído via padrão `CONTROLE(\d+)` |
| Espécie do título          | ~72–91              | 20      | `DUPLICATA MERCANTIL`                           | Fixo em todos os registros da amostra                                           |
| Data de vencimento         | logo após a espécie | 6       | `150425` → `15/04/2025`                         | Formato `DDMMAA`                                                                |
| Valor do título            | logo após a data    | —       | `0000000015000000` → interpretado como centavos | Campo numérico com padding de zeros                                             |
| Nome do pagador            | ~153–199            | —       | `PAGADOR FAKE 1`                                | Texto fixo seguido de espaços (branco)                                          |
| Cidade do pagador          | ~248–262            | —       | `SAO PAULO`                                     |                                                                                 |
| CEP                        | logo após a cidade  | 8       | `01310100`                                      |                                                                                 |
| UF do pagador              | logo após o CEP     | 2       | `SP`                                            |                                                                                 |
| **Chave de Acesso da NFe** | **401–444**         | **44**  | `35240300000000000199550010000000011234567890`  | **Campo usado na consulta de status da API**                                    |

> Nota sobre precisão: os campos de "nosso número", nome, cidade e valor foram
> localizados por análise de padrões (regex) no arquivo de amostra, pois o gerador do
> arquivo usa alguns campos de tamanho variável (ex.: `CONTROLE1` a `CONTROLE10`) que
> deslocam levemente as colunas seguintes. Já a **Chave de Acesso da NFe está
> confirmada como um campo fixo de largura constante nas posições 401–444 em todos os
> 10 registros de detalhe** — é esse o dado extraído e usado na etapa seguinte.

### 3.3 Registro Trailer (tipo `9`)

Última linha do arquivo, com o literal `9` na primeira posição e um contador de
registros (`000012` = 12 linhas no arquivo, incluindo header e trailer).

## 4. Dado extraído para a consulta de status

O identificador relevante para a rota `GET /status/{chave}` da API é a **Chave de Acesso
da NFe**, um número de **44 dígitos**, localizado nas **posições 401 a 444** de cada
registro de detalhe (tipo `1`). O arquivo de amostra contém **10 chaves distintas**, uma
por título de cobrança.

Exemplo das 10 chaves extraídas do arquivo desta prova:

```
35240300000000000199550010000000011234567890
35240300000000000199550010000000021234567891
35240300000000000199550010000000031234567892
35240300000000000199550010000000041234567893
35240300000000000199550010000000051234567894
35240300000000000199550010000000061234567895
35240300000000000199550010000000071234567896
35240300000000000199550010000000081234567897
35240300000000000199550010000000091234567898
35240300000000000199550010000000101234567899
```

A implementação do parser está em [`server/src/cnabParser.ts`](../server/src/cnabParser.ts).

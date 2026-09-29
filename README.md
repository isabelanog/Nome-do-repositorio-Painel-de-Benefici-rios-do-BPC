# Painel de Beneficiários do BPC — Recife

API em Fastify + frontend React/Vite para gestão de beneficiários do BPC e controle de acesso (RBAC) com usuários, papéis e permissões.

## Como rodar

```bash
npm install
npm run dev
```

O servidor sobe em **http://localhost:3000**.

A conexão com o MySQL é configurada pelo `.env` (veja `.env.example`):

| Variável | Padrão |
|---|---|
| `MYSQL_HOST` | `localhost` |
| `MYSQL_PORT` | `3306` |
| `MYSQL_USER` | `root` |
| `MYSQL_PASSWORD` | _(vazio)_ |
| `MYSQL_DATABASE` | `bpc_recife_db` |

Na inicialização, o banco e as tabelas são criados automaticamente e populados com dados iniciais se estiverem vazios. **Se o MySQL não estiver disponível, a API continua funcionando em modo de simulação em memória** (os dados se perdem ao reiniciar). Use `GET /api/status` para saber em qual modo está.

## Endpoints

URL base: `http://localhost:3000`

Requisições com body devem enviar o header `Content-Type: application/json`.

### Resumo

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/status` | Status da conexão e contagem de registros |
| GET | `/api/db/schema` | Script DDL e descrição das tabelas |
| POST | `/api/db/test-connection` | Testa uma conexão MySQL |
| POST | `/api/db/reset-seed` | Restaura os dados iniciais ⚠️ |
| GET | `/api/usuarios` | Lista usuários |
| GET | `/api/usuarios/:id` | Detalha um usuário |
| POST | `/api/usuarios` | Cria usuário |
| PUT | `/api/usuarios/:id` | Atualiza usuário |
| DELETE | `/api/usuarios/:id` | Remove usuário |
| GET | `/api/papeis` | Lista papéis |
| POST | `/api/papeis` | Cria papel |
| PUT | `/api/papeis/:id` | Atualiza papel |
| DELETE | `/api/papeis/:id` | Remove papel |
| GET | `/api/permissoes` | Lista permissões |
| POST | `/api/permissoes` | Cria permissão |
| PUT | `/api/permissoes/:id` | Atualiza permissão |
| DELETE | `/api/permissoes/:id` | Remove permissão |
| GET | `/api/usuario-papel` | Lista vínculos usuário ↔ papel |
| POST | `/api/usuario-papel` | Vincula papel a usuário |
| DELETE | `/api/usuario-papel` | Desvincula papel de usuário |
| GET | `/api/papel-permissao` | Lista vínculos papel ↔ permissão |
| POST | `/api/papel-permissao` | Vincula permissão a papel |
| DELETE | `/api/papel-permissao` | Desvincula permissão de papel |
| GET | `/api/beneficiarios` | Lista beneficiários (demonstração) |

---

### Banco de dados

#### `GET /api/status`

Retorna o modo de operação (`mysql` ou `in_memory`), dados da conexão e a contagem de registros por tabela.

```json
{
  "connected": true,
  "engine": "mysql",
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "database": "bpc_recife_db",
  "message": "Conectado ao servidor MySQL nativo com tabelas sincronizadas",
  "error": null,
  "counts": { "usuarios": 5, "papeis": 5, "permissoes": 8, "usuario_papel": 6, "papel_permissao": 24 }
}
```

#### `GET /api/db/schema`

Retorna o nome do banco, o script DDL completo (`ddl`) e a lista de tabelas com descrição e colunas.

#### `POST /api/db/test-connection`

Testa a conexão com um MySQL. Todos os campos são opcionais; os ausentes usam os valores do `.env`.

```json
{
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "",
  "database": "bpc_recife_db"
}
```

Resposta: `{ "success": true, "message": "Conexão ao MySQL (...) realizada com sucesso!" }`

#### `POST /api/db/reset-seed`

> ⚠️ **Apaga todos os usuários, papéis, permissões e vínculos** e reinsere os dados iniciais. Sem body.

---

### Usuários

#### `GET /api/usuarios`

Lista usuários com seus papéis. A senha nunca é retornada.

| Query param | Descrição |
|---|---|
| `search` | Opcional. Filtra por trecho do nome ou e-mail |

Exemplo: `GET /api/usuarios?search=isabela`

#### `GET /api/usuarios/:id`

Retorna o usuário com `papeis` e `permissoes_efetivas` (união das permissões de todos os seus papéis). Retorna `404` se não existir.

#### `POST /api/usuarios`

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `nome` | string | sim | |
| `email` | string | sim | Único |
| `senha` | string | não | Padrão: `Recife@2026`. Armazenada com bcrypt |
| `ativo` | boolean | não | Padrão: `true` |
| `papel_ids` | number[] | não | Papéis a vincular |

```json
{
  "nome": "Maria Teste",
  "email": "maria.teste@recife.pe.gov.br",
  "senha": "SenhaForte@1",
  "ativo": true,
  "papel_ids": [3, 4]
}
```

Resposta: `201` com o usuário criado. `400` se faltar `nome`/`email` ou se o e-mail já existir.

#### `PUT /api/usuarios/:id`

Todos os campos são opcionais; envie apenas o que deseja alterar.

```json
{ "nome": "Maria Atualizada", "ativo": false, "papel_ids": [2] }
```

> Se `papel_ids` for enviado, **substitui** todos os papéis do usuário.

#### `DELETE /api/usuarios/:id`

Remove o usuário e seus vínculos. Resposta: `{ "success": true }`

---

### Papéis

#### `GET /api/papeis`

Lista papéis com suas `permissoes` e `total_usuarios`.

#### `POST /api/papeis`

| Campo | Tipo | Obrigatório |
|---|---|---|
| `nome` | string | sim (único) |
| `descricao` | string | não |
| `permissao_ids` | number[] | não |

```json
{ "nome": "SUPERVISOR_CRAS", "descricao": "Supervisão das unidades CRAS", "permissao_ids": [1, 6] }
```

Resposta: `201` com o papel criado.

#### `PUT /api/papeis/:id`

Campos opcionais: `nome`, `descricao`, `permissao_ids`.

> Se `permissao_ids` for enviado, **substitui** todas as permissões do papel.

#### `DELETE /api/papeis/:id`

Remove o papel e seus vínculos com usuários e permissões.

---

### Permissões

#### `GET /api/permissoes`

Lista permissões com `total_papeis` (quantos papéis a possuem).

#### `POST /api/permissoes`

| Campo | Tipo | Obrigatório |
|---|---|---|
| `nome` | string | sim (único, formato sugerido `modulo:acao`) |
| `descricao` | string | não |

```json
{ "nome": "beneficiarios:exportar", "descricao": "Permite exportar a lista de beneficiários" }
```

Resposta: `201` com a permissão criada.

#### `PUT /api/permissoes/:id`

Campos opcionais: `nome`, `descricao`.

#### `DELETE /api/permissoes/:id`

Remove a permissão e seus vínculos com papéis.

---

### Vínculos usuário ↔ papel

#### `GET /api/usuario-papel`

```json
[{ "usuario_id": 1, "papel_id": 1, "usuario_nome": "Isabela Nogueira", "papel_nome": "ADMINISTRADOR_SISTEMA" }]
```

#### `POST /api/usuario-papel` · `DELETE /api/usuario-papel`

Ambos recebem o mesmo body (os dois campos são obrigatórios):

```json
{ "usuario_id": 1, "papel_id": 2 }
```

Resposta: `{ "success": true }`

---

### Vínculos papel ↔ permissão

#### `GET /api/papel-permissao`

```json
[{ "papel_id": 1, "permissao_id": 1, "papel_nome": "ADMINISTRADOR_SISTEMA", "permissao_nome": "beneficiarios:visualizar" }]
```

#### `POST /api/papel-permissao` · `DELETE /api/papel-permissao`

Ambos recebem o mesmo body (os dois campos são obrigatórios):

```json
{ "papel_id": 3, "permissao_id": 7 }
```

Resposta: `{ "success": true }`

---

### Beneficiários

#### `GET /api/beneficiarios`

Lista os beneficiários do BPC.

> ℹ️ Atualmente retorna **dados fixos de demonstração em memória**, mesmo com o MySQL conectado — ainda não existe tabela `beneficiarios` no banco.

```json
{
  "id": 1,
  "numero_beneficio": "870.432.198-0",
  "nome_completo": "Severina Francisca dos Santos",
  "cpf": "128.456.784-32",
  "nis": "160.89234.12-5",
  "tipo_beneficio": "Idoso (65+)",
  "bairro_recife": "Casa Amarela",
  "cras_referencia": "CRAS Casa Amarela",
  "status": "Ativo",
  "valor_mensal": 1518.0,
  "data_concessao": "2021-04-10",
  "cad_unico_atualizado": true
}
```

## Respostas de erro

| Status | Quando |
|---|---|
| `400` | Campo obrigatório ausente, e-mail/nome duplicado, ou registro não encontrado em PUT/DELETE (apenas no modo em memória) |
| `404` | Usuário não encontrado em `GET /api/usuarios/:id` |
| `500` | Erro interno ao consultar dados |

Formato: `{ "error": "mensagem" }`

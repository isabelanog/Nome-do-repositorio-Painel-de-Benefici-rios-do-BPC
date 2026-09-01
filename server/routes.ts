import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getDbStatus,
  testConnection,
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getPapeis,
  createPapel,
  updatePapel,
  deletePapel,
  getPermissoes,
  createPermissao,
  updatePermissao,
  deletePermissao,
  getUsuarioPapelList,
  getPapelPermissaoList,
  assignUsuarioPapel,
  removeUsuarioPapel,
  assignPapelPermissao,
  removePapelPermissao,
  getBeneficiarios,
  resetDatabaseSeeds,
  DDL_SQL,
  getDbConfig,
} from './db.js';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health & Database Status
  fastify.get('/api/status', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const status = await getDbStatus();
      return reply.send(status);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // DB Test Connection
  fastify.post('/api/db/test-connection', async (req: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    try {
      const result = await testConnection(req.body);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // Schema & DDL Script
  fastify.get('/api/db/schema', async (_req: FastifyRequest, reply: FastifyReply) => {
    const config = getDbConfig();
    return reply.send({
      database: config.database,
      ddl: DDL_SQL.trim(),
      tables: [
        {
          name: 'usuarios',
          description: 'Armazena servidores e operadores do sistema BPC Recife com credenciais e status.',
          columns: ['id (PK, AUTO_INCREMENT)', 'nome (VARCHAR 255)', 'email (VARCHAR 255 UNIQUE)', 'senha (VARCHAR 255)', 'ativo (BOOLEAN)', 'data_criacao (DATETIME)', 'data_atualizacao (DATETIME)'],
        },
        {
          name: 'papeis',
          description: 'Perfis de acesso e funções administrativas do sistema (ex: GESTOR_BPC_RECIFE, ASSISTENTE_SOCIAL_CRAS).',
          columns: ['id (PK, AUTO_INCREMENT)', 'nome (VARCHAR 100 UNIQUE)', 'descricao (TEXT)', 'data_criacao (DATETIME)', 'data_atualizacao (DATETIME)'],
        },
        {
          name: 'permissoes',
          description: 'Ações e privilégios granulares do sistema (ex: beneficiarios:visualizar, laudos:avaliar).',
          columns: ['id (PK, AUTO_INCREMENT)', 'nome (VARCHAR 100 UNIQUE)', 'descricao (TEXT)', 'data_criacao (DATETIME)', 'data_atualizacao (DATETIME)'],
        },
        {
          name: 'usuario_papel',
          description: 'Tabela associativa que relaciona usuários aos seus respectivos papéis de acesso (N:N).',
          columns: ['usuario_id (FK -> usuarios.id)', 'papel_id (FK -> papeis.id)', 'PK(usuario_id, papel_id)'],
        },
        {
          name: 'papel_permissao',
          description: 'Tabela associativa que mapeia as permissões atribuídas a cada papel no sistema (N:N).',
          columns: ['papel_id (FK -> papeis.id)', 'permissao_id (FK -> permissoes.id)', 'PK(papel_id, permissao_id)'],
        },
      ],
    });
  });

  // Reset Seeds
  fastify.post('/api/db/reset-seed', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await resetDatabaseSeeds();
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // ==========================================
  // USUARIOS ENDPOINTS
  // ==========================================
  fastify.get('/api/usuarios', async (req: FastifyRequest<{ Querystring: { search?: string } }>, reply: FastifyReply) => {
    try {
      const usuarios = await getUsuarios(req.query.search);
      return reply.send(usuarios);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.get('/api/usuarios/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const id = parseInt(req.params.id, 10);
      const usuario = await getUsuarioById(id);
      if (!usuario) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }
      return reply.send(usuario);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/api/usuarios', async (req: FastifyRequest<{ Body: { nome: string; email: string; senha?: string; ativo?: boolean; papel_ids?: number[] } }>, reply: FastifyReply) => {
    try {
      const { nome, email, senha, ativo, papel_ids } = req.body;
      if (!nome || !email) {
        return reply.status(400).send({ error: 'Campos obrigatórios: nome e email' });
      }
      const usuario = await createUsuario({ nome, email, senha, ativo, papel_ids });
      return reply.status(201).send(usuario);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/usuarios/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: { nome?: string; email?: string; senha?: string; ativo?: boolean; papel_ids?: number[] } }>, reply: FastifyReply) => {
    try {
      const id = parseInt(req.params.id, 10);
      const usuario = await updateUsuario(id, req.body);
      return reply.send(usuario);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/api/usuarios/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await deleteUsuario(id);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // ==========================================
  // PAPEIS (ROLES) ENDPOINTS
  // ==========================================
  fastify.get('/api/papeis', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const papeis = await getPapeis();
      return reply.send(papeis);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/api/papeis', async (req: FastifyRequest<{ Body: { nome: string; descricao?: string; permissao_ids?: number[] } }>, reply: FastifyReply) => {
    try {
      const { nome, descricao, permissao_ids } = req.body;
      if (!nome) {
        return reply.status(400).send({ error: 'Campo obrigatório: nome' });
      }
      const papel = await createPapel({ nome, descricao, permissao_ids });
      return reply.status(201).send(papel);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/papeis/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: { nome?: string; descricao?: string; permissao_ids?: number[] } }>, reply: FastifyReply) => {
    try {
      const id = parseInt(req.params.id, 10);
      const papel = await updatePapel(id, req.body);
      return reply.send(papel);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/api/papeis/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await deletePapel(id);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // ==========================================
  // PERMISSOES ENDPOINTS
  // ==========================================
  fastify.get('/api/permissoes', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const permissoes = await getPermissoes();
      return reply.send(permissoes);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/api/permissoes', async (req: FastifyRequest<{ Body: { nome: string; descricao?: string } }>, reply: FastifyReply) => {
    try {
      const { nome, descricao } = req.body;
      if (!nome) {
        return reply.status(400).send({ error: 'Campo obrigatório: nome' });
      }
      const permissao = await createPermissao({ nome, descricao });
      return reply.status(201).send(permissao);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/permissoes/:id', async (req: FastifyRequest<{ Params: { id: string }; Body: { nome?: string; descricao?: string } }>, reply: FastifyReply) => {
    try {
      const id = parseInt(req.params.id, 10);
      const permissao = await updatePermissao(id, req.body);
      return reply.send(permissao);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/api/permissoes/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await deletePermissao(id);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // ==========================================
  // USUARIO_PAPEL ASSOCIATIONS
  // ==========================================
  fastify.get('/api/usuario-papel', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const list = await getUsuarioPapelList();
      return reply.send(list);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/api/usuario-papel', async (req: FastifyRequest<{ Body: { usuario_id: number; papel_id: number } }>, reply: FastifyReply) => {
    try {
      const { usuario_id, papel_id } = req.body;
      if (!usuario_id || !papel_id) {
        return reply.status(400).send({ error: 'usuario_id e papel_id são obrigatórios' });
      }
      const result = await assignUsuarioPapel(Number(usuario_id), Number(papel_id));
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/api/usuario-papel', async (req: FastifyRequest<{ Body: { usuario_id: number; papel_id: number } }>, reply: FastifyReply) => {
    try {
      const { usuario_id, papel_id } = req.body;
      if (!usuario_id || !papel_id) {
        return reply.status(400).send({ error: 'usuario_id e papel_id são obrigatórios' });
      }
      const result = await removeUsuarioPapel(Number(usuario_id), Number(papel_id));
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // ==========================================
  // PAPEL_PERMISSAO ASSOCIATIONS
  // ==========================================
  fastify.get('/api/papel-permissao', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const list = await getPapelPermissaoList();
      return reply.send(list);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/api/papel-permissao', async (req: FastifyRequest<{ Body: { papel_id: number; permissao_id: number } }>, reply: FastifyReply) => {
    try {
      const { papel_id, permissao_id } = req.body;
      if (!papel_id || !permissao_id) {
        return reply.status(400).send({ error: 'papel_id e permissao_id são obrigatórios' });
      }
      const result = await assignPapelPermissao(Number(papel_id), Number(permissao_id));
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/api/papel-permissao', async (req: FastifyRequest<{ Body: { papel_id: number; permissao_id: number } }>, reply: FastifyReply) => {
    try {
      const { papel_id, permissao_id } = req.body;
      if (!papel_id || !permissao_id) {
        return reply.status(400).send({ error: 'papel_id e permissao_id são obrigatórios' });
      }
      const result = await removePapelPermissao(Number(papel_id), Number(permissao_id));
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // ==========================================
  // BENEFICIARIOS DEMO (RECIFE BPC)
  // ==========================================
  fastify.get('/api/beneficiarios', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const beneficiarios = await getBeneficiarios();
      return reply.send(beneficiarios);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}

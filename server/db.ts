import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

// In-Memory store fallback
interface MemoryStore {
  usuarios: Array<{
    id: number;
    nome: string;
    email: string;
    senha: string;
    ativo: boolean;
    data_criacao: string;
    data_atualizacao: string;
  }>;
  papeis: Array<{
    id: number;
    nome: string;
    descricao: string;
    data_criacao: string;
    data_atualizacao: string;
  }>;
  permissoes: Array<{
    id: number;
    nome: string;
    descricao: string;
    data_criacao: string;
    data_atualizacao: string;
  }>;
  usuario_papel: Array<{
    usuario_id: number;
    papel_id: number;
  }>;
  papel_permissao: Array<{
    papel_id: number;
    permissao_id: number;
  }>;
  beneficiarios: Array<{
    id: number;
    numero_beneficio: string;
    nome_completo: string;
    cpf: string;
    nis: string;
    tipo_beneficio: 'Idoso (65+)' | 'Pessoa com Deficiência (PCD)';
    bairro_recife: string;
    cras_referencia: string;
    status: 'Ativo' | 'Em Análise' | 'Suspenso' | 'Bloqueado';
    valor_mensal: number;
    data_concessao: string;
    cad_unico_atualizado: boolean;
  }>;
}

let pool: mysql.Pool | null = null;
let isMysqlConnected = false;
let lastConnectionError: string | null = null;

// Initial Seeds for Recife BPC Portal
const defaultPermissoes = [
  { id: 1, nome: 'beneficiarios:visualizar', descricao: 'Permite consultar lista e fichas de beneficiários BPC no Recife' },
  { id: 2, nome: 'beneficiarios:cadastrar', descricao: 'Permite incluir novos requerimentos e cadastros de beneficiários BPC' },
  { id: 3, nome: 'beneficiarios:editar', descricao: 'Permite atualizar dados socioeconômicos e cadastrais de beneficiários' },
  { id: 4, nome: 'beneficiarios:excluir', descricao: 'Permite desativar ou excluir registros de beneficiários' },
  { id: 5, nome: 'laudos:avaliar', descricao: 'Permite emissão e avaliação de laudos sociais e perícias médicas do BPC' },
  { id: 6, nome: 'visitas:agendar', descricao: 'Permite agendar e registrar visitas domiciliares dos CRAS/CREAS' },
  { id: 7, nome: 'relatorios:gerar', descricao: 'Permite gerar relatórios estatísticos e de auditoria da Prefeitura do Recife' },
  { id: 8, nome: 'seguranca:administrar', descricao: 'Acesso total à gestão de usuários, papéis e permissões no sistema' },
];

const defaultPapeis = [
  { id: 1, nome: 'ADMINISTRADOR_SISTEMA', descricao: 'Gestor geral de TI e segurança da Prefeitura do Recife com controle total' },
  { id: 2, nome: 'GESTOR_BPC_RECIFE', descricao: 'Coordenador da Secretaria de Desenvolvimento Social, Direitos Humanos e Políticas sobre Drogas' },
  { id: 3, nome: 'ASSISTENTE_SOCIAL_CRAS', descricao: 'Profissional técnico que realiza acompanhamento nos CRAS de Boa Viagem, Casa Amarela, Santo Amaro, etc.' },
  { id: 4, nome: 'OPERADOR_CADASTRO', descricao: 'Técnico de atendimento ao cidadão para consulta e atualização de cadastros BPC' },
  { id: 5, nome: 'AUDITOR_MUNICIPAL', descricao: 'Auditoria e controle interno para relatórios e conformidade fiscal/social' },
];

const defaultPapelPermissao = [
  // Administrador tem todas as permissoes
  { papel_id: 1, permissao_id: 1 },
  { papel_id: 1, permissao_id: 2 },
  { papel_id: 1, permissao_id: 3 },
  { papel_id: 1, permissao_id: 4 },
  { papel_id: 1, permissao_id: 5 },
  { papel_id: 1, permissao_id: 6 },
  { papel_id: 1, permissao_id: 7 },
  { papel_id: 1, permissao_id: 8 },

  // Gestor BPC
  { papel_id: 2, permissao_id: 1 },
  { papel_id: 2, permissao_id: 2 },
  { papel_id: 2, permissao_id: 3 },
  { papel_id: 2, permissao_id: 5 },
  { papel_id: 2, permissao_id: 6 },
  { papel_id: 2, permissao_id: 7 },

  // Assistente Social CRAS
  { papel_id: 3, permissao_id: 1 },
  { papel_id: 3, permissao_id: 3 },
  { papel_id: 3, permissao_id: 5 },
  { papel_id: 3, permissao_id: 6 },

  // Operador Cadastro
  { papel_id: 4, permissao_id: 1 },
  { papel_id: 4, permissao_id: 2 },
  { papel_id: 4, permissao_id: 3 },

  // Auditor Municipal
  { papel_id: 5, permissao_id: 1 },
  { papel_id: 5, permissao_id: 7 },
];

const defaultUsuarios = [
  {
    id: 1,
    nome: 'Isabela Nogueira',
    email: 'isabela.nogueira@recife.pe.gov.br',
    senha: bcrypt.hashSync('Recife@2026', 10),
    ativo: true,
    data_criacao: '2026-01-15T09:00:00.000Z',
    data_atualizacao: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 2,
    nome: 'Carlos Eduardo Bezerra',
    email: 'carlos.bezerra@recife.pe.gov.br',
    senha: bcrypt.hashSync('Recife@2026', 10),
    ativo: true,
    data_criacao: '2026-02-01T10:30:00.000Z',
    data_atualizacao: '2026-02-01T10:30:00.000Z',
  },
  {
    id: 3,
    nome: 'Mariana Vasconcelos de Melo',
    email: 'mariana.melo@cras.recife.pe.gov.br',
    senha: bcrypt.hashSync('Recife@2026', 10),
    ativo: true,
    data_criacao: '2026-02-10T14:15:00.000Z',
    data_atualizacao: '2026-02-10T14:15:00.000Z',
  },
  {
    id: 4,
    nome: 'Rodrigo Albuquerque Silva',
    email: 'rodrigo.silva@recife.pe.gov.br',
    senha: bcrypt.hashSync('Recife@2026', 10),
    ativo: true,
    data_criacao: '2026-03-01T08:00:00.000Z',
    data_atualizacao: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 5,
    nome: 'Fernanda Albuquerque Lima',
    email: 'fernanda.lima@recife.pe.gov.br',
    senha: bcrypt.hashSync('Recife@2026', 10),
    ativo: false,
    data_criacao: '2026-03-12T11:20:00.000Z',
    data_atualizacao: '2026-04-05T16:00:00.000Z',
  },
];

const defaultUsuarioPapel = [
  { usuario_id: 1, papel_id: 1 }, // Isabela -> Administrador
  { usuario_id: 1, papel_id: 2 }, // Isabela -> Gestor BPC
  { usuario_id: 2, papel_id: 2 }, // Carlos -> Gestor BPC
  { usuario_id: 3, papel_id: 3 }, // Mariana -> Assistente Social CRAS
  { usuario_id: 4, papel_id: 4 }, // Rodrigo -> Operador Cadastro
  { usuario_id: 5, papel_id: 5 }, // Fernanda -> Auditor Municipal
];

const defaultBeneficiarios = [
  {
    id: 1,
    numero_beneficio: '870.432.198-0',
    nome_completo: 'Severina Francisca dos Santos',
    cpf: '128.456.784-32',
    nis: '160.89234.12-5',
    tipo_beneficio: 'Idoso (65+)' as const,
    bairro_recife: 'Casa Amarela',
    cras_referencia: 'CRAS Casa Amarela',
    status: 'Ativo' as const,
    valor_mensal: 1518.00,
    data_concessao: '2021-04-10',
    cad_unico_atualizado: true,
  },
  {
    id: 2,
    numero_beneficio: '870.982.341-2',
    nome_completo: 'José Bezerra Cavalcanti',
    cpf: '094.321.654-90',
    nis: '210.45321.89-0',
    tipo_beneficio: 'Pessoa com Deficiência (PCD)' as const,
    bairro_recife: 'Várzea',
    cras_referencia: 'CRAS Várzea / CDU',
    status: 'Ativo' as const,
    valor_mensal: 1518.00,
    data_concessao: '2022-08-19',
    cad_unico_atualizado: true,
  },
  {
    id: 3,
    numero_beneficio: '871.204.812-7',
    nome_completo: 'Maria de Lourdes de Arruda',
    cpf: '231.789.432-11',
    nis: '143.90876.54-1',
    tipo_beneficio: 'Idoso (65+)' as const,
    bairro_recife: 'Santo Amaro',
    cras_referencia: 'CRAS Santo Amaro',
    status: 'Em Análise' as const,
    valor_mensal: 1518.00,
    data_concessao: '2026-01-20',
    cad_unico_atualizado: false,
  },
  {
    id: 4,
    numero_beneficio: '871.554.901-4',
    nome_completo: 'Antônio Carlos da Silva',
    cpf: '453.210.987-65',
    nis: '189.23456.78-9',
    tipo_beneficio: 'Pessoa com Deficiência (PCD)' as const,
    bairro_recife: 'Ibura',
    cras_referencia: 'CRAS Ibura / COHAB',
    status: 'Ativo' as const,
    valor_mensal: 1518.00,
    data_concessao: '2023-11-05',
    cad_unico_atualizado: true,
  },
  {
    id: 5,
    numero_beneficio: '871.776.320-9',
    nome_completo: 'Geralda Maria do Nascimento',
    cpf: '334.876.543-21',
    nis: '154.67890.12-3',
    tipo_beneficio: 'Idoso (65+)' as const,
    bairro_recife: 'Boa Viagem',
    cras_referencia: 'CRAS Boa Viagem',
    status: 'Suspenso' as const,
    valor_mensal: 1518.00,
    data_concessao: '2020-03-15',
    cad_unico_atualizado: false,
  },
];

const memoryStore: MemoryStore = {
  usuarios: JSON.parse(JSON.stringify(defaultUsuarios)),
  papeis: JSON.parse(JSON.stringify(defaultPapeis)),
  permissoes: JSON.parse(JSON.stringify(defaultPermissoes)),
  usuario_papel: JSON.parse(JSON.stringify(defaultUsuarioPapel)),
  papel_permissao: JSON.parse(JSON.stringify(defaultPapelPermissao)),
  beneficiarios: JSON.parse(JSON.stringify(defaultBeneficiarios)),
};

export const DDL_SQL = `
-- ============================================================================
-- PREFEITURA DA CIDADE DO RECIFE
-- SECRETARIA DE DESENVOLVIMENTO SOCIAL, DIREITOS HUMANOS E POLÍTICAS SOBRE DROGAS
-- BANCO DE DADOS: Painel de Beneficiário BPC do Recife
-- ARQUITETURA RBAC (Role-Based Access Control)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS \`bpc_recife_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`bpc_recife_db\`;

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS \`usuarios\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`senha\` VARCHAR(255) NOT NULL,
  \`ativo\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`data_criacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`data_atualizacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_usuarios_email\` (\`email\`),
  INDEX \`idx_usuarios_ativo\` (\`ativo\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DE PAPÉIS (ROLES)
CREATE TABLE IF NOT EXISTS \`papeis\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(100) NOT NULL UNIQUE,
  \`descricao\` TEXT NULL,
  \`data_criacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`data_atualizacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_papeis_nome\` (\`nome\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE PERMISSÕES
CREATE TABLE IF NOT EXISTS \`permissoes\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nome\` VARCHAR(100) NOT NULL UNIQUE,
  \`descricao\` TEXT NULL,
  \`data_criacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`data_atualizacao\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_permissoes_nome\` (\`nome\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA PIVÔ: USUÁRIO - PAPEL (N:N)
CREATE TABLE IF NOT EXISTS \`usuario_papel\` (
  \`usuario_id\` INT NOT NULL,
  \`papel_id\` INT NOT NULL,
  PRIMARY KEY (\`usuario_id\`, \`papel_id\`),
  CONSTRAINT \`fk_usuario_papel_usuario\`
    FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_usuario_papel_papel\`
    FOREIGN KEY (\`papel_id\`) REFERENCES \`papeis\` (\`id\`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX \`idx_up_usuario\` (\`usuario_id\`),
  INDEX \`idx_up_papel\` (\`papel_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELA PIVÔ: PAPEL - PERMISSÃO (N:N)
CREATE TABLE IF NOT EXISTS \`papel_permissao\` (
  \`papel_id\` INT NOT NULL,
  \`permissao_id\` INT NOT NULL,
  PRIMARY KEY (\`papel_id\`, \`permissao_id\`),
  CONSTRAINT \`fk_papel_permissao_papel\`
    FOREIGN KEY (\`papel_id\`) REFERENCES \`papeis\` (\`id\`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_papel_permissao_permissao\`
    FOREIGN KEY (\`permissao_id\`) REFERENCES \`permissoes\` (\`id\`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX \`idx_pp_papel\` (\`papel_id\`),
  INDEX \`idx_pp_permissao\` (\`permissao_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export function getDbConfig(): DbConfig {
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bpc_recife_db',
  };
}

export async function initDatabase(): Promise<boolean> {
  const config = getDbConfig();
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: 2000,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.end();

    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    });

    const poolConn = await pool.getConnection();
    await poolConn.query(DDL_SQL);

    // Check if table empty to seed
    const [rows]: [any[], any] = await poolConn.query('SELECT COUNT(*) as count FROM usuarios');
    if (rows[0].count === 0) {
      console.log('🌱 Seeding initial MySQL data for BPC Recife...');
      for (const p of defaultPermissoes) {
        await poolConn.query('INSERT IGNORE INTO permissoes (id, nome, descricao) VALUES (?, ?, ?)', [p.id, p.nome, p.descricao]);
      }
      for (const r of defaultPapeis) {
        await poolConn.query('INSERT IGNORE INTO papeis (id, nome, descricao) VALUES (?, ?, ?)', [r.id, r.nome, r.descricao]);
      }
      for (const pp of defaultPapelPermissao) {
        await poolConn.query('INSERT IGNORE INTO papel_permissao (papel_id, permissao_id) VALUES (?, ?)', [pp.papel_id, pp.permissao_id]);
      }
      for (const u of defaultUsuarios) {
        await poolConn.query('INSERT IGNORE INTO usuarios (id, nome, email, senha, ativo) VALUES (?, ?, ?, ?, ?)', [
          u.id,
          u.nome,
          u.email,
          u.senha,
          u.ativo,
        ]);
      }
      for (const up of defaultUsuarioPapel) {
        await poolConn.query('INSERT IGNORE INTO usuario_papel (usuario_id, papel_id) VALUES (?, ?)', [up.usuario_id, up.papel_id]);
      }
    }
    poolConn.release();

    isMysqlConnected = true;
    lastConnectionError = null;
    console.log(`✅ Conectado com sucesso ao MySQL (${config.host}:${config.port}/${config.database})`);
    return true;
  } catch (err: any) {
    isMysqlConnected = false;
    lastConnectionError = err?.message || String(err);
    console.log(`ℹ️ MySQL não configurado ou indisponível (${lastConnectionError}). Operando em modo de simulação em memória com schema idêntico.`);
    return false;
  }
}

export async function testConnection(customConfig?: Partial<DbConfig>) {
  const config = { ...getDbConfig(), ...customConfig };
  try {
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: 3000,
    });
    await conn.ping();
    await conn.end();
    return { success: true, message: `Conexão ao MySQL (${config.host}:${config.port}/${config.database}) realizada com sucesso!` };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Falha ao conectar ao servidor MySQL' };
  }
}

// Database Service Functions
export async function getDbStatus() {
  const config = getDbConfig();
  if (isMysqlConnected && pool) {
    try {
      const [uRows]: [any[], any] = await pool.query('SELECT COUNT(*) as c FROM usuarios');
      const [pRows]: [any[], any] = await pool.query('SELECT COUNT(*) as c FROM papeis');
      const [permRows]: [any[], any] = await pool.query('SELECT COUNT(*) as c FROM permissoes');
      const [upRows]: [any[], any] = await pool.query('SELECT COUNT(*) as c FROM usuario_papel');
      const [ppRows]: [any[], any] = await pool.query('SELECT COUNT(*) as c FROM papel_permissao');

      return {
        connected: true,
        engine: 'mysql' as const,
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
        message: 'Conectado ao servidor MySQL nativo com tabelas sincronizadas',
        error: null,
        counts: {
          usuarios: uRows[0]?.c || 0,
          papeis: pRows[0]?.c || 0,
          permissoes: permRows[0]?.c || 0,
          usuario_papel: upRows[0]?.c || 0,
          papel_permissao: ppRows[0]?.c || 0,
        },
      };
    } catch (err: any) {
      isMysqlConnected = false;
      lastConnectionError = err.message;
    }
  }

  return {
    connected: false,
    engine: 'in_memory' as const,
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    message: 'Modo Local / Simulador RBAC Ativo (Pronto para conexão MySQL via variáveis .env)',
    error: lastConnectionError,
    counts: {
      usuarios: memoryStore.usuarios.length,
      papeis: memoryStore.papeis.length,
      permissoes: memoryStore.permissoes.length,
      usuario_papel: memoryStore.usuario_papel.length,
      papel_permissao: memoryStore.papel_permissao.length,
    },
  };
}

// ==========================================
// USUARIOS CRUD & RESOLUTION
// ==========================================
export async function getUsuarios(search?: string) {
  if (isMysqlConnected && pool) {
    try {
      let query = 'SELECT id, nome, email, ativo, data_criacao, data_atualizacao FROM usuarios';
      const params: any[] = [];
      if (search) {
        query += ' WHERE nome LIKE ? OR email LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
      }
      query += ' ORDER BY id ASC';
      const [rows]: [any[], any] = await pool.query(query, params);

      // Attach roles for each user
      for (const u of rows) {
        const [papeis]: [any[], any] = await pool.query(
          `SELECT p.id, p.nome, p.descricao, p.data_criacao, p.data_atualizacao
           FROM papeis p
           INNER JOIN usuario_papel up ON up.papel_id = p.id
           WHERE up.usuario_id = ?`,
          [u.id]
        );
        u.papeis = papeis;
      }
      return rows;
    } catch {
      // Fallback
    }
  }

  return memoryStore.usuarios
    .filter(u => {
      if (!search) return true;
      const s = search.toLowerCase();
      return u.nome.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    })
    .map(u => {
      const userPapeisIds = memoryStore.usuario_papel.filter(up => up.usuario_id === u.id).map(up => up.papel_id);
      const papeis = memoryStore.papeis.filter(p => userPapeisIds.includes(p.id));
      const { senha, ...rest } = u;
      return { ...rest, papeis };
    });
}

export async function getUsuarioById(id: number) {
  if (isMysqlConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query('SELECT id, nome, email, ativo, data_criacao, data_atualizacao FROM usuarios WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      const user = rows[0];

      const [papeis]: [any[], any] = await pool.query(
        `SELECT p.id, p.nome, p.descricao, p.data_criacao, p.data_atualizacao
         FROM papeis p
         INNER JOIN usuario_papel up ON up.papel_id = p.id
         WHERE up.usuario_id = ?`,
        [id]
      );
      user.papeis = papeis;

      // Effective permissions
      const [permissoes]: [any[], any] = await pool.query(
        `SELECT DISTINCT perm.id, perm.nome, perm.descricao, perm.data_criacao, perm.data_atualizacao
         FROM permissoes perm
         INNER JOIN papel_permissao pp ON pp.permissao_id = perm.id
         INNER JOIN usuario_papel up ON up.papel_id = pp.papel_id
         WHERE up.usuario_id = ?`,
        [id]
      );
      user.permissoes_efetivas = permissoes;
      return user;
    } catch {
      // Fallback
    }
  }

  const u = memoryStore.usuarios.find(user => user.id === id);
  if (!u) return null;

  const userPapeisIds = memoryStore.usuario_papel.filter(up => up.usuario_id === id).map(up => up.papel_id);
  const papeis = memoryStore.papeis.filter(p => userPapeisIds.includes(p.id));

  const permIds = memoryStore.papel_permissao.filter(pp => userPapeisIds.includes(pp.papel_id)).map(pp => pp.permissao_id);
  const uniquePermIds = Array.from(new Set(permIds));
  const permissoes_efetivas = memoryStore.permissoes.filter(p => uniquePermIds.includes(p.id));

  const { senha, ...rest } = u;
  return { ...rest, papeis, permissoes_efetivas };
}

export async function createUsuario(data: { nome: string; email: string; senha?: string; ativo?: boolean; papel_ids?: number[] }) {
  const hash = bcrypt.hashSync(data.senha || 'Recife@2026', 10);
  const ativo = data.ativo !== undefined ? data.ativo : true;
  const now = new Date().toISOString();

  if (isMysqlConnected && pool) {
    try {
      const [result]: [any, any] = await pool.query(
        'INSERT INTO usuarios (nome, email, senha, ativo) VALUES (?, ?, ?, ?)',
        [data.nome, data.email, hash, ativo]
      );
      const newId = result.insertId;

      if (data.papel_ids && data.papel_ids.length > 0) {
        for (const pid of data.papel_ids) {
          await pool.query('INSERT IGNORE INTO usuario_papel (usuario_id, papel_id) VALUES (?, ?)', [newId, pid]);
        }
      }
      return getUsuarioById(newId);
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  // Check email collision
  if (memoryStore.usuarios.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error(`O e-mail '${data.email}' já está em uso.`);
  }

  const newId = (memoryStore.usuarios.length > 0 ? Math.max(...memoryStore.usuarios.map(u => u.id)) : 0) + 1;
  const novoUsuario = {
    id: newId,
    nome: data.nome,
    email: data.email,
    senha: hash,
    ativo,
    data_criacao: now,
    data_atualizacao: now,
  };
  memoryStore.usuarios.push(novoUsuario);

  if (data.papel_ids && data.papel_ids.length > 0) {
    for (const pid of data.papel_ids) {
      memoryStore.usuario_papel.push({ usuario_id: newId, papel_id: pid });
    }
  }

  return getUsuarioById(newId);
}

export async function updateUsuario(id: number, data: { nome?: string; email?: string; senha?: string; ativo?: boolean; papel_ids?: number[] }) {
  const now = new Date().toISOString();

  if (isMysqlConnected && pool) {
    try {
      const fields: string[] = [];
      const params: any[] = [];

      if (data.nome !== undefined) {
        fields.push('nome = ?');
        params.push(data.nome);
      }
      if (data.email !== undefined) {
        fields.push('email = ?');
        params.push(data.email);
      }
      if (data.senha) {
        fields.push('senha = ?');
        params.push(bcrypt.hashSync(data.senha, 10));
      }
      if (data.ativo !== undefined) {
        fields.push('ativo = ?');
        params.push(data.ativo);
      }

      if (fields.length > 0) {
        params.push(id);
        await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, params);
      }

      if (data.papel_ids !== undefined) {
        await pool.query('DELETE FROM usuario_papel WHERE usuario_id = ?', [id]);
        for (const pid of data.papel_ids) {
          await pool.query('INSERT IGNORE INTO usuario_papel (usuario_id, papel_id) VALUES (?, ?)', [id, pid]);
        }
      }

      return getUsuarioById(id);
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  const u = memoryStore.usuarios.find(user => user.id === id);
  if (!u) throw new Error('Usuário não encontrado');

  if (data.email && data.email !== u.email) {
    if (memoryStore.usuarios.some(other => other.id !== id && other.email.toLowerCase() === data.email!.toLowerCase())) {
      throw new Error(`O e-mail '${data.email}' já está cadastrado para outro usuário.`);
    }
    u.email = data.email;
  }

  if (data.nome !== undefined) u.nome = data.nome;
  if (data.senha) u.senha = bcrypt.hashSync(data.senha, 10);
  if (data.ativo !== undefined) u.ativo = data.ativo;
  u.data_atualizacao = now;

  if (data.papel_ids !== undefined) {
    memoryStore.usuario_papel = memoryStore.usuario_papel.filter(up => up.usuario_id !== id);
    for (const pid of data.papel_ids) {
      memoryStore.usuario_papel.push({ usuario_id: id, papel_id: pid });
    }
  }

  return getUsuarioById(id);
}

export async function deleteUsuario(id: number) {
  if (isMysqlConnected && pool) {
    try {
      await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
      return { success: true };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  const idx = memoryStore.usuarios.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Usuário não encontrado');
  memoryStore.usuarios.splice(idx, 1);
  memoryStore.usuario_papel = memoryStore.usuario_papel.filter(up => up.usuario_id !== id);
  return { success: true };
}

// ==========================================
// PAPEIS CRUD & RESOLUTION
// ==========================================
export async function getPapeis() {
  if (isMysqlConnected && pool) {
    try {
      const [papeis]: [any[], any] = await pool.query('SELECT * FROM papeis ORDER BY id ASC');
      for (const p of papeis) {
        const [permissoes]: [any[], any] = await pool.query(
          `SELECT perm.id, perm.nome, perm.descricao, perm.data_criacao, perm.data_atualizacao
           FROM permissoes perm
           INNER JOIN papel_permissao pp ON pp.permissao_id = perm.id
           WHERE pp.papel_id = ?`,
          [p.id]
        );
        p.permissoes = permissoes;

        const [usersCount]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM usuario_papel WHERE papel_id = ?', [p.id]);
        p.total_usuarios = usersCount[0]?.count || 0;
      }
      return papeis;
    } catch {
      // Fallback
    }
  }

  return memoryStore.papeis.map(p => {
    const permIds = memoryStore.papel_permissao.filter(pp => pp.papel_id === p.id).map(pp => pp.permissao_id);
    const permissoes = memoryStore.permissoes.filter(perm => permIds.includes(perm.id));
    const total_usuarios = memoryStore.usuario_papel.filter(up => up.papel_id === p.id).length;
    return { ...p, permissoes, total_usuarios };
  });
}

export async function createPapel(data: { nome: string; descricao?: string; permissao_ids?: number[] }) {
  const now = new Date().toISOString();
  if (isMysqlConnected && pool) {
    try {
      const [res]: [any, any] = await pool.query('INSERT INTO papeis (nome, descricao) VALUES (?, ?)', [data.nome, data.descricao || '']);
      const newId = res.insertId;

      if (data.permissao_ids && data.permissao_ids.length > 0) {
        for (const pid of data.permissao_ids) {
          await pool.query('INSERT IGNORE INTO papel_permissao (papel_id, permissao_id) VALUES (?, ?)', [newId, pid]);
        }
      }
      return (await getPapeis()).find((p: any) => p.id === newId);
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  if (memoryStore.papeis.some(p => p.nome.toUpperCase() === data.nome.trim().toUpperCase())) {
    throw new Error(`O papel '${data.nome}' já existe.`);
  }

  const newId = (memoryStore.papeis.length > 0 ? Math.max(...memoryStore.papeis.map(p => p.id)) : 0) + 1;
  const novoPapel = {
    id: newId,
    nome: data.nome.trim().toUpperCase().replace(/\s+/g, '_'),
    descricao: data.descricao || '',
    data_criacao: now,
    data_atualizacao: now,
  };
  memoryStore.papeis.push(novoPapel);

  if (data.permissao_ids && data.permissao_ids.length > 0) {
    for (const pid of data.permissao_ids) {
      memoryStore.papel_permissao.push({ papel_id: newId, permissao_id: pid });
    }
  }

  return (await getPapeis()).find(p => p.id === newId);
}

export async function updatePapel(id: number, data: { nome?: string; descricao?: string; permissao_ids?: number[] }) {
  const now = new Date().toISOString();
  if (isMysqlConnected && pool) {
    try {
      if (data.nome !== undefined || data.descricao !== undefined) {
        await pool.query('UPDATE papeis SET nome = COALESCE(?, nome), descricao = COALESCE(?, descricao) WHERE id = ?', [
          data.nome || null,
          data.descricao !== undefined ? data.descricao : null,
          id,
        ]);
      }
      if (data.permissao_ids !== undefined) {
        await pool.query('DELETE FROM papel_permissao WHERE papel_id = ?', [id]);
        for (const pid of data.permissao_ids) {
          await pool.query('INSERT IGNORE INTO papel_permissao (papel_id, permissao_id) VALUES (?, ?)', [id, pid]);
        }
      }
      return (await getPapeis()).find((p: any) => p.id === id);
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  const p = memoryStore.papeis.find(papel => papel.id === id);
  if (!p) throw new Error('Papel não encontrado');

  if (data.nome) p.nome = data.nome.trim().toUpperCase().replace(/\s+/g, '_');
  if (data.descricao !== undefined) p.descricao = data.descricao;
  p.data_atualizacao = now;

  if (data.permissao_ids !== undefined) {
    memoryStore.papel_permissao = memoryStore.papel_permissao.filter(pp => pp.papel_id !== id);
    for (const pid of data.permissao_ids) {
      memoryStore.papel_permissao.push({ papel_id: id, permissao_id: pid });
    }
  }

  return (await getPapeis()).find(papel => papel.id === id);
}

export async function deletePapel(id: number) {
  if (isMysqlConnected && pool) {
    try {
      await pool.query('DELETE FROM papeis WHERE id = ?', [id]);
      return { success: true };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  const idx = memoryStore.papeis.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Papel não encontrado');
  memoryStore.papeis.splice(idx, 1);
  memoryStore.usuario_papel = memoryStore.usuario_papel.filter(up => up.papel_id !== id);
  memoryStore.papel_permissao = memoryStore.papel_permissao.filter(pp => pp.papel_id !== id);
  return { success: true };
}

// ==========================================
// PERMISSOES CRUD
// ==========================================
export async function getPermissoes() {
  if (isMysqlConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query('SELECT * FROM permissoes ORDER BY id ASC');
      for (const p of rows) {
        const [counts]: [any[], any] = await pool.query('SELECT COUNT(*) as count FROM papel_permissao WHERE permissao_id = ?', [p.id]);
        p.total_papeis = counts[0]?.count || 0;
      }
      return rows;
    } catch {
      // Fallback
    }
  }

  return memoryStore.permissoes.map(p => {
    const total_papeis = memoryStore.papel_permissao.filter(pp => pp.permissao_id === p.id).length;
    return { ...p, total_papeis };
  });
}

export async function createPermissao(data: { nome: string; descricao?: string }) {
  const now = new Date().toISOString();
  if (isMysqlConnected && pool) {
    try {
      const [res]: [any, any] = await pool.query('INSERT INTO permissoes (nome, descricao) VALUES (?, ?)', [data.nome, data.descricao || '']);
      const [rows]: [any[], any] = await pool.query('SELECT * FROM permissoes WHERE id = ?', [res.insertId]);
      return rows[0];
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  if (memoryStore.permissoes.some(p => p.nome.toLowerCase() === data.nome.trim().toLowerCase())) {
    throw new Error(`A permissão '${data.nome}' já existe.`);
  }

  const newId = (memoryStore.permissoes.length > 0 ? Math.max(...memoryStore.permissoes.map(p => p.id)) : 0) + 1;
  const novaPerm = {
    id: newId,
    nome: data.nome.trim().toLowerCase().replace(/\s+/g, ':'),
    descricao: data.descricao || '',
    data_criacao: now,
    data_atualizacao: now,
  };
  memoryStore.permissoes.push(novaPerm);
  return { ...novaPerm, total_papeis: 0 };
}

export async function updatePermissao(id: number, data: { nome?: string; descricao?: string }) {
  const now = new Date().toISOString();
  if (isMysqlConnected && pool) {
    try {
      await pool.query('UPDATE permissoes SET nome = COALESCE(?, nome), descricao = COALESCE(?, descricao) WHERE id = ?', [
        data.nome || null,
        data.descricao !== undefined ? data.descricao : null,
        id,
      ]);
      const [rows]: [any[], any] = await pool.query('SELECT * FROM permissoes WHERE id = ?', [id]);
      return rows[0];
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  const p = memoryStore.permissoes.find(perm => perm.id === id);
  if (!p) throw new Error('Permissão não encontrada');
  if (data.nome) p.nome = data.nome.trim().toLowerCase().replace(/\s+/g, ':');
  if (data.descricao !== undefined) p.descricao = data.descricao;
  p.data_atualizacao = now;
  return p;
}

export async function deletePermissao(id: number) {
  if (isMysqlConnected && pool) {
    try {
      await pool.query('DELETE FROM permissoes WHERE id = ?', [id]);
      return { success: true };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  const idx = memoryStore.permissoes.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Permissão não encontrada');
  memoryStore.permissoes.splice(idx, 1);
  memoryStore.papel_permissao = memoryStore.papel_permissao.filter(pp => pp.permissao_id !== id);
  return { success: true };
}

// ==========================================
// RELATIONSHIPS: USUARIO_PAPEL & PAPEL_PERMISSAO
// ==========================================
export async function getUsuarioPapelList() {
  if (isMysqlConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query(
        `SELECT up.usuario_id, up.papel_id, u.nome as usuario_nome, p.nome as papel_nome
         FROM usuario_papel up
         JOIN usuarios u ON u.id = up.usuario_id
         JOIN papeis p ON p.id = up.papel_id
         ORDER BY u.nome ASC`
      );
      return rows;
    } catch {
      // Fallback
    }
  }

  return memoryStore.usuario_papel.map(up => {
    const user = memoryStore.usuarios.find(u => u.id === up.usuario_id);
    const papel = memoryStore.papeis.find(p => p.id === up.papel_id);
    return {
      usuario_id: up.usuario_id,
      papel_id: up.papel_id,
      usuario_nome: user?.nome || `Usuário #${up.usuario_id}`,
      papel_nome: papel?.nome || `Papel #${up.papel_id}`,
    };
  });
}

export async function getPapelPermissaoList() {
  if (isMysqlConnected && pool) {
    try {
      const [rows]: [any[], any] = await pool.query(
        `SELECT pp.papel_id, pp.permissao_id, p.nome as papel_nome, perm.nome as permissao_nome
         FROM papel_permissao pp
         JOIN papeis p ON p.id = pp.papel_id
         JOIN permissoes perm ON perm.id = pp.permissao_id
         ORDER BY p.nome ASC`
      );
      return rows;
    } catch {
      // Fallback
    }
  }

  return memoryStore.papel_permissao.map(pp => {
    const papel = memoryStore.papeis.find(p => p.id === pp.papel_id);
    const perm = memoryStore.permissoes.find(p => p.id === pp.permissao_id);
    return {
      papel_id: pp.papel_id,
      permissao_id: pp.permissao_id,
      papel_nome: papel?.nome || `Papel #${pp.papel_id}`,
      permissao_nome: perm?.nome || `Permissão #${pp.permissao_id}`,
    };
  });
}

export async function assignUsuarioPapel(usuario_id: number, papel_id: number) {
  if (isMysqlConnected && pool) {
    try {
      await pool.query('INSERT IGNORE INTO usuario_papel (usuario_id, papel_id) VALUES (?, ?)', [usuario_id, papel_id]);
      return { success: true };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  const exists = memoryStore.usuario_papel.some(up => up.usuario_id === usuario_id && up.papel_id === papel_id);
  if (!exists) {
    memoryStore.usuario_papel.push({ usuario_id, papel_id });
  }
  return { success: true };
}

export async function removeUsuarioPapel(usuario_id: number, papel_id: number) {
  if (isMysqlConnected && pool) {
    try {
      await pool.query('DELETE FROM usuario_papel WHERE usuario_id = ? AND papel_id = ?', [usuario_id, papel_id]);
      return { success: true };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  memoryStore.usuario_papel = memoryStore.usuario_papel.filter(up => !(up.usuario_id === usuario_id && up.papel_id === papel_id));
  return { success: true };
}

export async function assignPapelPermissao(papel_id: number, permissao_id: number) {
  if (isMysqlConnected && pool) {
    try {
      await pool.query('INSERT IGNORE INTO papel_permissao (papel_id, permissao_id) VALUES (?, ?)', [papel_id, permissao_id]);
      return { success: true };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  const exists = memoryStore.papel_permissao.some(pp => pp.papel_id === papel_id && pp.permissao_id === permissao_id);
  if (!exists) {
    memoryStore.papel_permissao.push({ papel_id, permissao_id });
  }
  return { success: true };
}

export async function removePapelPermissao(papel_id: number, permissao_id: number) {
  if (isMysqlConnected && pool) {
    try {
      await pool.query('DELETE FROM papel_permissao WHERE papel_id = ? AND permissao_id = ?', [papel_id, permissao_id]);
      return { success: true };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  memoryStore.papel_permissao = memoryStore.papel_permissao.filter(pp => !(pp.papel_id === papel_id && pp.permissao_id === permissao_id));
  return { success: true };
}

export async function getBeneficiarios() {
  return memoryStore.beneficiarios;
}

export async function resetDatabaseSeeds() {
  memoryStore.usuarios = JSON.parse(JSON.stringify(defaultUsuarios));
  memoryStore.papeis = JSON.parse(JSON.stringify(defaultPapeis));
  memoryStore.permissoes = JSON.parse(JSON.stringify(defaultPermissoes));
  memoryStore.usuario_papel = JSON.parse(JSON.stringify(defaultUsuarioPapel));
  memoryStore.papel_permissao = JSON.parse(JSON.stringify(defaultPapelPermissao));
  memoryStore.beneficiarios = JSON.parse(JSON.stringify(defaultBeneficiarios));

  if (isMysqlConnected && pool) {
    const conn = await pool.getConnection();
    await conn.query('DELETE FROM papel_permissao');
    await conn.query('DELETE FROM usuario_papel');
    await conn.query('DELETE FROM usuarios');
    await conn.query('DELETE FROM papeis');
    await conn.query('DELETE FROM permissoes');

    for (const p of defaultPermissoes) {
      await conn.query('INSERT INTO permissoes (id, nome, descricao) VALUES (?, ?, ?)', [p.id, p.nome, p.descricao]);
    }
    for (const r of defaultPapeis) {
      await conn.query('INSERT INTO papeis (id, nome, descricao) VALUES (?, ?, ?)', [r.id, r.nome, r.descricao]);
    }
    for (const pp of defaultPapelPermissao) {
      await conn.query('INSERT INTO papel_permissao (papel_id, permissao_id) VALUES (?, ?)', [pp.papel_id, pp.permissao_id]);
    }
    for (const u of defaultUsuarios) {
      await conn.query('INSERT INTO usuarios (id, nome, email, senha, ativo) VALUES (?, ?, ?, ?, ?)', [
        u.id,
        u.nome,
        u.email,
        u.senha,
        u.ativo,
      ]);
    }
    for (const up of defaultUsuarioPapel) {
      await conn.query('INSERT INTO usuario_papel (usuario_id, papel_id) VALUES (?, ?)', [up.usuario_id, up.papel_id]);
    }
    conn.release();
  }

  return { success: true, message: 'Base de dados de segurança e RBAC do BPC Recife restaurada para o padrão inicial!' };
}

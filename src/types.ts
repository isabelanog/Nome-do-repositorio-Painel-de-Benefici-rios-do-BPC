export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  papeis?: Papel[];
  permissoes_efetivas?: Permissao[];
}

export interface Papel {
  id: number;
  nome: string;
  descricao: string;
  data_criacao: string;
  data_atualizacao: string;
  permissoes?: Permissao[];
  total_usuarios?: number;
}

export interface Permissao {
  id: number;
  nome: string;
  descricao: string;
  data_criacao: string;
  data_atualizacao: string;
  total_papeis?: number;
}

export interface UsuarioPapel {
  usuario_id: number;
  papel_id: number;
  usuario_nome?: string;
  papel_nome?: string;
}

export interface PapelPermissao {
  papel_id: number;
  permissao_id: number;
  papel_nome?: string;
  permissao_nome?: string;
}

export interface DatabaseStatus {
  connected: boolean;
  engine: 'mysql' | 'in_memory';
  host?: string;
  database?: string;
  user?: string;
  port?: number;
  message?: string;
  error?: string | null;
  counts: {
    usuarios: number;
    papeis: number;
    permissoes: number;
    usuario_papel: number;
    papel_permissao: number;
  };
}

export interface BeneficiarioBPC {
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
}

import { Usuario, Papel, Permissao, UsuarioPapel, PapelPermissao, DatabaseStatus, BeneficiarioBPC } from '../types';

export const api = {
  // Status & DB
  async getStatus(): Promise<DatabaseStatus> {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Falha ao obter status do servidor');
    return res.json();
  },

  async testConnection(config?: { host?: string; port?: number; user?: string; password?: string; database?: string }) {
    const res = await fetch('/api/db/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || {}),
    });
    return res.json();
  },

  async getSchema() {
    const res = await fetch('/api/db/schema');
    if (!res.ok) throw new Error('Falha ao carregar schema do banco');
    return res.json();
  },

  async resetSeeds() {
    const res = await fetch('/api/db/reset-seed', { method: 'POST' });
    if (!res.ok) throw new Error('Falha ao restaurar dados iniciais');
    return res.json();
  },

  // Usuarios
  async getUsuarios(search?: string): Promise<Usuario[]> {
    const url = search ? `/api/usuarios?search=${encodeURIComponent(search)}` : '/api/usuarios';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao carregar usuários');
    return res.json();
  },

  async getUsuarioById(id: number): Promise<Usuario> {
    const res = await fetch(`/api/usuarios/${id}`);
    if (!res.ok) throw new Error('Usuário não encontrado');
    return res.json();
  },

  async createUsuario(data: { nome: string; email: string; senha?: string; ativo?: boolean; papel_ids?: number[] }): Promise<Usuario> {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao criar usuário');
    }
    return res.json();
  },

  async updateUsuario(id: number, data: { nome?: string; email?: string; senha?: string; ativo?: boolean; papel_ids?: number[] }): Promise<Usuario> {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao atualizar usuário');
    }
    return res.json();
  },

  async deleteUsuario(id: number): Promise<void> {
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao excluir usuário');
    }
  },

  // Papeis
  async getPapeis(): Promise<Papel[]> {
    const res = await fetch('/api/papeis');
    if (!res.ok) throw new Error('Falha ao carregar papéis');
    return res.json();
  },

  async createPapel(data: { nome: string; descricao?: string; permissao_ids?: number[] }): Promise<Papel> {
    const res = await fetch('/api/papeis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao criar papel');
    }
    return res.json();
  },

  async updatePapel(id: number, data: { nome?: string; descricao?: string; permissao_ids?: number[] }): Promise<Papel> {
    const res = await fetch(`/api/papeis/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao atualizar papel');
    }
    return res.json();
  },

  async deletePapel(id: number): Promise<void> {
    const res = await fetch(`/api/papeis/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao excluir papel');
    }
  },

  // Permissoes
  async getPermissoes(): Promise<Permissao[]> {
    const res = await fetch('/api/permissoes');
    if (!res.ok) throw new Error('Falha ao carregar permissões');
    return res.json();
  },

  async createPermissao(data: { nome: string; descricao?: string }): Promise<Permissao> {
    const res = await fetch('/api/permissoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao criar permissão');
    }
    return res.json();
  },

  async updatePermissao(id: number, data: { nome?: string; descricao?: string }): Promise<Permissao> {
    const res = await fetch(`/api/permissoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao atualizar permissão');
    }
    return res.json();
  },

  async deletePermissao(id: number): Promise<void> {
    const res = await fetch(`/api/permissoes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao excluir permissão');
    }
  },

  // Associations
  async getUsuarioPapelList(): Promise<UsuarioPapel[]> {
    const res = await fetch('/api/usuario-papel');
    if (!res.ok) throw new Error('Falha ao carregar vínculos usuário-papel');
    return res.json();
  },

  async assignUsuarioPapel(usuario_id: number, papel_id: number): Promise<void> {
    const res = await fetch('/api/usuario-papel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id, papel_id }),
    });
    if (!res.ok) throw new Error('Falha ao vincular usuário ao papel');
  },

  async removeUsuarioPapel(usuario_id: number, papel_id: number): Promise<void> {
    const res = await fetch('/api/usuario-papel', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id, papel_id }),
    });
    if (!res.ok) throw new Error('Falha ao desvincular usuário do papel');
  },

  async getPapelPermissaoList(): Promise<PapelPermissao[]> {
    const res = await fetch('/api/papel-permissao');
    if (!res.ok) throw new Error('Falha ao carregar vínculos papel-permissão');
    return res.json();
  },

  async assignPapelPermissao(papel_id: number, permissao_id: number): Promise<void> {
    const res = await fetch('/api/papel-permissao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ papel_id, permissao_id }),
    });
    if (!res.ok) throw new Error('Falha ao vincular papel à permissão');
  },

  async removePapelPermissao(papel_id: number, permissao_id: number): Promise<void> {
    const res = await fetch('/api/papel-permissao', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ papel_id, permissao_id }),
    });
    if (!res.ok) throw new Error('Falha ao desvincular papel da permissão');
  },

  // Beneficiarios
  async getBeneficiarios(): Promise<BeneficiarioBPC[]> {
    const res = await fetch('/api/beneficiarios');
    if (!res.ok) throw new Error('Falha ao carregar beneficiários');
    return res.json();
  },
};

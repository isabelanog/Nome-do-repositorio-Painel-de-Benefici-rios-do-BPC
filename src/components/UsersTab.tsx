import React, { useState } from 'react';
import { Usuario, Papel } from '../types';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Mail,
  UserCheck,
  UserX,
} from 'lucide-react';

interface UsersTabProps {
  usuarios: Usuario[];
  papeis: Papel[];
  onAddUser: () => void;
  onEditUser: (user: Usuario) => void;
  onViewUserDetails: (user: Usuario) => void;
  onDeleteUser: (id: number) => void;
  onToggleStatus: (user: Usuario) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  usuarios,
  papeis,
  onAddUser,
  onEditUser,
  onViewUserDetails,
  onDeleteUser,
  onToggleStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      filterRole === 'all' ||
      u.papeis?.some(p => p.id.toString() === filterRole);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && u.ativo) ||
      (filterStatus === 'inactive' && !u.ativo);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top action & filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou e-mail institucional..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filters and CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Todos os Papéis</option>
            {papeis.map(p => (
              <option key={p.id} value={p.id.toString()}>
                {p.nome}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </select>

          {/* Create User Button */}
          <button
            onClick={onAddUser}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Papéis Vinculados (usuario_papel)</th>
                <th className="py-3 px-4">Data Criação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsuarios.length > 0 ? (
                filteredUsuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-500">
                      #{u.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.nome}</div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.ativo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 mr-1 text-rose-500" /> Inativo
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.papeis && u.papeis.length > 0 ? (
                          u.papeis.map(p => (
                            <span
                              key={p.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono bg-purple-50 text-purple-700 border border-purple-200"
                            >
                              <Shield className="w-2.5 h-2.5 mr-1 text-purple-500" />
                              {p.nome}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Nenhum papel atribuído
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(u.data_criacao).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onViewUserDetails(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Ver detalhes e permissões efetivas"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.ativo
                              ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={u.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                        >
                          {u.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => onEditUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Editar dados e papéis"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex justify-between items-center">
          <span>
            Exibindo <strong>{filteredUsuarios.length}</strong> de <strong>{usuarios.length}</strong> usuários cadastrados
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            Tabela MySQL: `usuarios` + `usuario_papel`
          </span>
        </div>
      </div>
    </div>
  );
};

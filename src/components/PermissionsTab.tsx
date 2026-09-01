import React, { useState } from 'react';
import { Permissao } from '../types';
import { KeyRound, Plus, Edit2, Trash2, Shield, Search } from 'lucide-react';

interface PermissionsTabProps {
  permissoes: Permissao[];
  onAddPermission: () => void;
  onEditPermission: (permission: Permissao) => void;
  onDeletePermission: (id: number) => void;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  permissoes,
  onAddPermission,
  onEditPermission,
  onDeletePermission,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');

  // Extract unique modules (e.g. 'beneficiarios', 'laudos', 'visitas', 'relatorios', 'seguranca')
  const modules: string[] = Array.from(new Set<string>(permissoes.map(p => p.nome.split(':')[0]))).sort();

  const filteredPermissoes = permissoes.filter(p => {
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesModule =
      filterModule === 'all' || p.nome.startsWith(`${filterModule}:`);

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por identificador ou descrição..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={filterModule}
            onChange={e => setFilterModule(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">Todos os Módulos</option>
            {modules.map(mod => (
              <option key={mod} value={mod}>
                Módulo {mod.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onAddPermission}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Permissão</span>
        </button>
      </div>

      {/* Permissions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Identificador da Permissão</th>
              <th className="py-3 px-4">Descrição da Atribuição</th>
              <th className="py-3 px-4">Papéis Vinculados</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredPermissoes.length > 0 ? (
              filteredPermissoes.map(perm => {
                const [mod, action] = perm.nome.split(':');
                return (
                  <tr key={perm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">
                      #{perm.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <KeyRound className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-mono font-semibold text-slate-900">
                            <span className="text-amber-800 font-bold">{mod}</span>
                            {action && <span className="text-slate-500">:{action}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-md">
                      {perm.descricao || 'Sem descrição cadastrada'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <Shield className="w-3 h-3 mr-1 text-purple-500" />
                        {perm.total_papeis || 0} papel(is)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onEditPermission(perm)}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar permissão"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePermission(perm.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir permissão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  Nenhuma permissão encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex justify-between items-center">
          <span>
            Total de <strong>{filteredPermissoes.length}</strong> permissões cadastradas no BPC Recife
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            Tabela MySQL: `permissoes`
          </span>
        </div>
      </div>
    </div>
  );
};

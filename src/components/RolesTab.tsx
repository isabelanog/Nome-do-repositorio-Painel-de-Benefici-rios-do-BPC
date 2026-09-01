import React, { useState } from 'react';
import { Papel, Permissao } from '../types';
import { ShieldPlus, Edit2, Trash2, Key, Users, Search } from 'lucide-react';

interface RolesTabProps {
  papeis: Papel[];
  allPermissoes: Permissao[];
  onAddRole: () => void;
  onEditRole: (role: Papel) => void;
  onDeleteRole: (id: number) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({
  papeis,
  onAddRole,
  onEditRole,
  onDeleteRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPapeis = papeis.filter(
    p =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar papel ou função..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50/50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <button
          onClick={onAddRole}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <ShieldPlus className="w-3.5 h-3.5" />
          <span>Novo Papel (Role)</span>
        </button>
      </div>

      {/* Roles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPapeis.map(papel => (
          <div
            key={papel.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100/90 border border-purple-200 px-2.5 py-1 rounded-lg">
                  {papel.nome}
                </span>
                <span className="text-[11px] font-mono text-slate-400">ID #{papel.id}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed mb-4 min-h-[36px]">
                {papel.descricao || 'Sem descrição definida'}
              </p>

              {/* Meta stats */}
              <div className="flex items-center space-x-4 mb-4 text-[11px] text-slate-500 border-y border-slate-100 py-2">
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    <strong>{papel.total_usuarios || 0}</strong> usuário(s)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    <strong>{papel.permissoes?.length || 0}</strong> permissão(ões)
                  </span>
                </div>
              </div>

              {/* Associated Permissions preview */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Permissões Concedidas (<code>papel_permissao</code>):
                </div>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                  {papel.permissoes && papel.permissoes.length > 0 ? (
                    papel.permissoes.map(p => (
                      <span
                        key={p.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                        title={p.descricao}
                      >
                        {p.nome}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Nenhuma permissão vinculada
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Criado em: {new Date(papel.data_criacao).toLocaleDateString('pt-BR')}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onEditRole(papel)}
                  className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                  title="Editar papel e permissões"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteRole(papel.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Excluir papel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

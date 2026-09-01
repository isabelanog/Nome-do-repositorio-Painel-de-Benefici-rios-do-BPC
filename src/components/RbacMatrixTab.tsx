import React, { useState } from 'react';
import { Usuario, Papel, Permissao } from '../types';
import { Shield, Key, Users, Check, Lock, RefreshCw } from 'lucide-react';

interface RbacMatrixTabProps {
  usuarios: Usuario[];
  papeis: Papel[];
  permissoes: Permissao[];
  onTogglePapelPermissao: (papelId: number, permId: number, currentlyHas: boolean) => Promise<void>;
  onToggleUsuarioPapel: (usuarioId: number, papelId: number, currentlyHas: boolean) => Promise<void>;
}

export const RbacMatrixTab: React.FC<RbacMatrixTabProps> = ({
  usuarios,
  papeis,
  permissoes,
  onTogglePapelPermissao,
  onToggleUsuarioPapel,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'papel_permissao' | 'usuario_papel'>('papel_permissao');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const handlePapelPermissaoToggle = async (papelId: number, permId: number, has: boolean) => {
    const key = `pp-${papelId}-${permId}`;
    try {
      setTogglingKey(key);
      await onTogglePapelPermissao(papelId, permId, has);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleUsuarioPapelToggle = async (usuarioId: number, papelId: number, has: boolean) => {
    const key = `up-${usuarioId}-${papelId}`;
    try {
      setTogglingKey(key);
      await onToggleUsuarioPapel(usuarioId, papelId, has);
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('papel_permissao')}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'papel_permissao'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Matriz: Papéis × Permissões (papel_permissao)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('usuario_papel')}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'usuario_papel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Matriz: Usuários × Papéis (usuario_papel)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          💡 Clique em qualquer célula para conceder ou revogar o acesso no banco MySQL em tempo real.
        </div>
      </div>

      {/* MATRIX 1: Papéis x Permissões */}
      {activeSubTab === 'papel_permissao' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-purple-50/50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs font-bold text-slate-900">
                Mapeamento de Permissões por Papel (Tabela Pivô MySQL <code>papel_permissao</code>)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
              {papeis.length} Papéis × {permissoes.length} Permissões
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                  <th className="py-3 px-4 min-w-[240px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Permissão do Sistema (permissoes)
                  </th>
                  {papeis.map(papel => (
                    <th key={papel.id} className="py-3 px-3 text-center min-w-[130px]">
                      <div className="font-mono text-[10px] font-bold text-purple-900 bg-purple-100/80 px-2 py-1 rounded inline-block">
                        {papel.nome}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {permissoes.map(perm => (
                  <tr key={perm.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {perm.nome}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {perm.descricao}
                      </div>
                    </td>

                    {papeis.map(papel => {
                      const hasPerm = papel.permissoes?.some(p => p.id === perm.id) || false;
                      const isToggling = togglingKey === `pp-${papel.id}-${perm.id}`;

                      return (
                        <td key={papel.id} className="py-2 px-3 text-center">
                          <button
                            disabled={isToggling}
                            onClick={() => handlePapelPermissaoToggle(papel.id, perm.id, hasPerm)}
                            className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              hasPerm
                                ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                            }`}
                            title={`${hasPerm ? 'Revogar' : 'Conceder'} ${perm.nome} para ${papel.nome}`}
                          >
                            {isToggling ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            ) : hasPerm ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MATRIX 2: Usuários x Papéis */}
      {activeSubTab === 'usuario_papel' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-blue-50/50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-700" />
              <h3 className="text-xs font-bold text-slate-900">
                Atribuição de Papéis por Usuário (Tabela Pivô MySQL <code>usuario_papel</code>)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
              {usuarios.length} Usuários × {papeis.length} Papéis
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                  <th className="py-3 px-4 min-w-[240px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Servidor / Usuário (usuarios)
                  </th>
                  {papeis.map(papel => (
                    <th key={papel.id} className="py-3 px-3 text-center min-w-[130px]">
                      <div className="font-mono text-[10px] font-bold text-blue-900 bg-blue-100/80 px-2 py-1 rounded inline-block">
                        {papel.nome}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-200">
                      <div className="font-semibold text-slate-900 text-xs flex items-center space-x-1.5">
                        <span>{u.nome}</span>
                        {!u.ativo && (
                          <span className="text-[10px] text-rose-600 font-normal">(Inativo)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>

                    {papeis.map(papel => {
                      const hasRole = u.papeis?.some(p => p.id === papel.id) || false;
                      const isToggling = togglingKey === `up-${u.id}-${papel.id}`;

                      return (
                        <td key={papel.id} className="py-2 px-3 text-center">
                          <button
                            disabled={isToggling}
                            onClick={() => handleUsuarioPapelToggle(u.id, papel.id, hasRole)}
                            className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              hasRole
                                ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                            }`}
                            title={`${hasRole ? 'Remover' : 'Atribuir'} papel ${papel.nome} para ${u.nome}`}
                          >
                            {isToggling ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            ) : hasRole ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

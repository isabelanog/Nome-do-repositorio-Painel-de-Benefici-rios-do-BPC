import React from 'react';
import { Usuario } from '../types';
import { X, User, Mail, Calendar, Shield, Key, CheckCircle, XCircle } from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario | null;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              {user.nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">{user.nome}</h3>
                {user.ativo ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                    <XCircle className="w-3 h-3 mr-1" /> Inativo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono">ID #{user.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center space-x-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                <strong>Data de Criação:</strong>{' '}
                {new Date(user.data_criacao).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                <strong>Última Atualização:</strong>{' '}
                {new Date(user.data_atualizacao).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Section 1: Assigned Roles (usuario_papel) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Papéis Vinculados ({user.papeis?.length || 0})</span>
            </h4>

            {user.papeis && user.papeis.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {user.papeis.map(papel => (
                  <div
                    key={papel.id}
                    className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded">
                        {papel.nome}
                      </span>
                      <span className="text-[10px] text-purple-600 font-mono">ID #{papel.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {papel.descricao || 'Sem descrição cadastrada'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                Nenhum papel vinculado a este usuário.
              </div>
            )}
          </div>

          {/* Section 2: Effective Permissions resolved via RBAC */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Key className="w-4 h-4 text-amber-600" />
                <span>
                  Permissões Efetivas Resolvidas ({user.permissoes_efetivas?.length || 0})
                </span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Resolvidas via <code>usuario_papel → papel_permissao</code>
              </span>
            </div>

            {user.permissoes_efetivas && user.permissoes_efetivas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {user.permissoes_efetivas.map(perm => (
                  <div
                    key={perm.id}
                    className="p-2.5 rounded-lg bg-amber-50/40 border border-amber-200/70 flex items-start space-x-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {perm.nome}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-snug">
                        {perm.descricao}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                Este usuário não possui permissões efetivas atribuídas via papéis.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

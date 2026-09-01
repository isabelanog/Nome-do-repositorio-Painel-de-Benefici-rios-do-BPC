import React, { useState, useEffect } from 'react';
import { Papel, Permissao } from '../types';
import { X, ShieldPlus, Save, Key } from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nome: string; descricao?: string; permissao_ids: number[] }) => Promise<void>;
  roleToEdit: Papel | null;
  allPermissoes: Permissao[];
}

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  roleToEdit,
  allPermissoes,
}) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedPermissoes, setSelectedPermissoes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleToEdit) {
      setNome(roleToEdit.nome);
      setDescricao(roleToEdit.descricao || '');
      setSelectedPermissoes(roleToEdit.permissoes?.map(p => p.id) || []);
    } else {
      setNome('');
      setDescricao('');
      setSelectedPermissoes([]);
    }
    setError(null);
  }, [roleToEdit, isOpen]);

  if (!isOpen) return null;

  const togglePermissao = (permId: number) => {
    if (selectedPermissoes.includes(permId)) {
      setSelectedPermissoes(selectedPermissoes.filter(id => id !== permId));
    } else {
      setSelectedPermissoes([...selectedPermissoes, permId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPermissoes.length === allPermissoes.length) {
      setSelectedPermissoes([]);
    } else {
      setSelectedPermissoes(allPermissoes.map(p => p.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O nome do papel é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        nome: nome.trim().toUpperCase().replace(/\s+/g, '_'),
        descricao: descricao.trim(),
        permissao_ids: selectedPermissoes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar papel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {roleToEdit ? 'Editar Papel (Role)' : 'Criar Novo Papel de Acesso'}
              </h3>
              <p className="text-xs text-slate-500">
                Tabela <code className="font-mono text-purple-600 bg-purple-50 px-1 py-0.5 rounded">papeis</code> e vínculo <code className="font-mono text-purple-600 bg-purple-50 px-1 py-0.5 rounded">papel_permissao</code>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Identificador do Papel (Nome) *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: FISCAL_CONTRATOS_BPC ou COORDENADOR_CRAS"
              className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Será salvo no padrão em caixa alta (ex: <code>GESTOR_BPC_RECIFE</code>).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descrição da Função / Atribuição
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva as responsabilidades e escopo de atuação deste papel municipal..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            />
          </div>

          {/* Permissions selection */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600" />
                <span>Permissões Associadas (<code>papel_permissao</code>)</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                {selectedPermissoes.length === allPermissoes.length ? 'Desmarcar Todas' : 'Marcar Todas'}
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {allPermissoes.map(p => (
                <label
                  key={p.id}
                  className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-colors cursor-pointer text-xs ${
                    selectedPermissoes.includes(p.id)
                      ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissoes.includes(p.id)}
                    onChange={() => togglePermissao(p.id)}
                    className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <div className="flex-1">
                    <div className="font-mono font-semibold text-slate-900">{p.nome}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.descricao}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : roleToEdit ? 'Atualizar Papel' : 'Criar Papel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

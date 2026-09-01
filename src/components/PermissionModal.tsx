import React, { useState, useEffect } from 'react';
import { Permissao } from '../types';
import { X, KeyRound, Save } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nome: string; descricao?: string }) => Promise<void>;
  permissionToEdit: Permissao | null;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  permissionToEdit,
}) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permissionToEdit) {
      setNome(permissionToEdit.nome);
      setDescricao(permissionToEdit.descricao || '');
    } else {
      setNome('');
      setDescricao('');
    }
    setError(null);
  }, [permissionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O identificador da permissão é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        nome: nome.trim().toLowerCase().replace(/\s+/g, ':'),
        descricao: descricao.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar permissão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {permissionToEdit ? 'Editar Permissão' : 'Nova Permissão do Sistema'}
              </h3>
              <p className="text-xs text-slate-500">
                Tabela <code className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded">permissoes</code>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Identificador da Permissão *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: laudos:emitir ou beneficios:suspender"
              className="w-full px-3 py-2 text-sm font-mono lowercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Convenção recomendada: <code>modulo:acao</code> (ex: <code>relatorios:exportar</code>)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Descrição da Permissão
            </label>
            <textarea
              rows={3}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Explique exatamente o privilégio que esta permissão concede no painel BPC Recife..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            />
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
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : permissionToEdit ? 'Atualizar Permissão' : 'Criar Permissão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

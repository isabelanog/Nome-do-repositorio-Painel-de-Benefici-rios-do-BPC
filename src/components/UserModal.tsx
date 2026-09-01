import React, { useState, useEffect } from 'react';
import { Usuario, Papel } from '../types';
import { X, UserPlus, Save, Shield, Mail, Lock, User } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nome: string; email: string; senha?: string; ativo: boolean; papel_ids: number[] }) => Promise<void>;
  userToEdit: Usuario | null;
  allPapeis: Papel[];
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  allPapeis,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [selectedPapeis, setSelectedPapeis] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setNome(userToEdit.nome);
      setEmail(userToEdit.email);
      setSenha('');
      setAtivo(userToEdit.ativo);
      setSelectedPapeis(userToEdit.papeis?.map(p => p.id) || []);
    } else {
      setNome('');
      setEmail('');
      setSenha('Recife@2026');
      setAtivo(true);
      setSelectedPapeis(allPapeis.length > 0 ? [allPapeis[0].id] : []);
    }
    setError(null);
  }, [userToEdit, isOpen, allPapeis]);

  if (!isOpen) return null;

  const togglePapel = (papelId: number) => {
    if (selectedPapeis.includes(papelId)) {
      setSelectedPapeis(selectedPapeis.filter(id => id !== papelId));
    } else {
      setSelectedPapeis([...selectedPapeis, papelId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      setError('Nome e e-mail são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        nome: nome.trim(),
        email: email.trim(),
        ...(senha ? { senha } : {}),
        ativo,
        papel_ids: selectedPapeis,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              {userToEdit ? <User className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {userToEdit ? 'Editar Usuário do BPC' : 'Cadastrar Novo Usuário'}
              </h3>
              <p className="text-xs text-slate-500">
                Tabela <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">usuarios</code> e vínculo <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">usuario_papel</code>
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
              Nome Completo *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Maria Alice Ferreira"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              E-mail Institucional *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: maria.ferreira@recife.pe.gov.br"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {userToEdit ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
            </label>
            <div className="relative">
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder={userToEdit ? '••••••••' : 'Digite uma senha segura'}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2.5 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={ativo}
                onChange={e => setAtivo(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-800">
                Usuário Ativo (pode autenticar e operar no painel BPC)
              </span>
            </label>
          </div>

          {/* Role selection */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Atribuição de Papéis (N:N em <code>usuario_papel</code>)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedPapeis.length} selecionado(s)
              </span>
            </label>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {allPapeis.map(p => (
                <label
                  key={p.id}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                    selectedPapeis.includes(p.id)
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPapeis.includes(p.id)}
                    onChange={() => togglePapel(p.id)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{p.nome}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {p.descricao || 'Sem descrição cadastrada'}
                    </div>
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
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : userToEdit ? 'Atualizar Usuário' : 'Criar Usuário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

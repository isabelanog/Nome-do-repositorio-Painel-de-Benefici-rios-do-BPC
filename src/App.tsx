import React, { useState, useEffect, useCallback } from 'react';
import { Usuario, Papel, Permissao, DatabaseStatus, BeneficiarioBPC } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { UsersTab } from './components/UsersTab';
import { RolesTab } from './components/RolesTab';
import { PermissionsTab } from './components/PermissionsTab';
import { RbacMatrixTab } from './components/RbacMatrixTab';
import { DatabaseTab } from './components/DatabaseTab';
import { BeneficiariosTab } from './components/BeneficiariosTab';
import { UserModal } from './components/UserModal';
import { RoleModal } from './components/RoleModal';
import { PermissionModal } from './components/PermissionModal';
import { UserDetailsModal } from './components/UserDetailsModal';
import { Users, Shield, Key, Grid, Database, HeartHandshake, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'papeis' | 'permissoes' | 'matriz' | 'banco' | 'beneficiarios'>('usuarios');
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioBPC[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Papel | null>(null);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permToEdit, setPermToEdit] = useState<Permissao | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<Usuario | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, usersRes, rolesRes, permsRes, benefRes] = await Promise.all([
        api.getStatus().catch(() => null),
        api.getUsuarios().catch(() => []),
        api.getPapeis().catch(() => []),
        api.getPermissoes().catch(() => []),
        api.getBeneficiarios().catch(() => []),
      ]);

      if (statusRes) setStatus(statusRes);
      setUsuarios(usersRes);
      setPapeis(rolesRes);
      setPermissoes(permsRes);
      setBeneficiarios(benefRes);
    } catch (err: any) {
      showToast('Erro ao carregar dados do servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // USERS HANDLERS
  // ==========================================
  const handleSaveUser = async (data: { nome: string; email: string; senha?: string; ativo: boolean; papel_ids: number[] }) => {
    if (userToEdit) {
      await api.updateUsuario(userToEdit.id, data);
      showToast(`Usuário '${data.nome}' atualizado com sucesso!`);
    } else {
      await api.createUsuario(data);
      showToast(`Usuário '${data.nome}' criado com sucesso no MySQL!`);
    }
    await loadData();
  };

  const handleDeleteUser = async (id: number) => {
    const user = usuarios.find(u => u.id === id);
    if (!window.confirm(`Tem certeza que deseja excluir o usuário '${user?.nome || id}'?`)) return;
    try {
      await api.deleteUsuario(id);
      showToast('Usuário excluído com sucesso');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUserStatus = async (user: Usuario) => {
    try {
      await api.updateUsuario(user.id, { ativo: !user.ativo });
      showToast(`Status do usuário '${user.nome}' alterado para ${!user.ativo ? 'Ativo' : 'Inativo'}`);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleViewUserDetails = async (user: Usuario) => {
    try {
      const fullUser = await api.getUsuarioById(user.id);
      setSelectedUserDetails(fullUser);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // ROLES HANDLERS
  // ==========================================
  const handleSaveRole = async (data: { nome: string; descricao?: string; permissao_ids: number[] }) => {
    if (roleToEdit) {
      await api.updatePapel(roleToEdit.id, data);
      showToast(`Papel '${data.nome}' atualizado com sucesso!`);
    } else {
      await api.createPapel(data);
      showToast(`Papel '${data.nome}' criado com sucesso no MySQL!`);
    }
    await loadData();
  };

  const handleDeleteRole = async (id: number) => {
    const role = papeis.find(p => p.id === id);
    if (!window.confirm(`Deseja remover o papel '${role?.nome || id}'? Os vínculos associados serão desfeitos (ON DELETE CASCADE).`)) return;
    try {
      await api.deletePapel(id);
      showToast('Papel excluído com sucesso');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // PERMISSIONS HANDLERS
  // ==========================================
  const handleSavePermission = async (data: { nome: string; descricao?: string }) => {
    if (permToEdit) {
      await api.updatePermissao(permToEdit.id, data);
      showToast(`Permissão '${data.nome}' atualizada com sucesso!`);
    } else {
      await api.createPermissao(data);
      showToast(`Permissão '${data.nome}' cadastrada no MySQL!`);
    }
    await loadData();
  };

  const handleDeletePermission = async (id: number) => {
    const perm = permissoes.find(p => p.id === id);
    if (!window.confirm(`Deseja excluir a permissão '${perm?.nome || id}'?`)) return;
    try {
      await api.deletePermissao(id);
      showToast('Permissão excluída com sucesso');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ==========================================
  // MATRIX TOGGLES
  // ==========================================
  const handleTogglePapelPermissao = async (papelId: number, permId: number, currentlyHas: boolean) => {
    try {
      if (currentlyHas) {
        await api.removePapelPermissao(papelId, permId);
      } else {
        await api.assignPapelPermissao(papelId, permId);
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUsuarioPapel = async (usuarioId: number, papelId: number, currentlyHas: boolean) => {
    try {
      if (currentlyHas) {
        await api.removeUsuarioPapel(usuarioId, papelId);
      } else {
        await api.assignUsuarioPapel(usuarioId, papelId);
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Deseja redefinir os dados iniciais do RBAC do BPC Recife?')) return;
    try {
      await api.resetSeeds();
      showToast('Dados restaurados com sucesso para os valores padrão do Recife!');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Municipal Header */}
      <Header
        status={status}
        loading={loading}
        onRefresh={loadData}
        onResetSeed={handleResetSeed}
        onOpenDbTab={() => setActiveTab('banco')}
      />

      {/* Main Tab Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'usuarios'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuários ({usuarios.length})</span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                usuarios
              </span>
            </button>

            <button
              onClick={() => setActiveTab('papeis')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'papeis'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Papéis ({papeis.length})</span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                papeis
              </span>
            </button>

            <button
              onClick={() => setActiveTab('permissoes')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'permissoes'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Permissões ({permissoes.length})</span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                permissoes
              </span>
            </button>

            <button
              onClick={() => setActiveTab('matriz')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'matriz'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Matriz RBAC (N:N)</span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                pivôs
              </span>
            </button>

            <button
              onClick={() => setActiveTab('banco')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'banco'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Banco MySQL & DDL</span>
            </button>

            <button
              onClick={() => setActiveTab('beneficiarios')}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                activeTab === 'beneficiarios'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Beneficiários BPC ({beneficiarios.length})</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'usuarios' && (
          <UsersTab
            usuarios={usuarios}
            papeis={papeis}
            onAddUser={() => {
              setUserToEdit(null);
              setIsUserModalOpen(true);
            }}
            onEditUser={user => {
              setUserToEdit(user);
              setIsUserModalOpen(true);
            }}
            onViewUserDetails={handleViewUserDetails}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleUserStatus}
          />
        )}

        {activeTab === 'papeis' && (
          <RolesTab
            papeis={papeis}
            allPermissoes={permissoes}
            onAddRole={() => {
              setRoleToEdit(null);
              setIsRoleModalOpen(true);
            }}
            onEditRole={role => {
              setRoleToEdit(role);
              setIsRoleModalOpen(true);
            }}
            onDeleteRole={handleDeleteRole}
          />
        )}

        {activeTab === 'permissoes' && (
          <PermissionsTab
            permissoes={permissoes}
            onAddPermission={() => {
              setPermToEdit(null);
              setIsPermModalOpen(true);
            }}
            onEditPermission={perm => {
              setPermToEdit(perm);
              setIsPermModalOpen(true);
            }}
            onDeletePermission={handleDeletePermission}
          />
        )}

        {activeTab === 'matriz' && (
          <RbacMatrixTab
            usuarios={usuarios}
            papeis={papeis}
            permissoes={permissoes}
            onTogglePapelPermissao={handleTogglePapelPermissao}
            onToggleUsuarioPapel={handleToggleUsuarioPapel}
          />
        )}

        {activeTab === 'banco' && (
          <DatabaseTab status={status} onRefresh={loadData} />
        )}

        {activeTab === 'beneficiarios' && (
          <BeneficiariosTab beneficiarios={beneficiarios} />
        )}
      </main>

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        allPapeis={papeis}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSave={handleSaveRole}
        roleToEdit={roleToEdit}
        allPermissoes={permissoes}
      />

      <PermissionModal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        onSave={handleSavePermission}
        permissionToEdit={permToEdit}
      />

      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        user={selectedUserDetails}
      />
    </div>
  );
}

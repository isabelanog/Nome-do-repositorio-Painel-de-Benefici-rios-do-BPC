import React from 'react';
import { DatabaseStatus } from '../types';
import { Database, Server, RefreshCw, RotateCcw, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  status: DatabaseStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onResetSeed: () => void;
  onOpenDbTab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  loading,
  onRefresh,
  onResetSeed,
  onOpenDbTab,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Municipal Header */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 border border-blue-600/30">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Painel de Beneficiário BPC do Recife
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  RBAC Municipal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Secretaria de Desenvolvimento Social, Direitos Humanos e Políticas sobre Drogas • Recife/PE
              </p>
            </div>
          </div>

          {/* Database & System Live Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Backend Tech Badge */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>Node.js + Fastify</span>
            </div>

            {/* MySQL Connection Status Pill */}
            <button
              onClick={onOpenDbTab}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                status?.connected && status.engine === 'mysql'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="Clique para gerenciar a conexão MySQL"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="font-semibold">
                {status?.connected && status.engine === 'mysql'
                  ? 'MySQL Conectado'
                  : 'MySQL (Modo Simulação)'}
              </span>
              {status?.connected && status.engine === 'mysql' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1.5 pl-1">
              <button
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                onClick={onResetSeed}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                title="Restaurar dados iniciais de RBAC do Recife"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Restaurar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

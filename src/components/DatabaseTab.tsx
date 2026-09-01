import React, { useState, useEffect } from 'react';
import { DatabaseStatus } from '../types';
import { api } from '../services/api';
import {
  Database,
  Server,
  Key,
  Layers,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode,
  Table,
} from 'lucide-react';

interface DatabaseTabProps {
  status: DatabaseStatus | null;
  onRefresh: () => void;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ status, onRefresh }) => {
  const [schemaData, setSchemaData] = useState<{ database: string; ddl: string; tables: any[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testHost, setTestHost] = useState(status?.host || 'localhost');
  const [testPort, setTestPort] = useState(status?.port || 3306);
  const [testUser, setTestUser] = useState(status?.user || 'root');
  const [testPassword, setTestPassword] = useState('');
  const [testDatabase, setTestDatabase] = useState(status?.database || 'bpc_recife_db');

  useEffect(() => {
    api.getSchema().then(setSchemaData).catch(console.error);
  }, []);

  const handleCopyDDL = () => {
    if (schemaData?.ddl) {
      navigator.clipboard.writeText(schemaData.ddl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection({
        host: testHost,
        port: Number(testPort),
        user: testUser,
        password: testPassword,
        database: testDatabase,
      });
      setTestResult(res);
      if (res.success) {
        onRefresh();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Erro ao testar conexão' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                status?.connected && status.engine === 'mysql'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status do Banco de Dados
              </div>
              <div className="text-sm font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                <span>{status?.connected && status.engine === 'mysql' ? 'MySQL Nativo Ativo' : 'Simulador RBAC Ativo'}</span>
                {status?.connected && status.engine === 'mysql' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {status?.message}
          </p>
        </div>

        {/* Configuration Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Configuração Atual
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {status?.database || 'bpc_recife_db'}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600 space-y-1 font-mono">
            <div><strong>Host:</strong> {status?.host || 'localhost'}:{status?.port || 3306}</div>
            <div><strong>Usuário:</strong> {status?.user || 'root'}</div>
          </div>
        </div>

        {/* Entities Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total de Registros
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {status?.counts ? (Object.values(status.counts) as number[]).reduce((a, b) => a + b, 0) : 0} linhas persistidas
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
            <div>• {status?.counts.usuarios || 0} usuários</div>
            <div>• {status?.counts.papeis || 0} papéis</div>
            <div>• {status?.counts.permissoes || 0} permissões</div>
            <div>• {status?.counts.usuario_papel || 0} vínculos u-p</div>
          </div>
        </div>
      </div>

      {/* Tables Structure Visualizer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center space-x-2 mb-4">
          <Table className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Entidades MySQL do Painel BPC Recife
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemaData?.tables.map((tbl, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {tbl.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {status?.counts?.[tbl.name as keyof typeof status.counts] ?? 0} registros
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-snug">{tbl.description}</p>
              <div className="space-y-1 pt-2 border-t border-slate-200/60">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Colunas:
                </div>
                <div className="space-y-0.5">
                  {tbl.columns.map((col: string, cIdx: number) => (
                    <div key={cIdx} className="text-[11px] font-mono text-slate-700 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200/50">
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MySQL Connection Tester Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Play className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Testador de Conexão MySQL em Tempo Real
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Node.js Fastify → mysql2 connection pool
          </span>
        </div>

        <form onSubmit={handleTestConnection} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Host</label>
              <input
                type="text"
                value={testHost}
                onChange={e => setTestHost(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                placeholder="localhost ou IP"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Porta</label>
              <input
                type="number"
                value={testPort}
                onChange={e => setTestPort(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                placeholder="3306"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Usuário</label>
              <input
                type="text"
                value={testUser}
                onChange={e => setTestUser(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                placeholder="root"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                value={testPassword}
                onChange={e => setTestPassword(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                placeholder="Senha do banco"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Database</label>
              <input
                type="text"
                value={testDatabase}
                onChange={e => setTestDatabase(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                placeholder="bpc_recife_db"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs">
              {testResult && (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.message}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={testing}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{testing ? 'Testando Conexão...' : 'Testar Conexão MySQL'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SQL DDL Schema Code Block */}
      <div className="bg-slate-900 text-slate-100 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-200">
              Script DDL MySQL Completo (Tabelas: usuarios, papeis, permissoes, usuario_papel, papel_permissao)
            </span>
          </div>

          <button
            onClick={handleCopyDDL}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-5 font-mono text-xs text-blue-100/90 leading-relaxed overflow-x-auto max-h-96">
          {schemaData?.ddl || '-- Carregando script DDL do MySQL...'}
        </pre>
      </div>
    </div>
  );
};

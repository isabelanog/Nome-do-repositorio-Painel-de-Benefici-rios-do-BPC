import React, { useState } from 'react';
import { BeneficiarioBPC, Usuario } from '../types';
import { Search, HeartHandshake, MapPin, Building, ShieldAlert, CheckCircle } from 'lucide-react';

interface BeneficiariosTabProps {
  beneficiarios: BeneficiarioBPC[];
  currentUser?: Usuario | null;
}

export const BeneficiariosTab: React.FC<BeneficiariosTabProps> = ({
  beneficiarios,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBairro, setFilterBairro] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  const bairros = Array.from(new Set(beneficiarios.map(b => b.bairro_recife))).sort();

  const filtered = beneficiarios.filter(b => {
    const matchesSearch =
      b.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.cpf.includes(searchTerm) ||
      b.nis.includes(searchTerm) ||
      b.numero_beneficio.includes(searchTerm);

    const matchesBairro = filterBairro === 'all' || b.bairro_recife === filterBairro;
    const matchesTipo = filterTipo === 'all' || b.tipo_beneficio === filterTipo;

    return matchesSearch && matchesBairro && matchesTipo;
  });

  return (
    <div className="space-y-4">
      {/* Notice on Protection by RBAC */}
      <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-blue-900">
        <HeartHandshake className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="font-bold text-blue-950">
            Base Municipal de Beneficiários do BPC (LOAS) • Cidade do Recife
          </div>
          <p className="text-blue-800 leading-relaxed">
            Estes registros de idosos e PCDs atendidos pelos CRAS/CREAS do Recife são protegidos
            pela matriz de permissões RBAC configurada no MySQL (<code>beneficiarios:visualizar</code>,{' '}
            <code>beneficiarios:cadastrar</code>, <code>laudos:avaliar</code>).
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CPF, NIS ou Nº do Benefício..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filterBairro}
            onChange={e => setFilterBairro(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Todos os Bairros do Recife</option>
            {bairros.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Todos os Tipos de BPC</option>
            <option value="Idoso (65+)">Idoso (65+)</option>
            <option value="Pessoa com Deficiência (PCD)">Pessoa com Deficiência (PCD)</option>
          </select>
        </div>
      </div>

      {/* Beneficiarios Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Nº Benefício BPC</th>
                <th className="py-3 px-4">Beneficiário(a)</th>
                <th className="py-3 px-4">Tipo / Valor</th>
                <th className="py-3 px-4">Bairro / CRAS de Referência</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">CadÚnico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-900">
                    {b.numero_beneficio}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{b.nome_completo}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      CPF: {b.cpf} • NIS: {b.nis}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{b.tipo_beneficio}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold font-mono">
                      R$ {b.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1 text-slate-800 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{b.bairro_recife}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{b.cras_referencia}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        b.status === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.status === 'Em Análise'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {b.cad_unico_atualizado ? (
                      <span className="inline-flex items-center text-[11px] text-emerald-700 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Atualizado
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] text-amber-700 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-500" /> Requer Atualização
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

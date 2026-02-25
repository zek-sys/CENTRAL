import React, { useMemo, useState, useEffect } from 'react';
import { Calculator, Fuel, Anchor, TrendingUp, RefreshCw } from 'lucide-react';
import { useFinanceiro } from '../../hooks/useFinanceiro';

function formatBRL(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SimuladorContratacao() {
  const { saldos, loading: loadingSaldos, error: errorSaldos, refetch } = useFinanceiro();
  const [rouanet, setRouanet] = useState('');
  const [osf, setOsf] = useState('');
  const [pnab, setPnab] = useState('');
  const [custoFixo, setCustoFixo] = useState('');

  useEffect(() => {
    if (saldos.rouanet != null) setRouanet((prev) => (prev === '' ? String(saldos.rouanet) : prev));
    if (saldos.osf != null) setOsf((prev) => (prev === '' ? String(saldos.osf) : prev));
    if (saldos.pnab != null) setPnab((prev) => (prev === '' ? String(saldos.pnab) : prev));
  }, [saldos.rouanet, saldos.osf, saldos.pnab]);

  const nRouanet = useMemo(() => Number(String(rouanet).replace(',', '.')) || 0, [rouanet]);
  const nOsf = useMemo(() => Number(String(osf).replace(',', '.')) || 0, [osf]);
  const nPnab = useMemo(() => Number(String(pnab).replace(',', '.')) || 0, [pnab]);
  const nCusto = useMemo(() => Number(String(custoFixo).replace(',', '.')) || 0, [custoFixo]);

  const saldoTotal = useMemo(() => nRouanet + nOsf + nPnab, [nRouanet, nOsf, nPnab]);
  const runwayMeses = useMemo(() => {
    if (!nCusto || nCusto <= 0) return null;
    if (saldoTotal <= 0) return 0;
    return saldoTotal / nCusto;
  }, [saldoTotal, nCusto]);

  const runwayTexto = useMemo(() => {
    if (runwayMeses === null) return 'Informe o custo fixo mensal para calcular a autonomia.';
    if (runwayMeses === 0) return 'Sem autonomia: saldo total insuficiente.';
    const meses = Math.floor(runwayMeses);
    const dias = Math.round((runwayMeses - meses) * 30);
    return `${meses} mês(es) e ~${dias} dia(s)`;
  }, [runwayMeses]);

  const corRunway = useMemo(() => {
    if (runwayMeses === null) return 'text-zinc-500';
    if (runwayMeses >= 6) return 'text-green-500';
    if (runwayMeses >= 3) return 'text-[#ebe22f]';
    return 'text-[#db2669]';
  }, [runwayMeses]);

  return (
    <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
      <header className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-[#ebe22f]/10 border border-[#ebe22f]/20 flex items-center justify-center text-[#ebe22f] shadow-inner">
          <Calculator size={22} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400 italic">
            Simulador de Contratação
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Autonomia da frota (Runway) = Saldo Total ÷ Custo Fixo Mensal
          </p>
          {(loadingSaldos || errorSaldos || saldos.saldoTotal != null) && (
            <div className="flex items-center gap-2 mt-2">
              {loadingSaldos && <span className="text-[9px] text-zinc-500">Carregando planilha...</span>}
              {errorSaldos && <span className="text-[9px] text-[#db2669]">{errorSaldos}</span>}
              {saldos.saldoTotal != null && !loadingSaldos && (
                <button type="button" onClick={refetch} className="text-[9px] text-[#ebe22f] uppercase tracking-wider flex items-center gap-1">
                  <RefreshCw size={12} /> Atualizar saldos
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CampoSaldo label="Rouanet" value={rouanet} onChange={setRouanet} />
            <CampoSaldo label="OSF" value={osf} onChange={setOsf} />
            <CampoSaldo label="PNAB" value={pnab} onChange={setPnab} />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
              Custo fixo mensal (R$)
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                value={custoFixo}
                onChange={(e) => setCustoFixo(e.target.value)}
                inputMode="decimal"
                placeholder="Ex: 85000"
                className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none transition-all placeholder:text-zinc-700 shadow-inner"
              />
              <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-zinc-500">
                <Fuel size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 shadow-inner">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400">
                  <Anchor size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                    Saldo Total
                  </p>
                  <p className="text-xl font-black italic tracking-tighter text-white">
                    {formatBRL(saldoTotal)}
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-[#ebe22f]/10 border border-[#ebe22f]/20 flex items-center justify-center text-[#ebe22f]">
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2">
                Autonomia da frota (Runway)
              </p>
              <p className={`text-3xl font-black italic tracking-tighter ${corRunway}`}>
                {runwayMeses === null ? '—' : runwayMeses.toFixed(2)} meses
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-3">
                {runwayTexto}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CampoSaldo({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
        Saldo {label} (R$)
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        className="mt-2 w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none transition-all placeholder:text-zinc-700 shadow-inner"
      />
    </div>
  );
}


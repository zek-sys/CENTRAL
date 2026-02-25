import React, { useMemo, useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { Link2, Wallet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { db } from '../../core/firebase';

const appId = 'central-regatao-v1';

function isDriveLink(raw) {
  const url = (raw || '').trim();
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isGoogle = host.endsWith('google.com') || host.endsWith('googleusercontent.com');
    const isDrive =
      host === 'drive.google.com' ||
      host === 'docs.google.com' ||
      host === 'sheets.google.com';
    return isGoogle && isDrive;
  } catch {
    return false;
  }
}

export default function LancamentoFinanceiro({ userProfile }) {
  const [fonte, setFonte] = useState('Rouanet');
  const [tipo, setTipo] = useState('Saída');
  const [valor, setValor] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [linkDrive, setLinkDrive] = useState('');
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const linkOk = useMemo(() => isDriveLink(linkDrive), [linkDrive]);
  const valorNum = useMemo(() => Number(String(valor).replace(',', '.')), [valor]);
  const valorOk = useMemo(() => Number.isFinite(valorNum) && valorNum > 0, [valorNum]);

  const canSave = linkOk && valorOk && !!competencia && !!descricao && !saving;

  const salvar = async (e) => {
    e.preventDefault();
    setOkMsg('');
    setErrMsg('');

    if (!linkOk) {
      setErrMsg('Trava acionada: anexe um link válido do Google Drive/Docs/Sheets.');
      return;
    }
    if (!valorOk) {
      setErrMsg('Informe um valor válido para o lançamento.');
      return;
    }
    if (!competencia || !descricao) {
      setErrMsg('Complete competência e descrição antes de lançar no baú.');
      return;
    }

    setSaving(true);
    try {
      const ref = collection(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'financeiro_lancamentos',
      );

      await addDoc(ref, {
        fonte,
        tipo,
        valor: valorNum,
        competencia,
        descricao: descricao.trim(),
        linkDrive: linkDrive.trim(),
        criadoPorUID: userProfile?.uid || null,
        criadoPorNome: userProfile?.nome || null,
        createdAt: Timestamp.now(),
      });

      setOkMsg('Lançamento registrado. Ouro Tapajós protegido por link do Drive.');
      setValor('');
      setCompetencia('');
      setDescricao('');
      setLinkDrive('');
    } catch (err) {
      console.error(err);
      setErrMsg('Falha ao registrar o lançamento no Baú Cloud.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
      <header className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-[#ebe22f]/10 border border-[#ebe22f]/20 flex items-center justify-center text-[#ebe22f] shadow-inner">
          <Wallet size={22} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400 italic">
            Lançamento Financeiro
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Trava ativa: apenas links do Google Drive
          </p>
        </div>
      </header>

      <form onSubmit={salvar} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
            Fonte
          </label>
          <select
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
            className="mt-2 w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none appearance-none cursor-pointer transition-all shadow-inner"
          >
            {['Rouanet', 'OSF', 'PNAB'].map((f) => (
              <option key={f} value={f} className="bg-zinc-900 text-white">
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
            Tipo
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="mt-2 w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none appearance-none cursor-pointer transition-all shadow-inner"
          >
            {['Entrada', 'Saída'].map((t) => (
              <option key={t} value={t} className="bg-zinc-900 text-white">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
            Valor (R$)
          </label>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            inputMode="decimal"
            placeholder="Ex: 12500"
            className="mt-2 w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none transition-all placeholder:text-zinc-700 shadow-inner"
          />
        </div>

        <div className="md:col-span-4">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
            Competência (mês)
          </label>
          <input
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            type="month"
            className="mt-2 w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none transition-all shadow-inner"
          />
        </div>

        <div className="md:col-span-8">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
            Descrição
          </label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Pagamento fornecedor de produção"
            className="mt-2 w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-[#ebe22f] outline-none transition-all placeholder:text-zinc-700 shadow-inner"
          />
        </div>

        <div className="md:col-span-12">
          <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
            Link do Drive (obrigatório)
          </label>
          <div className="mt-2 flex flex-col md:flex-row gap-4 items-stretch">
            <div className="flex-1 relative">
              <input
                value={linkDrive}
                onChange={(e) => setLinkDrive(e.target.value)}
                placeholder="Cole aqui o link do Google Drive (sem upload)"
                className={`w-full bg-zinc-900/50 border rounded-2xl p-5 pr-14 text-sm text-white outline-none transition-all placeholder:text-zinc-700 shadow-inner ${
                  linkDrive.length === 0
                    ? 'border-white/10'
                    : linkOk
                      ? 'border-green-500/30 focus:border-green-500'
                      : 'border-[#db2669]/30 focus:border-[#db2669]'
                }`}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2">
                {linkDrive.length === 0 ? (
                  <Link2 size={18} className="text-zinc-700" />
                ) : linkOk ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <AlertTriangle size={18} className="text-[#db2669]" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSave}
              className="md:w-64 px-10 py-5 bg-[#ebe22f] text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#ebe22f]/10 italic disabled:opacity-30 disabled:hover:scale-100"
            >
              {saving ? 'Registrando…' : 'Lançar no Baú'}
            </button>
          </div>

          {errMsg && (
            <div className="mt-4 bg-[#db2669]/10 border border-[#db2669]/20 text-[#db2669] text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl">
              {errMsg}
            </div>
          )}
          {okMsg && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl">
              {okMsg}
            </div>
          )}
        </div>
      </form>
    </section>
  );
}


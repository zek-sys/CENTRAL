import React, { useMemo } from 'react';
import { CalendarDays, Clock } from 'lucide-react';

export default function Cronograma({ acoes, userUid }) {
  const futuras = useMemo(() => {
    return (acoes || [])
      .filter((a) => a.prazo)
      .filter((a) => !userUid || a.uidResponsavel === userUid)
      .sort((a, b) => (a.prazo > b.prazo ? 1 : -1))
      .slice(0, 8);
  }, [acoes, userUid]);

  if (!futuras.length) {
    return null;
  }

  return (
    <section className="mt-12 bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] shadow-2xl">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-[#ebe22f]/10 text-[#ebe22f] flex items-center justify-center">
          <CalendarDays size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-400 italic">
            Cronograma de Bordo
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            Próximas remadas por prazo
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {futuras.map((acao) => (
          <div
            key={acao.id}
            className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl px-5 py-3"
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-white truncate">
                {acao.nome}
              </span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                {acao.projetoNome || acao.projetoId || 'Projeto não informado'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#ebe22f] text-[10px] font-black uppercase tracking-widest">
              <Clock size={14} />
              <span>
                {acao.prazo?.split('-').reverse().join('/') || 'Sem prazo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


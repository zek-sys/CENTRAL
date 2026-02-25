/**
 * Seção Checklist Tático do Dia (Meu Convés). Preserva layout e cores (Ouro Tapajós, Cinza Chumbo).
 */
import React from "react";
import { CheckCircle, Zap } from "lucide-react";
import CardTarefa from "./CardTarefa";

export default function ChecklistTatico({ itens = [], onConcluir }) {
  return (
    <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
      <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-500 italic mb-10 flex items-center gap-4">
        <CheckCircle size={20} className="text-[#ebe22f]" /> Checklist Tático do Dia
      </h3>

      <div className="space-y-4">
        {itens.length === 0 ? (
          <div className="py-24 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-4">
            <Zap size={40} className="text-zinc-600" />
            Águas calmas. Nenhuma remada no seu radar.
          </div>
        ) : (
          itens.map((acao) => (
            <CardTarefa key={acao.id} acao={acao} onConcluir={onConcluir} />
          ))
        )}
      </div>
    </section>
  );
}

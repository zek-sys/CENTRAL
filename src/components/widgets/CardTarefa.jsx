/**
 * Card de uma tarefa no Checklist Tático. Manual de Marca: Ouro Tapajós, Cinza Chumbo.
 * Trava IN 29: só permite Concluir com NF + PIX (ou Lista) + Foto preenchidos.
 */
import React from "react";
import EvidenceBadge from "./EvidenceBadge";

function triadeIN29Ok(acao) {
  const nf = acao.temNf === "Sim";
  const foto = acao.temFoto === "Sim";
  const pixOuLista = acao.temPix === "Sim" || acao.temLista === "Sim";
  return nf && foto && pixOuLista;
}

export default function CardTarefa({ acao, onConcluir }) {
  const podeConcluir = triadeIN29Ok(acao);

  return (
    <div className="bg-black/60 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-[#ebe22f]/50 transition-all shadow-xl hover:shadow-[#ebe22f]/5">
      <div className="mb-6 md:mb-0">
        <h6 className="text-lg font-black uppercase italic text-white group-hover:text-[#ebe22f] transition-colors leading-none tracking-tight">
          {acao.nome}
        </h6>
        <div className="flex gap-3 mt-4 flex-wrap">
          <EvidenceBadge label="NF" ok={acao.temNf === "Sim"} />
          <EvidenceBadge label="PIX" ok={acao.temPix === "Sim"} />
          <EvidenceBadge label="Lista" ok={acao.temLista === "Sim"} />
          <EvidenceBadge label="Foto" ok={acao.temFoto === "Sim"} />
        </div>
        {!podeConcluir && (
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-2 italic">
            IN 29: NF + PIX ou Lista + Foto para concluir
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onConcluir(acao)}
        disabled={!podeConcluir}
        className={`w-full md:w-auto px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl italic ${
          podeConcluir
            ? "bg-[#ebe22f] text-black hover:scale-105 active:scale-95 shadow-[#ebe22f]/10"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
        }`}
      >
        Concluir
      </button>
    </div>
  );
}

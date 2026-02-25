/**
 * Hub Projetos (Mapa de Batalha) — Frota + Folha de Rosto (Eixos Secundários, RACI, Produtos Finais com Teto R$).
 */
import React, { useState, useMemo } from "react";
import { Map, ChevronRight, FileText, Users, Package } from "lucide-react";
import Badge from "../components/ui/Badge";

const RACI_LABELS = { R: "Responsável", A: "Aprovador", C: "Consultado", I: "Informado" };

export default function ProjetosHub({ projetos }) {
  const [selectedId, setSelectedId] = useState(null);
  const [folhaRosto, setFolhaRosto] = useState({
    eixosSecundarios: [""],
    raci: [{ atividade: "", pessoa: "", papel: "R" }],
    produtosFinais: [{ descricao: "", teto: "" }],
  });

  const selectedProjeto = useMemo(
    () => projetos.find((p) => p.id === selectedId),
    [projetos, selectedId],
  );

  const addEixo = () => setFolhaRosto((f) => ({ ...f, eixosSecundarios: [...f.eixosSecundarios, ""] }));
  const setEixo = (i, v) =>
    setFolhaRosto((f) => ({
      ...f,
      eixosSecundarios: f.eixosSecundarios.map((e, j) => (j === i ? v : e)),
    }));

  const addRaci = () =>
    setFolhaRosto((f) => ({
      ...f,
      raci: [...f.raci, { atividade: "", pessoa: "", papel: "R" }],
    }));
  const setRaci = (i, field, value) =>
    setFolhaRosto((f) => ({
      ...f,
      raci: f.raci.map((r, j) => (j === i ? { ...r, [field]: value } : r)),
    }));

  const addProduto = () =>
    setFolhaRosto((f) => ({
      ...f,
      produtosFinais: [...f.produtosFinais, { descricao: "", teto: "" }],
    }));
  const setProduto = (i, field, value) =>
    setFolhaRosto((f) => ({
      ...f,
      produtosFinais: f.produtosFinais.map((p, j) => (j === i ? { ...p, [field]: value } : p)),
    }));

  const totalTeto = useMemo(
    () =>
      folhaRosto.produtosFinais.reduce(
        (acc, p) => acc + (Number(p.teto) || 0),
        0,
      ),
    [folhaRosto.produtosFinais],
  );

  return (
    <div className="space-y-16 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projetos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
            className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] flex flex-col justify-between group h-80 hover:border-[#ebe22f]/40 transition-all shadow-3xl overflow-hidden relative text-left"
          >
            <div className="relative z-10">
              <Badge variant="brand">{p.mecanismo || "Projeto"}</Badge>
              <h3 className="text-3xl font-black uppercase italic text-white mt-6 leading-[0.9] group-hover:text-[#ebe22f] transition-colors tracking-tighter">
                {p.nome}
              </h3>
            </div>
            <div className="flex justify-between items-end border-t border-white/5 pt-6 relative z-10">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
                Captado: <span className="text-[#ebe22f]">R$ {Number(p.valorCaptado || 0).toLocaleString()}</span>
              </p>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#ebe22f] group-hover:text-black transition-all shadow-2xl">
                <ChevronRight size={18} strokeWidth={4} />
              </div>
            </div>
            <Map size={140} className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12 text-white" />
          </button>
        ))}
      </div>

      {(selectedProjeto != null) && (
        <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-500 italic mb-10 flex items-center gap-4">
            <FileText size={20} className="text-[#ebe22f]" /> Folha de Rosto
            {selectedProjeto && (
              <span className="text-white font-normal">— {selectedProjeto.nome}</span>
            )}
          </h3>

          <div className="space-y-12">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ebe22f] mb-4 flex items-center gap-2">
                <Map size={14} /> Eixos Secundários
              </h4>
              <div className="space-y-3">
                {folhaRosto.eixosSecundarios.map((eixo, i) => (
                  <input
                    key={i}
                    type="text"
                    value={eixo}
                    onChange={(e) => setEixo(i, e.target.value)}
                    placeholder="Eixo secundário"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#ebe22f] outline-none placeholder:text-zinc-600"
                  />
                ))}
                <button
                  type="button"
                  onClick={addEixo}
                  className="text-[10px] font-black text-[#ebe22f] uppercase tracking-widest hover:underline"
                >
                  + Adicionar eixo
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ebe22f] mb-4 flex items-center gap-2">
                <Users size={14} /> Matriz de Equipe (RACI)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-3 pr-4">Atividade</th>
                      <th className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-3 pr-4">Pessoa</th>
                      <th className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-3 pr-4">Papel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folhaRosto.raci.map((r, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 pr-4">
                          <input
                            type="text"
                            value={r.atividade}
                            onChange={(e) => setRaci(i, "atividade", e.target.value)}
                            placeholder="Atividade"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-[#ebe22f] outline-none min-w-[160px]"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="text"
                            value={r.pessoa}
                            onChange={(e) => setRaci(i, "pessoa", e.target.value)}
                            placeholder="Pessoa"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-[#ebe22f] outline-none min-w-[120px]"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={r.papel}
                            onChange={(e) => setRaci(i, "papel", e.target.value)}
                            className="bg-zinc-900/50 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-[#ebe22f] outline-none"
                          >
                            {Object.entries(RACI_LABELS).map(([k, v]) => (
                              <option key={k} value={k} className="bg-zinc-900">{v} ({k})</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={addRaci}
                  className="mt-3 text-[10px] font-black text-[#ebe22f] uppercase tracking-widest hover:underline"
                >
                  + Adicionar linha RACI
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ebe22f] mb-4 flex items-center gap-2">
                <Package size={14} /> Produtos Finais — Teto (R$)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-3 pr-4">Produto final</th>
                      <th className="text-[9px] font-black uppercase tracking-widest text-zinc-500 py-3 pr-4 w-40">Teto (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folhaRosto.produtosFinais.map((p, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 pr-4">
                          <input
                            type="text"
                            value={p.descricao}
                            onChange={(e) => setProduto(i, "descricao", e.target.value)}
                            placeholder="Descrição do produto"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-[#ebe22f] outline-none min-w-[200px]"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={p.teto}
                            onChange={(e) => setProduto(i, "teto", e.target.value)}
                            placeholder="0,00"
                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-[#ebe22f] outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={addProduto}
                  className="mt-3 text-[10px] font-black text-[#ebe22f] uppercase tracking-widest hover:underline"
                >
                  + Adicionar produto
                </button>
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#ebe22f] italic">
                    Total Teto: R$ {totalTeto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

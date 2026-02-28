/**
 * Guia de Bordo — Página de suporte centralizada por nível de acesso.
 * Manuais: Comandante (Diretoria), Timoneiro (Facilitador), Tripulante (Agente).
 * Offline-first: conteúdo estático em bundle para leitura sem rede.
 * bg-black, zinc-300, Amarelo Festival para comandos críticos.
 */
import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Compass } from "lucide-react";
import {
  MANUAL_COMANDANTE,
  MANUAL_TIMONEIRO,
  MANUAL_TRIPULANTE,
  getManualPorPapel,
} from "../data/guiaDeBordoManuais";

const AMARELO_FESTIVAL = "#EBE22F";

/** Termos que devem ser destacados em Amarelo Festival no texto */
const TERMOS_DESTAQUE = [
  "Sincronizar",
  "Sincronização",
  "Trava de Provas",
  "Guardado no celular",
  "Modo Econômico",
  "Régua de Maturidade",
  "Mural de Ecos",
  "Fale com a Gestão",
  "Diário de Bordo",
  "Núcleo Pedagógico",
];

function highlightText(text) {
  if (!text || typeof text !== "string") return text;
  let result = text;
  for (const termo of TERMOS_DESTAQUE) {
    const re = new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    result = result.replace(re, "\u0001$1\u0002");
  }
  const parts = result.split(/(\u0001[^\u0002]*\u0002)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("\u0001") && p.endsWith("\u0002")) {
      const inner = p.slice(1, -1);
      return (
        <span key={i} style={{ color: AMARELO_FESTIVAL }} className="font-semibold">
          {inner}
        </span>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

function AccordionSecao({ secao, open, onToggle }) {
  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
      <button
        type="button"
        onClick={onToggle}
        className="w-full min-h-[52px] flex items-center justify-between gap-3 px-4 py-3 text-left font-medium text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            {secao.icone}
          </span>
          {secao.titulo}
        </span>
        {open ? (
          <ChevronDown size={20} className="text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight size={20} className="text-zinc-500 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-zinc-800/80">
          <p className="text-sm text-zinc-300 leading-relaxed pt-3">{highlightText(secao.conteudo)}</p>
        </div>
      )}
    </div>
  );
}

export default function GuiaDeBordoPage({ userProfile, isAdmin, isDiretoria }) {
  const [abaAtiva, setAbaAtiva] = useState("comandante");
  const [abertoSecoes, setAbertoSecoes] = useState({});

  const papel = useMemo(() => {
    if (isAdmin) return abaAtiva;
    if (isDiretoria) return "comandante";
    const isFacilitador =
      userProfile?.nucleo === "Pedagógico" ||
      (Array.isArray(userProfile?.nucleos) && userProfile.nucleos.some((n) => String(n).toLowerCase().includes("pedag")));
    if (isFacilitador) return "timoneiro";
    return "tripulante";
  }, [isAdmin, isDiretoria, abaAtiva, userProfile?.nucleo, userProfile?.nucleos]);

  const manual = useMemo(() => getManualPorPapel(papel), [papel]);
  const toggleSecao = (id) => setAbertoSecoes((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-full bg-black text-zinc-300">
      <div className="max-w-2xl mx-auto py-6 px-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(235, 226, 47, 0.15)" }}
          >
            <Compass size={26} style={{ color: AMARELO_FESTIVAL }} aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Guia de Bordo</h1>
            <p className="text-sm text-zinc-500">Manuais por nível de acesso. Leitura disponível offline.</p>
          </div>
        </div>

        {/* Admin: seletor de manual (abas) */}
        {isAdmin && (
          <div className="flex gap-2 mb-6 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
            {[
              { id: "comandante", label: "Comandante", icone: MANUAL_COMANDANTE.icone },
              { id: "timoneiro", label: "Timoneiro", icone: MANUAL_TIMONEIRO.icone },
              { id: "tripulante", label: "Tripulante", icone: MANUAL_TRIPULANTE.icone },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAbaAtiva(tab.id)}
                className={`flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                  abaAtiva === tab.id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <span aria-hidden>{tab.icone}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Cabeçalho do manual ativo */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 mb-6">
          <p className="text-3xl mb-2" aria-hidden>
            {manual.icone}
          </p>
          <h2 className="text-lg font-bold text-white">{manual.titulo}</h2>
          <p className="text-sm text-zinc-500 mt-1">{manual.descricao}</p>
        </section>

        {/* Accordions por secção */}
        <section aria-label={`Conteúdo do ${manual.titulo}`} className="space-y-3">
          {manual.secoes.map((secao) => (
            <AccordionSecao
              key={secao.id}
              secao={secao}
              open={abertoSecoes[secao.id] !== false}
              onToggle={() => toggleSecao(secao.id)}
            />
          ))}
        </section>

        <p className="text-xs text-zinc-500 mt-8 text-center">
          Esta página é cacheada para leitura offline. Atualize a app para ver alterações de conteúdo.
        </p>
      </div>
    </div>
  );
}
